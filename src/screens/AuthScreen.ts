import { signInWithEmailPassword, signUpWithPassword } from '../lib/supabase';

export interface AuthScreenOptions {
  root: HTMLElement;
}

type Mode = 'signin' | 'signup';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function renderAuthScreen(opts: AuthScreenOptions): void {
  let mode: Mode = 'signin';

  function paint() {
    const isSignUp = mode === 'signup';
    opts.root.innerHTML = `
      <main class="min-h-[100dvh] flex flex-col items-center justify-center px-6 py-10">
        <div class="w-full max-w-sm">
          <div class="text-center mb-8">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style="background: radial-gradient(circle at 30% 25%, rgba(255,255,255,0.4), #f43f5e 55%); box-shadow: 0 12px 32px -8px rgba(244,63,94,0.55);">
              <span class="text-3xl">🎯</span>
            </div>
            <h1 class="text-4xl font-bold tracking-tight">Tap Frenzy</h1>
            <p class="text-slate-400 mt-2 text-sm">Tap the shrinking circles before they vanish.</p>
          </div>

          <div class="card p-5">
            <div class="grid grid-cols-2 gap-1 p-1 rounded-xl bg-black/30 mb-5" role="tablist">
              <button data-mode="signin" role="tab" aria-selected="${!isSignUp}" class="py-2 rounded-lg text-sm font-medium transition-all ${!isSignUp ? 'bg-slate-800 text-white shadow' : 'text-slate-400'}">Sign in</button>
              <button data-mode="signup" role="tab" aria-selected="${isSignUp}" class="py-2 rounded-lg text-sm font-medium transition-all ${isSignUp ? 'bg-slate-800 text-white shadow' : 'text-slate-400'}">Sign up</button>
            </div>

            <form id="auth-form" class="space-y-4" autocomplete="on" novalidate>
              <div>
                <label for="email" class="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Email</label>
                <input id="email" name="email" type="email" inputmode="email" autocomplete="email" required placeholder="you@example.com" class="input" />
              </div>
              <div>
                <label for="password" class="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Password</label>
                <input id="password" name="password" type="password" autocomplete="${isSignUp ? 'new-password' : 'current-password'}" required minlength="6" placeholder="At least 6 characters" class="input" />
              </div>
              <button id="auth-submit" type="submit" class="btn-primary w-full">${isSignUp ? 'Create account' : 'Sign in'}</button>
              <p id="auth-message" class="text-xs text-slate-400 text-center min-h-[1rem]" aria-live="polite"></p>
            </form>
          </div>

          <p class="text-center text-xs text-slate-500 mt-6">
            ${isSignUp ? 'Already have an account?' : 'New here?'}
            <button data-switch="${isSignUp ? 'signin' : 'signup'}" class="text-rose-400 hover:text-rose-300 font-medium ml-1">${isSignUp ? 'Sign in' : 'Create an account'}</button>
          </p>
        </div>
      </main>
    `;
    bind();
  }

  function bind() {
    const form = opts.root.querySelector<HTMLFormElement>('#auth-form')!;
    const emailInput = opts.root.querySelector<HTMLInputElement>('#email')!;
    const passwordInput = opts.root.querySelector<HTMLInputElement>('#password')!;
    const submitBtn = opts.root.querySelector<HTMLButtonElement>('#auth-submit')!;
    const messageEl = opts.root.querySelector<HTMLParagraphElement>('#auth-message')!;

    opts.root.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((b) => {
      b.addEventListener('click', () => {
        const next = b.dataset.mode as Mode;
        if (next !== mode) {
          mode = next;
          paint();
        }
      });
    });
    const switchLink = opts.root.querySelector<HTMLButtonElement>('[data-switch]');
    switchLink?.addEventListener('click', () => {
      mode = switchLink.dataset.switch as Mode;
      paint();
    });

    function setMsg(text: string, tone: 'info' | 'error' | 'success') {
      messageEl.classList.remove('text-slate-400', 'text-rose-400', 'text-emerald-400');
      messageEl.classList.add(
        tone === 'error' ? 'text-rose-400' : tone === 'success' ? 'text-emerald-400' : 'text-slate-400',
      );
      messageEl.textContent = text;
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = emailInput.value.trim();
      const password = passwordInput.value;

      if (!email || !EMAIL_RE.test(email)) {
        setMsg('Enter a valid email address.', 'error');
        return;
      }
      if (password.length < 6) {
        setMsg('Password must be at least 6 characters.', 'error');
        return;
      }

      submitBtn.disabled = true;
      const originalLabel = submitBtn.textContent ?? '';
      submitBtn.textContent = mode === 'signup' ? 'Creating account…' : 'Signing in…';
      setMsg(mode === 'signup' ? 'Creating your account…' : 'Signing in…', 'info');

      if (mode === 'signup') {
        const result = await signUpWithPassword(email, password);
        submitBtn.disabled = false;
        submitBtn.textContent = originalLabel;
        if (result.kind === 'error') {
          setMsg(result.message, 'error');
        } else if (result.kind === 'confirm-email') {
          setMsg('Account created — check your inbox to confirm your email, then sign in.', 'success');
        }
      } else {
        const { error } = await signInWithEmailPassword(email, password);
        submitBtn.disabled = false;
        submitBtn.textContent = originalLabel;
        if (error) {
          if (/email not confirmed/i.test(error)) {
            setMsg('Confirm your email first — check your inbox for the confirmation link.', 'error');
          } else {
            setMsg(error, 'error');
          }
        }
      }
    });
  }

  paint();
}

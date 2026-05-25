import { sendMagicLink } from '../lib/supabase';

export interface AuthScreenOptions {
  root: HTMLElement;
}

export function renderAuthScreen(opts: AuthScreenOptions): void {
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

        <form id="auth-form" class="card p-5 space-y-4" autocomplete="on" novalidate>
          <div>
            <label for="email" class="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Email</label>
            <input id="email" name="email" type="email" inputmode="email" autocomplete="email" required placeholder="you@example.com" class="input" />
          </div>
          <button id="auth-submit" type="submit" class="btn-primary w-full">Send magic link</button>
          <p id="auth-message" class="text-xs text-slate-400 text-center min-h-[1rem]" aria-live="polite"></p>
        </form>

        <p class="text-center text-xs text-slate-500 mt-6">No password. We email a one-tap sign-in link.</p>
      </div>
    </main>
  `;

  const form = opts.root.querySelector<HTMLFormElement>('#auth-form')!;
  const emailInput = opts.root.querySelector<HTMLInputElement>('#email')!;
  const submitBtn = opts.root.querySelector<HTMLButtonElement>('#auth-submit')!;
  const messageEl = opts.root.querySelector<HTMLParagraphElement>('#auth-message')!;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      messageEl.textContent = 'Enter a valid email address.';
      messageEl.classList.remove('text-emerald-400');
      messageEl.classList.add('text-rose-400');
      return;
    }
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';
    messageEl.classList.remove('text-rose-400', 'text-emerald-400');
    messageEl.classList.add('text-slate-400');
    messageEl.textContent = 'Sending magic link…';

    const { error } = await sendMagicLink(email);

    submitBtn.disabled = false;
    submitBtn.textContent = 'Send magic link';
    if (error) {
      messageEl.classList.remove('text-slate-400', 'text-emerald-400');
      messageEl.classList.add('text-rose-400');
      messageEl.textContent = error;
    } else {
      messageEl.classList.remove('text-slate-400', 'text-rose-400');
      messageEl.classList.add('text-emerald-400');
      messageEl.textContent = 'Check your inbox — tap the link to sign in.';
    }
  });
}

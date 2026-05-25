import { signOut } from '../lib/supabase';

export interface HomeScreenOptions {
  root: HTMLElement;
  email: string | null;
  onPlay: () => void;
  onLeaderboard: () => void;
  onSignedOut: () => void;
}

function nameFromEmail(email: string | null): string {
  if (!email) return 'player';
  const local = email.split('@')[0];
  return local.length > 18 ? local.slice(0, 18) + '…' : local;
}

export function renderHomeScreen(opts: HomeScreenOptions): void {
  const name = nameFromEmail(opts.email);
  opts.root.innerHTML = `
    <main class="min-h-[100dvh] flex flex-col px-6 py-10">
      <header class="flex items-center justify-between mb-10">
        <div>
          <p class="text-xs uppercase tracking-wider text-slate-500">Signed in as</p>
          <p class="font-semibold text-slate-200 truncate max-w-[60vw]">${escapeHtml(name)}</p>
        </div>
        <button id="sign-out" class="btn-ghost text-sm">Sign out</button>
      </header>

      <section class="flex-1 flex flex-col items-center justify-center text-center">
        <div class="inline-flex items-center justify-center w-24 h-24 rounded-3xl mb-6" style="background: radial-gradient(circle at 30% 25%, rgba(255,255,255,0.45), #f43f5e 55%); box-shadow: 0 16px 40px -8px rgba(244,63,94,0.55);">
          <span class="text-5xl">🎯</span>
        </div>
        <h1 class="text-5xl font-bold tracking-tight">Tap Frenzy</h1>
        <p class="text-slate-400 mt-3 max-w-xs">
          Pop the shrinking circles before they vanish. 30 seconds. 3 lives. One shot at glory.
        </p>

        <div class="mt-10 w-full max-w-xs space-y-3">
          <button id="play" class="btn-primary w-full text-lg py-4">Play</button>
          <button id="leaderboard" class="btn-ghost w-full">Leaderboard</button>
        </div>
      </section>

      <footer class="text-center text-xs text-slate-600 mt-8">
        +1 per tap · -1 life per miss · circles speed up every 10 points
      </footer>
    </main>
  `;

  opts.root.querySelector<HTMLButtonElement>('#play')!.addEventListener('click', () => opts.onPlay());
  opts.root
    .querySelector<HTMLButtonElement>('#leaderboard')!
    .addEventListener('click', () => opts.onLeaderboard());
  opts.root.querySelector<HTMLButtonElement>('#sign-out')!.addEventListener('click', async () => {
    await signOut();
    opts.onSignedOut();
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

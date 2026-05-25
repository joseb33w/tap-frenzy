import { populateLeaderboards, renderLeaderboardShell } from '../components/Leaderboard';

export interface LeaderboardScreenOptions {
  root: HTMLElement;
  currentUserId: string | null;
  onHome: () => void;
  onPlay: () => void;
}

export function renderLeaderboardScreen(opts: LeaderboardScreenOptions): void {
  opts.root.innerHTML = `
    <main class="min-h-[100dvh] flex flex-col px-5 py-6">
      <header class="flex items-center justify-between mb-5">
        <button id="home-btn" class="btn-ghost text-sm py-1.5 px-3">← Home</button>
        <h1 class="text-xl font-bold">Leaderboard</h1>
        <button id="play-btn" class="btn-primary text-sm py-1.5 px-3">Play</button>
      </header>
      <div id="lb-root">${renderLeaderboardShell()}</div>
    </main>
  `;

  opts.root.querySelector<HTMLButtonElement>('#home-btn')!.addEventListener('click', () => opts.onHome());
  opts.root.querySelector<HTMLButtonElement>('#play-btn')!.addEventListener('click', () => opts.onPlay());

  void populateLeaderboards(opts.root.querySelector('#lb-root')!, opts.currentUserId);
}

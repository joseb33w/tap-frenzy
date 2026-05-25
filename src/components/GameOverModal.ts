import type { GameState } from '../game/Score';

export interface GameOverModalCallbacks {
  onTryAgain: () => void;
  onLeaderboard: () => void;
}

export type SubmitStatus = 'idle' | 'pending' | 'saved' | 'error' | 'offline';

export function renderGameOverModal(state: GameState, status: SubmitStatus, submitError: string | null): string {
  const reasonText =
    state.reason === 'time'
      ? "Time's up!"
      : state.reason === 'lives'
        ? 'No lives left!'
        : 'Round over';
  let submitLine = '';
  if (status === 'pending') {
    submitLine = '<p class="text-xs text-slate-400 mt-3">Saving your score40</p>';
  } else if (status === 'saved') {
    submitLine = '<p class="text-xs text-emerald-400 mt-3">Score saved.</p>';
  } else if (status === 'error') {
    submitLine = `<p class="text-xs text-rose-400 mt-3">Could not save: ${escapeHtml(submitError ?? 'unknown error')}</p>`;
  } else if (status === 'offline') {
    submitLine = '<p class="text-xs text-slate-400 mt-3">Offline mode — score not saved.</p>';
  }

  return `
    <div class="fixed inset-0 z-30 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm" data-testid="game-over">
      <div class="card w-full max-w-sm p-6 text-center">
        <h2 class="text-2xl font-bold mb-1">${escapeHtml(reasonText)}</h2>
        <p class="text-sm text-slate-400">You scored</p>
        <div class="my-4">
          <span class="font-display font-bold text-6xl bg-gradient-to-br from-rose-400 to-amber-300 bg-clip-text text-transparent tabular-nums" data-testid="final-score">${state.score}</span>
        </div>
        ${submitLine}
        <div class="mt-5 flex flex-col gap-2">
          <button class="btn-primary w-full" data-action="try-again" ${status === 'pending' ? 'disabled' : ''}>Try again</button>
          <button class="btn-ghost w-full" data-action="leaderboard">Leaderboard</button>
        </div>
      </div>
    </div>
  `;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function bindGameOverModal(root: ParentNode, cbs: GameOverModalCallbacks): void {
  const tryAgain = root.querySelector<HTMLButtonElement>('[data-action="try-again"]');
  const lb = root.querySelector<HTMLButtonElement>('[data-action="leaderboard"]');
  tryAgain?.addEventListener('click', () => cbs.onTryAgain());
  lb?.addEventListener('click', () => cbs.onLeaderboard());
}

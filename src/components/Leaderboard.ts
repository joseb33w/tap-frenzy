import { fetchGlobalTopScores, fetchMyTopScores, type LeaderboardEntry } from '../lib/supabase';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

function row(rank: number, entry: LeaderboardEntry, isYou: boolean): string {
  const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
  const youBadge = isYou ? '<span class="ml-2 inline-block rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5">you</span>' : '';
  return `
    <li class="flex items-center justify-between px-4 py-3 border-b border-white/5 last:border-0">
      <div class="flex items-center gap-3 min-w-0">
        <span class="font-display font-semibold text-sm w-8 text-slate-400 shrink-0">${medal}</span>
        <span class="font-medium text-slate-100 truncate">${escapeHtml(entry.display_name)}${youBadge}</span>
      </div>
      <div class="flex items-baseline gap-3 shrink-0">
        <span class="font-display font-bold text-lg text-white tabular-nums">${entry.score}</span>
        <span class="text-xs text-slate-500 w-12 text-right">${formatDate(entry.played_at)}</span>
      </div>
    </li>
  `;
}

function emptyState(message: string): string {
  return `
    <div class="px-4 py-10 text-center text-slate-500 text-sm">
      ${escapeHtml(message)}
    </div>
  `;
}

export function renderLeaderboardShell(): string {
  return `
    <div class="space-y-4">
      <section class="card overflow-hidden">
        <header class="flex items-center justify-between px-4 pt-4 pb-2">
          <h2 class="text-lg font-semibold">Your top 5</h2>
          <span class="text-xs text-slate-500">personal best</span>
        </header>
        <ol id="lb-personal" class="px-0 pb-2">
          <li class="px-4 py-3 text-sm text-slate-500">Loading…</li>
        </ol>
      </section>
      <section class="card overflow-hidden">
        <header class="flex items-center justify-between px-4 pt-4 pb-2">
          <h2 class="text-lg font-semibold">Global top 10</h2>
          <span class="text-xs text-slate-500">all players</span>
        </header>
        <ol id="lb-global" class="px-0 pb-2">
          <li class="px-4 py-3 text-sm text-slate-500">Loading…</li>
        </ol>
      </section>
    </div>
  `;
}

export async function populateLeaderboards(root: ParentNode, currentUserId: string | null): Promise<void> {
  const personalEl = root.querySelector('#lb-personal');
  const globalEl = root.querySelector('#lb-global');
  if (!personalEl || !globalEl) return;

  const [mine, global] = await Promise.all([fetchMyTopScores(5), fetchGlobalTopScores(10)]);

  if (mine.error) {
    personalEl.innerHTML = `<li>${emptyState(`Could not load your scores: ${mine.error}`)}</li>`;
  } else if (mine.rows.length === 0) {
    personalEl.innerHTML = `<li>${emptyState('No games yet. Play a round to set your first score.')}</li>`;
  } else {
    personalEl.innerHTML = mine.rows.map((e, i) => row(i + 1, e, true)).join('');
  }

  if (global.error) {
    globalEl.innerHTML = `<li>${emptyState(`Could not load global scores: ${global.error}`)}</li>`;
  } else if (global.rows.length === 0) {
    globalEl.innerHTML = `<li>${emptyState('Be the first to set a global score.')}</li>`;
  } else {
    globalEl.innerHTML = global.rows
      .map((e, i) => row(i + 1, e, !!currentUserId && e.user_id === currentUserId))
      .join('');
  }
}

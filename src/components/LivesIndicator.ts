import { STARTING_LIVES } from '../game/Score';

export function renderLivesIndicator(lives: number): string {
  const total = STARTING_LIVES;
  const cells: string[] = [];
  for (let i = 0; i < total; i++) {
    const filled = i < lives;
    cells.push(
      filled
        ? '<span aria-label="life" class="text-rose-400 drop-shadow-[0_0_6px_rgba(244,63,94,0.7)] text-xl leading-none">♥</span>'
        : '<span aria-label="lost life" class="text-slate-700 text-xl leading-none">♡</span>',
    );
  }
  return `<div class="flex items-center gap-1.5" data-lives="${lives}">${cells.join('')}</div>`;
}

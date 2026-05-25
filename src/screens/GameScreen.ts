import { formatTime, remainingMsFromState, startGameLoop, type GameLoopHandle } from '../game/GameLoop';
import type { GameState } from '../game/Score';
import { renderLivesIndicator } from '../components/LivesIndicator';
import { bindGameOverModal, renderGameOverModal, type SubmitStatus } from '../components/GameOverModal';
import { submitScore } from '../lib/supabase';

export interface GameScreenOptions {
  root: HTMLElement;
  onHome: () => void;
  onLeaderboard: () => void;
  isOffline?: boolean;
}

export function renderGameScreen(opts: GameScreenOptions): { stop: () => void } {
  let loop: GameLoopHandle | null = null;
  let lastState: GameState | null = null;
  let timerInterval: number | null = null;
  let submitStatus: SubmitStatus = 'idle';
  let submitError: string | null = null;

  function paintHud(state: GameState) {
    const scoreEl = opts.root.querySelector('#hud-score');
    const livesEl = opts.root.querySelector('#hud-lives');
    if (scoreEl) scoreEl.textContent = String(state.score);
    if (livesEl) livesEl.innerHTML = renderLivesIndicator(state.lives);
  }

  function paintTimer() {
    const timerEl = opts.root.querySelector('#hud-timer');
    if (!timerEl || !lastState) return;
    const ms = remainingMsFromState(lastState, performance.now());
    timerEl.textContent = formatTime(ms);
  }

  function showGameOver(state: GameState) {
    const modalRoot = opts.root.querySelector<HTMLDivElement>('#modal-root');
    if (!modalRoot) return;
    modalRoot.innerHTML = renderGameOverModal(state, submitStatus, submitError);
    bindGameOverModal(modalRoot, {
      onTryAgain: () => {
        modalRoot.innerHTML = '';
        startRound();
      },
      onLeaderboard: () => opts.onLeaderboard(),
    });
  }

  async function finalize(state: GameState) {
    if (opts.isOffline) {
      submitStatus = 'offline';
      submitError = null;
      showGameOver(state);
      return;
    }
    submitStatus = 'pending';
    submitError = null;
    showGameOver(state);
    const { error } = await submitScore(state.score);
    if (error) {
      submitStatus = 'error';
      submitError = error;
    } else {
      submitStatus = 'saved';
      submitError = null;
    }
    showGameOver(state);
  }

  function startRound() {
    submitStatus = 'idle';
    submitError = null;
    const arena = opts.root.querySelector<HTMLDivElement>('#arena')!;
    loop = startGameLoop({
      container: arena,
      onStateChange: (s) => {
        lastState = s;
        paintHud(s);
      },
      onEnd: (s) => {
        if (timerInterval !== null) {
          clearInterval(timerInterval);
          timerInterval = null;
        }
        void finalize(s);
      },
    });
    if (timerInterval !== null) clearInterval(timerInterval);
    timerInterval = window.setInterval(paintTimer, 100);
  }

  opts.root.innerHTML = `
    <main class="min-h-[100dvh] flex flex-col select-none">
      <header class="sticky top-0 z-20 backdrop-blur-md bg-slate-950/60 border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <button id="home-btn" class="btn-ghost text-sm py-1.5 px-3">← Home</button>
        <div class="flex items-center gap-5">
          <div class="text-center">
            <p class="text-[10px] uppercase tracking-wider text-slate-500 leading-none">Score</p>
            <p id="hud-score" class="font-display font-bold text-2xl tabular-nums leading-tight">0</p>
          </div>
          <div class="text-center">
            <p class="text-[10px] uppercase tracking-wider text-slate-500 leading-none">Time</p>
            <p id="hud-timer" class="font-display font-bold text-2xl tabular-nums leading-tight">30s</p>
          </div>
          <div id="hud-lives" class="flex items-center"></div>
        </div>
      </header>

      <section id="arena" class="relative flex-1 overflow-hidden"></section>
      <div id="modal-root"></div>
    </main>
  `;

  opts.root.querySelector<HTMLButtonElement>('#home-btn')!.addEventListener('click', () => {
    loop?.stop();
    if (timerInterval !== null) clearInterval(timerInterval);
    opts.onHome();
  });

  paintHud({ score: 0, lives: 3, startedAt: 0, endedAt: null, reason: null });
  startRound();

  return {
    stop: () => {
      loop?.stop();
      if (timerInterval !== null) clearInterval(timerInterval);
    },
  };
}

import {
  applyShrink,
  createCircleEl,
  isExpired,
  makeCircle,
  popCircle,
  progress,
  type CircleSpec,
} from './Circle';
import {
  addPoint,
  initialState,
  isOver,
  loseLife,
  remainingMs,
  spawnDelayRange,
  tickTimer,
  type GameState,
} from './Score';
import { defaultRng, randRange, type Rng } from '../lib/rng';

export interface GameLoopHandle {
  stop: () => void;
  getState: () => GameState;
  forceEnd: () => void;
}

export interface GameLoopOptions {
  container: HTMLElement;
  onStateChange: (state: GameState) => void;
  onEnd: (state: GameState) => void;
  rng?: Rng;
}

interface ActiveCircle {
  spec: CircleSpec;
  el: HTMLDivElement;
}

export function startGameLoop(opts: GameLoopOptions): GameLoopHandle {
  const rng = opts.rng ?? defaultRng();
  const container = opts.container;
  container.innerHTML = '';

  let state = initialState(performance.now());
  let active: ActiveCircle[] = [];
  let nextSpawnAt = performance.now() + randRange(rng, 250, 500);
  let stopped = false;
  let rafId = 0;

  opts.onStateChange(state);

  function notify() {
    opts.onStateChange(state);
  }

  function spawn(now: number) {
    const bounds = {
      width: container.clientWidth,
      height: container.clientHeight,
    };
    if (bounds.width < 32 || bounds.height < 32) return;
    const spec = makeCircle(rng, bounds, now);
    const el = createCircleEl(spec, () => onTapCircle(spec.id));
    container.appendChild(el);
    active.push({ spec, el });
    const range = spawnDelayRange(state.score);
    nextSpawnAt = now + randRange(rng, range.min, range.max);
  }

  function onTapCircle(id: number) {
    const idx = active.findIndex((a) => a.spec.id === id);
    if (idx === -1) return;
    const [hit] = active.splice(idx, 1);
    popCircle(hit.el);
    showFloater(hit.spec.x, hit.spec.y, '+1', '#22d3ee');
    state = addPoint(state);
    notify();
  }

  function showFloater(x: number, y: number, text: string, color: string) {
    const f = document.createElement('div');
    f.className = 'float-up absolute font-display font-bold text-2xl pointer-events-none';
    f.style.left = `${x - 14}px`;
    f.style.top = `${y - 28}px`;
    f.style.color = color;
    f.style.textShadow = '0 2px 6px rgba(0,0,0,0.5)';
    f.textContent = text;
    container.appendChild(f);
    setTimeout(() => f.remove(), 620);
  }

  function expireMissed(now: number) {
    let livesLost = false;
    let missX = 0;
    let missY = 0;
    const remaining: ActiveCircle[] = [];
    for (const a of active) {
      if (isExpired(a.spec, now)) {
        a.el.remove();
        livesLost = true;
        missX = a.spec.x;
        missY = a.spec.y;
      } else {
        remaining.push(a);
      }
    }
    active = remaining;
    if (livesLost) {
      state = loseLife(state, now);
      container.classList.remove('shake');
      void container.offsetWidth;
      container.classList.add('shake');
      showFloater(missX, missY, '−1', '#f43f5e');
      notify();
    }
  }

  function frame() {
    if (stopped) return;
    const now = performance.now();

    if (!isOver(state) && now >= nextSpawnAt) {
      spawn(now);
    }

    for (const a of active) {
      applyShrink(a.el, progress(a.spec, now));
    }

    expireMissed(now);
    state = tickTimer(state, now);

    if (isOver(state)) {
      end();
      return;
    }

    notify();
    rafId = requestAnimationFrame(frame);
  }

  function end() {
    stopped = true;
    cancelAnimationFrame(rafId);
    for (const a of active) a.el.remove();
    active = [];
    opts.onEnd(state);
  }

  rafId = requestAnimationFrame(frame);

  return {
    stop: () => {
      stopped = true;
      cancelAnimationFrame(rafId);
      for (const a of active) a.el.remove();
      active = [];
    },
    getState: () => state,
    forceEnd: () => {
      if (!isOver(state)) {
        state = { ...state, endedAt: performance.now(), reason: state.reason ?? 'time' };
        end();
      }
    },
  };
}

export function formatTime(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${s.toString().padStart(2, '0')}s`;
}

export function remainingMsFromState(state: GameState, now: number): number {
  return remainingMs(state, now);
}

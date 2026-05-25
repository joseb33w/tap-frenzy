export const ROUND_DURATION_MS = 30_000;
export const STARTING_LIVES = 3;

export const BASE_SPAWN_MIN_MS = 400;
export const BASE_SPAWN_MAX_MS = 800;
const SPEEDUP_PER_10_POINTS = 0.05;
const MAX_SPEEDUP = 0.6;

export interface GameState {
  score: number;
  lives: number;
  startedAt: number;
  endedAt: number | null;
  reason: 'time' | 'lives' | null;
}

export type GameEndReason = 'time' | 'lives';

export function initialState(now: number): GameState {
  return {
    score: 0,
    lives: STARTING_LIVES,
    startedAt: now,
    endedAt: null,
    reason: null,
  };
}

export function remainingMs(state: GameState, now: number): number {
  if (state.endedAt !== null) return 0;
  return Math.max(0, ROUND_DURATION_MS - (now - state.startedAt));
}

export function isOver(state: GameState): boolean {
  return state.endedAt !== null;
}

export function speedupFactor(score: number): number {
  const tiers = Math.floor(score / 10);
  return Math.min(MAX_SPEEDUP, tiers * SPEEDUP_PER_10_POINTS);
}

export function spawnDelayRange(score: number): { min: number; max: number } {
  const f = 1 - speedupFactor(score);
  return {
    min: Math.max(140, BASE_SPAWN_MIN_MS * f),
    max: Math.max(220, BASE_SPAWN_MAX_MS * f),
  };
}

export function addPoint(state: GameState): GameState {
  if (isOver(state)) return state;
  return { ...state, score: state.score + 1 };
}

export function loseLife(state: GameState, now: number): GameState {
  if (isOver(state)) return state;
  const lives = state.lives - 1;
  if (lives <= 0) {
    return { ...state, lives: 0, endedAt: now, reason: 'lives' };
  }
  return { ...state, lives };
}

export function tickTimer(state: GameState, now: number): GameState {
  if (isOver(state)) return state;
  if (now - state.startedAt >= ROUND_DURATION_MS) {
    return { ...state, endedAt: now, reason: 'time' };
  }
  return state;
}

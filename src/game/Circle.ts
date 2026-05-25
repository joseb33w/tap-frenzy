import type { Rng } from '../lib/rng';
import { pick, randRange } from '../lib/rng';

export const CIRCLE_LIFESPAN_MS = 1200;
export const CIRCLE_START_DIAMETER = 100;

const PALETTE = [
  '#f43f5e',
  '#fb923c',
  '#facc15',
  '#34d399',
  '#22d3ee',
  '#818cf8',
  '#e879f9',
] as const;

export interface CircleSpec {
  id: number;
  x: number;
  y: number;
  color: string;
  spawnAt: number;
}

let nextCircleId = 1;

export interface CircleBounds {
  width: number;
  height: number;
}

export function makeCircle(rng: Rng, bounds: CircleBounds, now: number): CircleSpec {
  const margin = CIRCLE_START_DIAMETER / 2 + 8;
  const x = randRange(rng, margin, bounds.width - margin);
  const y = randRange(rng, margin + 64, bounds.height - margin - 16);
  return {
    id: nextCircleId++,
    x,
    y,
    color: pick(rng, PALETTE),
    spawnAt: now,
  };
}

export function progress(spec: CircleSpec, now: number): number {
  return Math.min(1, Math.max(0, (now - spec.spawnAt) / CIRCLE_LIFESPAN_MS));
}

export function isExpired(spec: CircleSpec, now: number): boolean {
  return progress(spec, now) >= 1;
}

export function createCircleEl(spec: CircleSpec, onTap: () => void): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'tap-circle';
  el.dataset.id = String(spec.id);
  el.style.width = `${CIRCLE_START_DIAMETER}px`;
  el.style.height = `${CIRCLE_START_DIAMETER}px`;
  el.style.left = `${spec.x - CIRCLE_START_DIAMETER / 2}px`;
  el.style.top = `${spec.y - CIRCLE_START_DIAMETER / 2}px`;
  el.style.background = `radial-gradient(circle at 30% 25%, rgba(255,255,255,0.55), ${spec.color} 55%, ${spec.color} 100%)`;
  el.style.boxShadow = `0 0 32px 4px ${spec.color}99, inset 0 0 14px rgba(255,255,255,0.25)`;
  el.style.transform = 'scale(1)';
  el.style.opacity = '1';
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    onTap();
  });
  return el;
}

export function applyShrink(el: HTMLDivElement, p: number): void {
  const scale = Math.max(0, 1 - p);
  el.style.transform = `scale(${scale})`;
  el.style.opacity = String(Math.max(0, 1 - p * 0.85));
}

export function popCircle(el: HTMLDivElement): void {
  el.classList.add('tap-pop');
  setTimeout(() => el.remove(), 240);
}

import type { SceneFrame } from './types';

const fnvPrime = 16777619;
const offsets = [2166136261, 84696351] as const;
// A millionth of a field unit is far below anything visible.
const precision = 1e6;

const mix = (hash: number, value: number) => Math.imul(hash ^ value, fnvPrime) >>> 0;

const hex = (hash: number) => hash.toString(16).padStart(8, '0');

/** A fingerprint of everything that moves in a frame. Equal hashes mean equal frames. */
export function hashFrame(frame: SceneFrame): string {
  const values = frame.units.flatMap(({ position, velocity }) => [
    position.x,
    position.y,
    velocity.x,
    velocity.y,
  ]);
  const hashes = offsets.map((offset) =>
    values.reduce((hash, value) => mix(hash, Math.round(value * precision) | 0), offset),
  );
  return hashes.map(hex).join('');
}

/** The first frame number at which two branches differ, or null when they never do. */
export function firstDivergence(a: readonly SceneFrame[], b: readonly SceneFrame[]): number | null {
  const frames = Math.min(a.length, b.length);
  for (let index = 0; index < frames; index += 1) {
    if (hashFrame(a[index]) !== hashFrame(b[index])) return a[index].frameNo;
  }
  return null;
}

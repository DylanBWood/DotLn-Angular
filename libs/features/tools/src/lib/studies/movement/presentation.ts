import type { Vec2 } from '@dotln-angular/scene-engine';

import type { MotionBounds, MotionFrame } from '../study-model';

/** Keep trailing digits while normalising a rounded negative zero. */
export const fixed = (value: number, digits = 2): string =>
  Number(value.toFixed(digits)).toFixed(digits);

/** Preserve the authored precision and any explicitly chosen near-zero cutoff. */
export const decimal = (value: number, digits = 2, zeroThreshold = 0): string =>
  (Math.abs(value) < zeroThreshold ? 0 : value).toFixed(digits);

export const brief = (value: number, digits = 1): string => decimal(value, digits);

export const pair = (value: Vec2, digits = 2): string =>
  `(${fixed(value.x, digits)}, ${fixed(value.y, digits)})`;

export const vectorText = (value: Vec2, digits = 2, zeroThreshold = 0): string =>
  `(${decimal(value.x, digits, zeroThreshold)}, ${decimal(value.y, digits, zeroThreshold)})`;

/** Drop insignificant trailing zeroes in studies authored with compact numbers. */
export const rounded = (value: number, digits = 2): string => String(Number(value.toFixed(digits)));

/** Fit the authored points without changing a study's choice of padding. */
export function boundsOfPoints(points: readonly Vec2[], padding: number): MotionBounds {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const { x, y } of points) {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  return {
    minX: minX - padding,
    maxX: maxX + padding,
    minY: minY - padding,
    maxY: maxY + padding,
  };
}

/** The ordinary motion bounds use bodies, marks and arrow tips at each sample. */
export const motionPoints = (frames: readonly MotionFrame[]): readonly Vec2[] =>
  frames.flatMap((frame) => [
    ...frame.bodies,
    ...(frame.marks ?? []),
    ...(frame.vectors ?? []).map(({ x, y, dx, dy }) => ({ x: x + dx, y: y + dy })),
  ]);

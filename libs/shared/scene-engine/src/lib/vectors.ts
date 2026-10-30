import type { Vec2 } from './types';

export const zero: Vec2 = { x: 0, y: 0 };

export const add = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y });
export const subtract = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y });
export const scale = (v: Vec2, factor: number): Vec2 => ({ x: v.x * factor, y: v.y * factor });
export const dot = (a: Vec2, b: Vec2) => a.x * b.x + a.y * b.y;
export const length = (v: Vec2) => Math.sqrt(dot(v, v));
export const distance = (a: Vec2, b: Vec2) => length(subtract(a, b));
export const midpoint = (a: Vec2, b: Vec2): Vec2 => scale(add(a, b), 0.5);

export function normalize(v: Vec2): Vec2 {
  const size = length(v);
  return size === 0 ? zero : scale(v, 1 / size);
}

export function clipLength(v: Vec2, limit: number): Vec2 {
  const size = length(v);
  return size <= limit ? v : scale(v, limit / size);
}

/** Turns an offset expressed along a heading into the field's axes. */
export const alongHeading = (offset: Vec2, heading: Vec2): Vec2 => ({
  x: offset.x * heading.x - offset.y * heading.y,
  y: offset.x * heading.y + offset.y * heading.x,
});

export function centroid(points: readonly Vec2[]): Vec2 {
  if (points.length === 0) return zero;
  return scale(points.reduce(add, zero), 1 / points.length);
}

const fullTurn = 2 * Math.PI;

function wrapAngle(angle: number) {
  const turns = Math.floor((angle + Math.PI) / fullTurn);
  return angle - turns * fullTurn;
}

// Native sine and cosine are computed by the host's C++ library, whose rounding can differ by
// architecture, and a committed frame hash must reproduce on every machine. Plain arithmetic
// is identical everywhere JavaScript runs, so wander uses this series instead.
export function sine(angle: number) {
  const x = wrapAngle(angle);
  const square = x * x;
  let term = x;
  let sum = x;
  for (let power = 3; power <= 19; power += 2) {
    term *= -square / (power * (power - 1));
    sum += term;
  }
  return sum;
}

export const cosine = (angle: number) => sine(angle + Math.PI / 2);

export { wrapAngle };

import type { Vec2 } from './types';
import { add, clipLength, length, scale, zero } from './vectors';

export interface WeightedSteering {
  readonly weight: number;
  readonly acceleration: Vec2;
}

/** Multiplies each output by its weight, sums them and clips to the maximum acceleration. */
export function blend(terms: readonly WeightedSteering[], maxAcceleration: number): Vec2 {
  const sum = terms.reduce(
    (total, term) => add(total, scale(term.acceleration, term.weight)),
    zero,
  );
  return clipLength(sum, maxAcceleration);
}

/** Uses the first group whose output clears epsilon; silent when none does. */
export function firstActive(groups: readonly Vec2[], epsilon: number): Vec2 {
  return groups.find((group) => length(group) > epsilon) ?? zero;
}

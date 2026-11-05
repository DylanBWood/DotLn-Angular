import type { StudyParameters } from '@dotln-angular/models';

import { numberParameter } from '../parameters';

export interface FiringParameters {
  readonly startX: number;
  readonly launchHeight: number;
  readonly targetX: number;
  readonly targetHeight: number;
  readonly launchSpeed: number;
  readonly gravity: number;
  readonly unreachableTargetX: number;
  readonly timeStep: number;
  readonly steps: number;
}

export interface FiringArc {
  readonly name: 'low' | 'high';
  readonly slope: number;
  readonly horizontalVelocity: number;
  readonly verticalVelocity: number;
  readonly targetTime: number;
  readonly landingTime: number;
  readonly landingX: number;
}

export interface FiringSolution {
  readonly distance: number;
  readonly heightOffset: number;
  readonly discriminant: number;
  readonly arcs: readonly FiringArc[];
}

export interface FiringPosition {
  readonly x: number;
  readonly height: number;
  readonly verticalVelocity: number;
  readonly landed: boolean;
}

export const readParameters = (parameters: StudyParameters): FiringParameters => ({
  startX: numberParameter(parameters, 'startX'),
  launchHeight: numberParameter(parameters, 'launchHeight'),
  targetX: numberParameter(parameters, 'targetX'),
  targetHeight: numberParameter(parameters, 'targetHeight'),
  launchSpeed: numberParameter(parameters, 'launchSpeed'),
  gravity: numberParameter(parameters, 'gravity'),
  unreachableTargetX: numberParameter(parameters, 'unreachableTargetX'),
  timeStep: numberParameter(parameters, 'timeStep'),
  steps: numberParameter(parameters, 'steps'),
});

/** This study-local solver has no engine equivalent. Its target is ahead and at or above water. */
export function solveFiringSolution(
  example: FiringParameters,
  targetX = example.targetX,
): FiringSolution {
  const distance = targetX - example.startX;
  const heightOffset = example.targetHeight - example.launchHeight;
  const speedSquared = example.launchSpeed ** 2;
  const discriminant =
    speedSquared ** 2 -
    example.gravity * (example.gravity * distance ** 2 + 2 * heightOffset * speedSquared);

  if (distance <= 0 || example.targetHeight < 0 || discriminant < 0)
    return { distance, heightOffset, discriminant, arcs: [] };

  const root = Math.sqrt(discriminant);
  const slopes =
    root === 0
      ? [{ name: 'low' as const, slope: speedSquared / (example.gravity * distance) }]
      : [
          { name: 'low' as const, slope: (speedSquared - root) / (example.gravity * distance) },
          { name: 'high' as const, slope: (speedSquared + root) / (example.gravity * distance) },
        ];
  const arcs = slopes.map(({ name, slope }): FiringArc => {
    const horizontalVelocity = example.launchSpeed / Math.sqrt(1 + slope ** 2);
    const verticalVelocity = slope * horizontalVelocity;
    const landingTime =
      (verticalVelocity +
        Math.sqrt(verticalVelocity ** 2 + 2 * example.gravity * example.launchHeight)) /
      example.gravity;

    return {
      name,
      slope,
      horizontalVelocity,
      verticalVelocity,
      targetTime: distance / horizontalVelocity,
      landingTime,
      landingX: example.startX + horizontalVelocity * landingTime,
    };
  });

  return { distance, heightOffset, discriminant, arcs };
}

/** Launch determines the whole flight; no steering correction is applied after it. */
export function firingPositionAt(
  example: FiringParameters,
  arc: FiringArc,
  seconds: number,
): FiringPosition {
  const landed = seconds + 1e-9 >= arc.landingTime;
  const time = landed ? arc.landingTime : seconds;

  return {
    x: example.startX + arc.horizontalVelocity * time,
    height: landed
      ? 0
      : example.launchHeight + arc.verticalVelocity * time - (example.gravity * time ** 2) / 2,
    verticalVelocity: landed ? 0 : arc.verticalVelocity - example.gravity * time,
    landed,
  };
}

/** Fixed preview samples also include exact apex, target and water-contact events. */
export function firingTimes(
  example: FiringParameters,
  solution: FiringSolution,
): readonly number[] {
  const horizon = example.steps * example.timeStep;
  const end =
    solution.arcs.length === 0
      ? horizon
      : Math.min(horizon, Math.max(...solution.arcs.map(({ landingTime }) => landingTime)));
  const times = Array.from(
    { length: example.steps + 1 },
    (_unused, step) => step * example.timeStep,
  ).filter((seconds) => seconds < end);
  const events = solution.arcs
    .flatMap((arc) => [arc.verticalVelocity / example.gravity, arc.targetTime, arc.landingTime])
    .filter((time) => time >= 0 && time <= end);

  const ordered = [...new Set([0, ...times, ...events, end])].sort((a, b) => a - b);
  const separated: number[] = [];
  // Target contact and water contact can differ by roundoff when both mean the same event.
  for (const time of ordered) {
    const previous = separated.at(-1);
    if (previous !== undefined && time - previous <= 1e-9) separated[separated.length - 1] = time;
    else separated.push(time);
  }
  return separated;
}

export function firingFrame(example: FiringParameters, solution: FiringSolution, seconds: number) {
  const low = solution.arcs[0];
  const high = solution.arcs[1];
  const lowPosition = low ? firingPositionAt(example, low, seconds) : null;
  const highPosition = high ? firingPositionAt(example, high, seconds) : null;
  return { low, high, lowPosition, highPosition };
}

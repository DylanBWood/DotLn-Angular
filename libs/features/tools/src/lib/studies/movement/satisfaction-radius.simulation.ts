import type { StudyParameters } from '@dotln-angular/models';

import { numberParameter } from '../parameters';

export interface SatisfactionRadiusParameters {
  readonly start: number;
  readonly target: number;
  readonly speed: number;
  readonly satisfactionRadius: number;
  readonly timeStep: number;
  readonly steps: number;
  readonly comparisonRadius: number;
}

export interface SatisfactionRadiusStep {
  readonly offset: number;
  readonly distance: number;
  readonly accepted: boolean;
  readonly velocity: number;
  readonly nextPosition: number;
}

export interface SatisfactionRadiusSample extends SatisfactionRadiusStep {
  readonly position: number;
}

export const readParameters = (parameters: StudyParameters): SatisfactionRadiusParameters => ({
  start: numberParameter(parameters, 'start'),
  target: numberParameter(parameters, 'target'),
  speed: numberParameter(parameters, 'speed'),
  satisfactionRadius: numberParameter(parameters, 'satisfactionRadius'),
  timeStep: numberParameter(parameters, 'timeStep'),
  steps: numberParameter(parameters, 'steps'),
  comparisonRadius: numberParameter(parameters, 'comparisonRadius'),
});

/** A local tolerance check gates direct movement; the engine exposes acceleration steering. */
export function calculateSatisfactionRadiusStep(
  position: number,
  example: SatisfactionRadiusParameters,
  radius = example.satisfactionRadius,
): SatisfactionRadiusStep {
  const offset = example.target - position;
  const distance = Math.abs(offset);
  const accepted = distance <= radius;
  const velocity = accepted ? 0 : Math.sign(offset) * example.speed;

  return {
    offset,
    distance,
    accepted,
    velocity,
    nextPosition: position + velocity * example.timeStep,
  };
}

export function satisfactionRadiusSamples(
  example: SatisfactionRadiusParameters,
  radius = example.satisfactionRadius,
): readonly SatisfactionRadiusSample[] {
  const samples: SatisfactionRadiusSample[] = [];
  let position = example.start;

  for (let step = 0; step <= example.steps; step++) {
    const calculation = calculateSatisfactionRadiusStep(position, example, radius);
    samples.push({ position, ...calculation });
    position = calculation.nextPosition;
  }

  return samples;
}

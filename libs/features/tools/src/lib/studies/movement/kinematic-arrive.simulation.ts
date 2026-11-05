import type { StudyParameters } from '@dotln-angular/models';

import { numberParameter } from '../parameters';

export interface KinematicArriveParameters {
  readonly start: number;
  readonly target: number;
  readonly maxSpeed: number;
  readonly timeToTarget: number;
  readonly satisfactionRadius: number;
  readonly timeStep: number;
  readonly steps: number;
  readonly shortTimeToTarget: number;
}

export interface KinematicArriveStep {
  readonly offset: number;
  readonly distance: number;
  readonly requestedVelocity: number;
  readonly velocity: number;
  readonly accepted: boolean;
  readonly nextPosition: number;
}

export interface KinematicArriveSample extends KinematicArriveStep {
  readonly position: number;
}

export const readParameters = (parameters: StudyParameters): KinematicArriveParameters => ({
  start: numberParameter(parameters, 'start'),
  target: numberParameter(parameters, 'target'),
  maxSpeed: numberParameter(parameters, 'maxSpeed'),
  timeToTarget: numberParameter(parameters, 'timeToTarget'),
  satisfactionRadius: numberParameter(parameters, 'satisfactionRadius'),
  timeStep: numberParameter(parameters, 'timeStep'),
  steps: numberParameter(parameters, 'steps'),
  shortTimeToTarget: numberParameter(parameters, 'shortTimeToTarget'),
});

/** Direct velocity assignment is local: the public engine's arrive returns acceleration. */
export function calculateKinematicArriveStep(
  position: number,
  example: KinematicArriveParameters,
  timeToTarget = example.timeToTarget,
): KinematicArriveStep {
  const offset = example.target - position;
  const distance = Math.abs(offset);
  const accepted = distance <= example.satisfactionRadius;
  const requestedVelocity = accepted ? 0 : offset / timeToTarget;
  const velocity = Math.max(-example.maxSpeed, Math.min(example.maxSpeed, requestedVelocity));

  return {
    offset,
    distance,
    requestedVelocity,
    velocity,
    accepted,
    nextPosition: position + velocity * example.timeStep,
  };
}

/** Each sample shows the position now and the velocity assigned for the next interval. */
export function kinematicArriveSamples(
  example: KinematicArriveParameters,
  timeToTarget = example.timeToTarget,
): readonly KinematicArriveSample[] {
  const samples: KinematicArriveSample[] = [];
  let position = example.start;

  for (let step = 0; step <= example.steps; step++) {
    const calculation = calculateKinematicArriveStep(position, example, timeToTarget);
    samples.push({ position, ...calculation });
    position = calculation.nextPosition;
  }

  return samples;
}

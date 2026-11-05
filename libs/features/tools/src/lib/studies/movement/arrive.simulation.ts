import type { StudyParameters } from '@dotln-angular/models';

import { numberParameter } from '../parameters';

export interface ArriveParameters {
  readonly target: number;
  readonly slowRadius: number;
  readonly maxSpeed: number;
  readonly maxAcceleration: number;
  readonly responseTime: number;
  readonly tolerance: number;
  readonly timeStep: number;
  readonly steps: number;
  readonly lateRadius: number;
}

export interface ArriveState {
  readonly position: number;
  readonly velocity: number;
}

export interface ArriveStep {
  readonly distance: number;
  readonly desired: number;
  readonly requestedAcceleration: number;
  readonly acceleration: number;
  readonly settled: boolean;
  readonly next: ArriveState;
}

export const readParameters = (parameters: StudyParameters): ArriveParameters => ({
  target: numberParameter(parameters, 'target'),
  slowRadius: numberParameter(parameters, 'slowRadius'),
  maxSpeed: numberParameter(parameters, 'maxSpeed'),
  maxAcceleration: numberParameter(parameters, 'maxAcceleration'),
  responseTime: numberParameter(parameters, 'responseTime'),
  tolerance: numberParameter(parameters, 'tolerance'),
  timeStep: numberParameter(parameters, 'timeStep'),
  steps: numberParameter(parameters, 'steps'),
  lateRadius: numberParameter(parameters, 'lateRadius'),
});

export const limit = (value: number, magnitude: number) =>
  Math.max(-magnitude, Math.min(magnitude, value));

export const desiredVelocity = (
  position: number,
  example: ArriveParameters,
  slowRadius = example.slowRadius,
) => {
  const offset = example.target - position;
  return Math.sign(offset) * example.maxSpeed * Math.min(1, Math.abs(offset) / slowRadius);
};

/** The displayed calculation and the motion use this same one-dimensional step. */
export function calculateArriveStep(
  state: ArriveState,
  example: ArriveParameters,
  slowRadius = example.slowRadius,
): ArriveStep {
  const offset = example.target - state.position;
  const settled =
    Math.abs(offset) <= example.tolerance && Math.abs(state.velocity) <= example.tolerance;
  const desired = desiredVelocity(state.position, example, slowRadius);
  const requestedAcceleration = (desired - state.velocity) / example.responseTime;
  const acceleration = limit(requestedAcceleration, example.maxAcceleration);
  const velocity = limit(state.velocity + acceleration * example.timeStep, example.maxSpeed);
  return {
    distance: Math.abs(offset),
    desired,
    requestedAcceleration,
    acceleration,
    settled,
    next: settled
      ? { position: example.target, velocity: 0 }
      : { position: state.position + velocity * example.timeStep, velocity },
  };
}

export const stepArrive = (
  state: ArriveState,
  example: ArriveParameters,
  slowRadius = example.slowRadius,
) => calculateArriveStep(state, example, slowRadius).next;

/** Retain the controller result used to advance each displayed state. */
export interface ArriveSample {
  readonly state: ArriveState;
  readonly calculation: ReturnType<typeof calculateArriveStep>;
  readonly next: ArriveState;
}

export function arriveSamples(
  example: ArriveParameters,
  slowRadius = example.slowRadius,
): readonly ArriveSample[] {
  const samples: ArriveSample[] = [];
  let state: ArriveState = { position: 0, velocity: 0 };
  for (let step = 0; step <= example.steps; step++) {
    const calculation = calculateArriveStep(state, example, slowRadius);
    const next = calculation.next;
    samples.push({ state, calculation, next });
    state = next;
  }
  return samples;
}

/** State-only access stays available to existing callers. */
export function arriveFrames(
  example: ArriveParameters,
  slowRadius = example.slowRadius,
): readonly ArriveState[] {
  return arriveSamples(example, slowRadius).map(({ state }) => state);
}

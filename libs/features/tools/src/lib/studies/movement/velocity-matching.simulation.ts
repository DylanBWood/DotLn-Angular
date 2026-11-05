import type { StudyParameters } from '@dotln-angular/models';
import { matchVelocity, type SteeringBody } from '@dotln-angular/scene-engine';

import { numberParameter } from '../parameters';

export interface VelocityMatchingParameters {
  readonly courierStart: number;
  readonly courierVelocity: number;
  readonly cartStart: number;
  readonly cartVelocity: number;
  readonly maxSpeed: number;
  readonly maxAcceleration: number;
  readonly responseTime: number;
  readonly shortResponseTime: number;
  readonly timeStep: number;
  readonly steps: number;
  readonly radius: number;
  readonly arrowSeconds: number;
}

export interface VelocityMatchingState {
  readonly courierPosition: number;
  readonly courierVelocity: number;
  readonly cartPosition: number;
}

export interface VelocityMatchingStep {
  readonly velocityGap: number;
  readonly requestedAcceleration: number;
  readonly acceleration: number;
  readonly next: VelocityMatchingState;
}

export const readParameters = (parameters: StudyParameters): VelocityMatchingParameters => {
  const example: VelocityMatchingParameters = {
    courierStart: numberParameter(parameters, 'courierStart'),
    courierVelocity: numberParameter(parameters, 'courierVelocity'),
    cartStart: numberParameter(parameters, 'cartStart'),
    cartVelocity: numberParameter(parameters, 'cartVelocity'),
    maxSpeed: numberParameter(parameters, 'maxSpeed'),
    maxAcceleration: numberParameter(parameters, 'maxAcceleration'),
    responseTime: numberParameter(parameters, 'responseTime'),
    shortResponseTime: numberParameter(parameters, 'shortResponseTime'),
    timeStep: numberParameter(parameters, 'timeStep'),
    steps: numberParameter(parameters, 'steps'),
    radius: numberParameter(parameters, 'radius'),
    arrowSeconds: numberParameter(parameters, 'arrowSeconds'),
  };
  if (
    !Object.values(example).every(Number.isFinite) ||
    example.responseTime <= 0 ||
    example.shortResponseTime <= 0 ||
    example.timeStep <= 0 ||
    example.maxSpeed <= 0 ||
    example.maxAcceleration <= 0 ||
    example.radius <= 0 ||
    example.arrowSeconds <= 0 ||
    Math.abs(example.courierVelocity) > example.maxSpeed ||
    !Number.isInteger(example.steps) ||
    example.steps < 2 ||
    example.steps > 239
  )
    throw new Error('Velocity matching needs finite values, positive limits and 2–239 steps.');
  return example;
};

/** The engine chooses acceleration; the study advances the courier and cart on one axis. */
export function calculateVelocityMatchingStep(
  state: VelocityMatchingState,
  example: VelocityMatchingParameters,
  responseTime = example.responseTime,
): VelocityMatchingStep {
  const body: SteeringBody = {
    position: { x: state.courierPosition, y: 0 },
    velocity: { x: state.courierVelocity, y: 0 },
    heading: { x: 1, y: 0 },
    maxSpeed: example.maxSpeed,
    maxAcceleration: example.maxAcceleration,
    radius: example.radius,
    wanderAngle: 0,
  };
  const velocityGap = example.cartVelocity - state.courierVelocity;
  const acceleration = matchVelocity(body, { x: example.cartVelocity, y: 0 }, responseTime).x;
  const velocity = Math.max(
    -example.maxSpeed,
    Math.min(example.maxSpeed, state.courierVelocity + acceleration * example.timeStep),
  );
  return {
    velocityGap,
    requestedAcceleration: velocityGap / responseTime,
    acceleration,
    next: {
      courierPosition: state.courierPosition + velocity * example.timeStep,
      courierVelocity: velocity,
      cartPosition: state.cartPosition + example.cartVelocity * example.timeStep,
    },
  };
}

/** Retain the controller result used to advance each displayed state. */
export interface VelocityMatchingSample {
  readonly state: VelocityMatchingState;
  readonly calculation: ReturnType<typeof calculateVelocityMatchingStep>;
  readonly next: VelocityMatchingState;
}

export function velocityMatchingSamples(
  example: VelocityMatchingParameters,
  responseTime = example.responseTime,
): readonly VelocityMatchingSample[] {
  const samples: VelocityMatchingSample[] = [];
  let state: VelocityMatchingState = {
    courierPosition: example.courierStart,
    courierVelocity: example.courierVelocity,
    cartPosition: example.cartStart,
  };
  for (let step = 0; step <= example.steps; step++) {
    const calculation = calculateVelocityMatchingStep(state, example, responseTime);
    const next = calculation.next;
    samples.push({ state, calculation, next });
    state = next;
  }
  return samples;
}

/** State-only access stays available to existing callers. */
export function velocityMatchingFrames(
  example: VelocityMatchingParameters,
  responseTime = example.responseTime,
): readonly VelocityMatchingState[] {
  return velocityMatchingSamples(example, responseTime).map(({ state }) => state);
}

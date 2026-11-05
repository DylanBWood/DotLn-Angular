import type { StudyParameters } from '@dotln-angular/models';
import { flee, type SteeringBody } from '@dotln-angular/scene-engine';

import { numberParameter } from '../parameters';

export interface FleeParameters {
  readonly start: number;
  readonly threat: number;
  readonly initialVelocity: number;
  readonly maxSpeed: number;
  readonly maxAcceleration: number;
  readonly engineRadius: number;
  readonly timeStep: number;
  readonly steps: number;
  readonly bodyRadius: number;
  readonly velocitySeconds: number;
  readonly accelerationSecondsSquared: number;
  readonly arrowLane: number;
  readonly padding: number;
}

export interface FleeState {
  readonly position: number;
  readonly velocity: number;
}

export interface FleeStep {
  readonly offset: number;
  readonly distance: number;
  readonly direction: number;
  readonly fade: number;
  readonly acceleration: number;
  readonly trialVelocity: number;
  readonly next: FleeState;
}

export const readParameters = (parameters: StudyParameters): FleeParameters => {
  const example: FleeParameters = {
    start: numberParameter(parameters, 'start'),
    threat: numberParameter(parameters, 'threat'),
    initialVelocity: numberParameter(parameters, 'initialVelocity'),
    maxSpeed: numberParameter(parameters, 'maxSpeed'),
    maxAcceleration: numberParameter(parameters, 'maxAcceleration'),
    engineRadius: numberParameter(parameters, 'engineRadius'),
    timeStep: numberParameter(parameters, 'timeStep'),
    steps: numberParameter(parameters, 'steps'),
    bodyRadius: numberParameter(parameters, 'bodyRadius'),
    velocitySeconds: numberParameter(parameters, 'velocitySeconds'),
    accelerationSecondsSquared: numberParameter(parameters, 'accelerationSecondsSquared'),
    arrowLane: numberParameter(parameters, 'arrowLane'),
    padding: numberParameter(parameters, 'padding'),
  };
  if (
    !Object.values(example).every(Number.isFinite) ||
    example.maxSpeed <= 0 ||
    example.maxAcceleration <= 0 ||
    example.timeStep <= 0 ||
    example.bodyRadius <= 0 ||
    example.velocitySeconds <= 0 ||
    example.accelerationSecondsSquared <= 0 ||
    example.arrowLane <= 0 ||
    example.padding <= 0 ||
    Math.abs(example.initialVelocity) > example.maxSpeed ||
    !Number.isInteger(example.steps) ||
    example.steps < 4 ||
    example.steps > 239 ||
    example.engineRadius !== 20
  )
    throw new Error(
      'Flee needs finite values, positive limits, 4–239 steps and the engine radius of 20.',
    );
  return example;
};

/** The engine chooses the push; this study's motor advances Pip on an open line. */
export function calculateFleeStep(state: FleeState, example: FleeParameters): FleeStep {
  const body: SteeringBody = {
    position: { x: state.position, y: 0 },
    velocity: { x: state.velocity, y: 0 },
    heading: { x: 1, y: 0 },
    maxSpeed: example.maxSpeed,
    maxAcceleration: example.maxAcceleration,
    radius: example.bodyRadius,
    wanderAngle: 0,
  };
  const offset = state.position - example.threat;
  const gap = Math.abs(offset);
  const acceleration = flee(body, { x: example.threat, y: 0 }).x;
  const trialVelocity = state.velocity + acceleration * example.timeStep;
  const velocity = Math.max(-example.maxSpeed, Math.min(example.maxSpeed, trialVelocity));
  return {
    offset,
    distance: gap,
    direction: Math.sign(offset),
    fade: Math.max(0, 1 - gap / example.engineRadius),
    acceleration,
    trialVelocity,
    next: { position: state.position + velocity * example.timeStep, velocity },
  };
}

/** Retain the controller result used to advance each displayed state. */
export interface FleeSample {
  readonly state: FleeState;
  readonly calculation: ReturnType<typeof calculateFleeStep>;
  readonly next: FleeState;
}

export function fleeSamples(example: FleeParameters): readonly FleeSample[] {
  const samples: FleeSample[] = [];
  let state: FleeState = { position: example.start, velocity: example.initialVelocity };
  for (let step = 0; step <= example.steps; step++) {
    const calculation = calculateFleeStep(state, example);
    const next = calculation.next;
    samples.push({ state, calculation, next });
    state = next;
  }
  return samples;
}

/** State-only access stays available to existing callers. */
export function fleeFrames(example: FleeParameters): readonly FleeState[] {
  return fleeSamples(example).map(({ state }) => state);
}

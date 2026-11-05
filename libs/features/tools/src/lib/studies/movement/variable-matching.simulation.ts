import type { StudyParameters } from '@dotln-angular/models';
import { matchVelocity, type SteeringBody } from '@dotln-angular/scene-engine';

import { numberParameter } from '../parameters';

export interface VariableMatchingParameters {
  readonly skiffStart: number;
  readonly initialVelocity: number;
  readonly pilotStart: number;
  readonly pilotVelocity: number;
  readonly correctionDirection: number;
  readonly responseTime: number;
  readonly maxAcceleration: number;
  readonly maxSpeed: number;
  readonly timeStep: number;
  readonly steps: number;
  readonly matchingTolerance: number;
  readonly bodyRadius: number;
  readonly arrowSeconds: number;
  readonly arrowLane: number;
  readonly padding: number;
}

export interface VariableMatchingState {
  readonly skiffPosition: number;
  readonly skiffVelocity: number;
  readonly pilotPosition: number;
}

export interface VariableMatchingStep {
  readonly velocityError: number;
  readonly correctionTarget: number;
  readonly requestedAcceleration: number;
  readonly acceleration: number;
  readonly trialVelocity: number;
  readonly next: VariableMatchingState;
}

export const readParameters = (parameters: StudyParameters): VariableMatchingParameters => {
  const example: VariableMatchingParameters = {
    skiffStart: numberParameter(parameters, 'skiffStart'),
    initialVelocity: numberParameter(parameters, 'initialVelocity'),
    pilotStart: numberParameter(parameters, 'pilotStart'),
    pilotVelocity: numberParameter(parameters, 'pilotVelocity'),
    correctionDirection: numberParameter(parameters, 'correctionDirection'),
    responseTime: numberParameter(parameters, 'responseTime'),
    maxAcceleration: numberParameter(parameters, 'maxAcceleration'),
    maxSpeed: numberParameter(parameters, 'maxSpeed'),
    timeStep: numberParameter(parameters, 'timeStep'),
    steps: numberParameter(parameters, 'steps'),
    matchingTolerance: numberParameter(parameters, 'matchingTolerance'),
    bodyRadius: numberParameter(parameters, 'bodyRadius'),
    arrowSeconds: numberParameter(parameters, 'arrowSeconds'),
    arrowLane: numberParameter(parameters, 'arrowLane'),
    padding: numberParameter(parameters, 'padding'),
  };
  if (
    !Object.values(example).every(Number.isFinite) ||
    ![1, -1].includes(example.correctionDirection) ||
    example.responseTime <= 0 ||
    example.maxAcceleration <= 0 ||
    example.maxSpeed <= 0 ||
    example.timeStep <= 0 ||
    example.matchingTolerance <= 0 ||
    example.bodyRadius <= 0 ||
    example.arrowSeconds <= 0 ||
    example.arrowLane <= 0 ||
    example.padding <= 0 ||
    Math.abs(example.initialVelocity) > example.maxSpeed ||
    !Number.isInteger(example.steps) ||
    example.steps < 4 ||
    example.steps > 239
  )
    throw new Error(
      'Variable matching needs finite values, positive limits, a direction of ±1 and 4–239 steps.',
    );
  return example;
};

/** Select a velocity error, then ask the engine to reduce it or its deliberately reversed form. */
export function calculateVariableMatchingStep(
  state: VariableMatchingState,
  example: VariableMatchingParameters,
): VariableMatchingStep {
  const velocityError = example.pilotVelocity - state.skiffVelocity;
  const correctionTarget = state.skiffVelocity + example.correctionDirection * velocityError;
  const body: SteeringBody = {
    position: { x: state.skiffPosition, y: 0 },
    velocity: { x: state.skiffVelocity, y: 0 },
    heading: { x: 1, y: 0 },
    maxSpeed: example.maxSpeed,
    maxAcceleration: example.maxAcceleration,
    radius: example.bodyRadius,
    wanderAngle: 0,
  };
  const acceleration = matchVelocity(body, { x: correctionTarget, y: 0 }, example.responseTime).x;
  const trialVelocity = state.skiffVelocity + acceleration * example.timeStep;
  const velocity = Math.max(-example.maxSpeed, Math.min(example.maxSpeed, trialVelocity));
  return {
    velocityError,
    correctionTarget,
    requestedAcceleration: (correctionTarget - state.skiffVelocity) / example.responseTime,
    acceleration,
    trialVelocity,
    next: {
      skiffVelocity: velocity,
      skiffPosition: state.skiffPosition + velocity * example.timeStep,
      pilotPosition: state.pilotPosition + example.pilotVelocity * example.timeStep,
    },
  };
}

/** Retain the controller result used to advance each displayed state. */
export interface VariableMatchingSample {
  readonly state: VariableMatchingState;
  readonly calculation: ReturnType<typeof calculateVariableMatchingStep>;
  readonly next: VariableMatchingState;
}

export function variableMatchingSamples(
  example: VariableMatchingParameters,
): readonly VariableMatchingSample[] {
  const samples: VariableMatchingSample[] = [];
  let state: VariableMatchingState = {
    skiffPosition: example.skiffStart,
    skiffVelocity: example.initialVelocity,
    pilotPosition: example.pilotStart,
  };
  for (let step = 0; step <= example.steps; step++) {
    const calculation = calculateVariableMatchingStep(state, example);
    const next = calculation.next;
    samples.push({ state, calculation, next });
    state = next;
  }
  return samples;
}

/** State-only access stays available to existing callers. */
export function variableMatchingFrames(
  example: VariableMatchingParameters,
): readonly VariableMatchingState[] {
  return variableMatchingSamples(example).map(({ state }) => state);
}

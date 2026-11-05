import type { StudyParameters } from '@dotln-angular/models';

import { numberParameter } from '../parameters';

/** Angular quantities use degrees; only the drawing converts to radians. */
export interface AngularTuning {
  readonly slowRadius: number;
  readonly maxAngularSpeed: number;
  readonly maxAngularAcceleration: number;
  readonly responseTime: number;
  readonly angleTolerance: number;
  readonly speedTolerance: number;
  readonly timeStep: number;
}

export interface AlignParameters extends AngularTuning {
  readonly cameraX: number;
  readonly cameraY: number;
  readonly initialHeading: number;
  readonly initialAngularSpeed: number;
  readonly targetHeading: number;
  readonly directionLength: number;
  readonly steps: number;
  readonly lateSlowRadius: number;
}

export interface AngularState {
  /** Continuous, so crossing the angle boundary does not reset the accumulated turn. */
  readonly heading: number;
  readonly angularVelocity: number;
}

export interface AlignStep {
  readonly rawError: number;
  readonly error: number;
  readonly desiredVelocity: number;
  readonly requestedAcceleration: number;
  readonly acceleration: number;
  readonly settled: boolean;
  readonly next: AngularState;
}

export const fullTurn = 360;

export const radians = (degrees: number) => (degrees * Math.PI) / (fullTurn / 2);

/** The half-turn tie chooses the negative direction: the upper boundary is excluded. */
export const wrapDegrees = (angle: number) =>
  angle - fullTurn * Math.floor((angle + fullTurn / 2) / fullTurn);

export const limit = (value: number, magnitude: number) =>
  Math.max(-magnitude, Math.min(magnitude, value));

export const readParameters = (parameters: StudyParameters): AlignParameters => ({
  cameraX: numberParameter(parameters, 'cameraX'),
  cameraY: numberParameter(parameters, 'cameraY'),
  initialHeading: numberParameter(parameters, 'initialHeading'),
  initialAngularSpeed: numberParameter(parameters, 'initialAngularSpeed'),
  targetHeading: numberParameter(parameters, 'targetHeading'),
  directionLength: numberParameter(parameters, 'directionLength'),
  slowRadius: numberParameter(parameters, 'slowRadius'),
  maxAngularSpeed: numberParameter(parameters, 'maxAngularSpeed'),
  maxAngularAcceleration: numberParameter(parameters, 'maxAngularAcceleration'),
  responseTime: numberParameter(parameters, 'responseTime'),
  angleTolerance: numberParameter(parameters, 'angleTolerance'),
  speedTolerance: numberParameter(parameters, 'speedTolerance'),
  timeStep: numberParameter(parameters, 'timeStep'),
  steps: numberParameter(parameters, 'steps'),
  lateSlowRadius: numberParameter(parameters, 'lateSlowRadius'),
});

/** A local angular controller: the scene engine has no angular acceleration behaviour. */
export function calculateAlignStep(
  state: AngularState,
  targetHeading: number,
  tuning: AngularTuning,
): AlignStep {
  const rawError = targetHeading - state.heading;
  const error = wrapDegrees(rawError);
  const settled =
    Math.abs(error) <= tuning.angleTolerance &&
    Math.abs(state.angularVelocity) <= tuning.speedTolerance;
  if (settled)
    return {
      rawError,
      error,
      desiredVelocity: 0,
      requestedAcceleration: 0,
      acceleration: 0,
      settled,
      next: { heading: targetHeading - (rawError - error), angularVelocity: 0 },
    };
  const desiredVelocity =
    Math.abs(error) <= tuning.angleTolerance
      ? 0
      : Math.sign(error) *
        tuning.maxAngularSpeed *
        Math.min(1, Math.abs(error) / tuning.slowRadius);
  const requestedAcceleration = (desiredVelocity - state.angularVelocity) / tuning.responseTime;
  const acceleration = limit(requestedAcceleration, tuning.maxAngularAcceleration);
  const angularVelocity = limit(
    state.angularVelocity + acceleration * tuning.timeStep,
    tuning.maxAngularSpeed,
  );
  return {
    rawError,
    error,
    desiredVelocity,
    requestedAcceleration,
    acceleration,
    settled,
    next: {
      heading: state.heading + angularVelocity * tuning.timeStep,
      angularVelocity,
    },
  };
}

/** Retain the controller result used to advance each displayed state. */
export interface AlignSample {
  readonly state: AngularState;
  readonly calculation: ReturnType<typeof calculateAlignStep>;
  readonly next: AngularState;
}

export function alignSamples(
  example: AlignParameters,
  slowRadius = example.slowRadius,
): readonly AlignSample[] {
  const tuning = { ...example, slowRadius };
  const samples: AlignSample[] = [];
  let state: AngularState = {
    heading: example.initialHeading,
    angularVelocity: example.initialAngularSpeed,
  };
  for (let step = 0; step <= example.steps; step++) {
    const calculation = calculateAlignStep(state, example.targetHeading, tuning);
    const next = calculation.next;
    samples.push({ state, calculation, next });
    state = next;
  }
  return samples;
}

/** State-only access stays available to existing callers. */
export function alignFrames(
  example: AlignParameters,
  slowRadius = example.slowRadius,
): readonly AngularState[] {
  return alignSamples(example, slowRadius).map(({ state }) => state);
}

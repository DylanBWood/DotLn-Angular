import type { StudyParameters } from '@dotln-angular/models';
import { matchVelocity, type SteeringBody } from '@dotln-angular/scene-engine';

import { numberParameter } from '../parameters';

export interface JumpPointsParameters {
  readonly startX: number;
  readonly lateStartX: number;
  readonly markerX: number;
  readonly initialVelocity: number;
  readonly requiredVelocity: number;
  readonly maxSpeed: number;
  readonly maxAcceleration: number;
  readonly responseTime: number;
  readonly positionTolerance: number;
  readonly velocityTolerance: number;
  readonly verticalVelocity: number;
  readonly gravity: number;
  readonly timeStep: number;
  readonly steps: number;
  readonly padHalfWidth: number;
  readonly arrowSeconds: number;
  readonly radius: number;
}

export interface JumpPointState {
  readonly seconds: number;
  readonly x: number;
  readonly height: number;
  readonly velocity: number;
  readonly verticalVelocity: number;
  readonly phase: 'run-up' | 'airborne' | 'landed' | 'rejected';
  readonly airTime: number;
  readonly takeoffX: number | null;
  readonly takeoffSeconds: number | null;
}

export interface JumpRunUpStep {
  readonly requestedAcceleration: number;
  readonly acceleration: number;
  readonly velocity: number;
  readonly x: number;
}

export const readParameters = (parameters: StudyParameters): JumpPointsParameters => {
  const example: JumpPointsParameters = {
    startX: numberParameter(parameters, 'startX'),
    lateStartX: numberParameter(parameters, 'lateStartX'),
    markerX: numberParameter(parameters, 'markerX'),
    initialVelocity: numberParameter(parameters, 'initialVelocity'),
    requiredVelocity: numberParameter(parameters, 'requiredVelocity'),
    maxSpeed: numberParameter(parameters, 'maxSpeed'),
    maxAcceleration: numberParameter(parameters, 'maxAcceleration'),
    responseTime: numberParameter(parameters, 'responseTime'),
    positionTolerance: numberParameter(parameters, 'positionTolerance'),
    velocityTolerance: numberParameter(parameters, 'velocityTolerance'),
    verticalVelocity: numberParameter(parameters, 'verticalVelocity'),
    gravity: numberParameter(parameters, 'gravity'),
    timeStep: numberParameter(parameters, 'timeStep'),
    steps: numberParameter(parameters, 'steps'),
    padHalfWidth: numberParameter(parameters, 'padHalfWidth'),
    arrowSeconds: numberParameter(parameters, 'arrowSeconds'),
    radius: numberParameter(parameters, 'radius'),
  };
  if (
    !Object.values(example).every(Number.isFinite) ||
    example.startX > example.markerX + example.positionTolerance ||
    example.lateStartX > example.markerX + example.positionTolerance ||
    example.initialVelocity < 0 ||
    example.initialVelocity > example.maxSpeed ||
    example.requiredVelocity <= 0 ||
    example.maxSpeed <= 0 ||
    example.maxAcceleration <= 0 ||
    example.responseTime <= 0 ||
    example.positionTolerance <= 0 ||
    example.velocityTolerance <= 0 ||
    example.verticalVelocity <= 0 ||
    example.gravity <= 0 ||
    example.timeStep <= 0 ||
    example.padHalfWidth <= 0 ||
    example.arrowSeconds <= 0 ||
    example.radius <= 0 ||
    !Number.isInteger(example.steps) ||
    example.steps < 1 ||
    example.steps > 239
  )
    throw new Error(
      'Jump points need finite values, a forward runway, positive limits and 1–239 steps.',
    );
  return example;
};

export const jumpFlightDuration = (example: JumpPointsParameters) =>
  (2 * example.verticalVelocity) / example.gravity;

export const jumpPadCentre = (example: JumpPointsParameters) =>
  example.markerX + example.requiredVelocity * jumpFlightDuration(example);

/** The marker requires a velocity as well as a position; being at the marker alone cannot pass. */
export const canTakeOff = (x: number, velocity: number, example: JumpPointsParameters) =>
  Math.abs(x - example.markerX) <= example.positionTolerance &&
  Math.abs(velocity - example.requiredVelocity) <= example.velocityTolerance;

/** The engine calculates velocity matching; this study advances the one-dimensional run-up. */
export function jumpRunUpStep(
  state: Pick<JumpPointState, 'x' | 'velocity'>,
  example: JumpPointsParameters,
): JumpRunUpStep {
  const body: SteeringBody = {
    position: { x: state.x, y: 0 },
    velocity: { x: state.velocity, y: 0 },
    heading: { x: 1, y: 0 },
    maxSpeed: example.maxSpeed,
    maxAcceleration: example.maxAcceleration,
    radius: example.radius,
    wanderAngle: 0,
  };
  const requestedAcceleration = (example.requiredVelocity - state.velocity) / example.responseTime;
  const acceleration = matchVelocity(
    body,
    { x: example.requiredVelocity, y: 0 },
    example.responseTime,
  ).x;
  const velocity = Math.max(
    -example.maxSpeed,
    Math.min(example.maxSpeed, state.velocity + acceleration * example.timeStep),
  );
  return {
    requestedAcceleration,
    acceleration,
    velocity,
    x: state.x + velocity * example.timeStep,
  };
}

/** Exact constant-gravity flight from the actual accepted launch position and horizontal speed. */
export function jumpFlightPoint(
  takeoffX: number,
  velocity: number,
  airTime: number,
  example: JumpPointsParameters,
) {
  return {
    x: takeoffX + velocity * airTime,
    height: Math.max(
      0,
      example.verticalVelocity * airTime - (example.gravity * airTime * airTime) / 2,
    ),
    verticalVelocity: example.verticalVelocity - example.gravity * airTime,
  };
}

/** A one-pass runway: reject the first marker encounter if either launch condition fails. */
export interface JumpPointSample {
  readonly state: JumpPointState;
  readonly runUp: ReturnType<typeof jumpRunUpStep> | null;
}

export function jumpPointSamples(
  example: JumpPointsParameters,
  startX = example.startX,
): readonly JumpPointSample[] {
  const samples: JumpPointSample[] = [];
  let state: JumpPointState = {
    seconds: 0,
    x: startX,
    height: 0,
    velocity: example.initialVelocity,
    verticalVelocity: 0,
    phase: 'run-up',
    airTime: 0,
    takeoffX: null,
    takeoffSeconds: null,
  };
  const duration = jumpFlightDuration(example);
  for (let step = 0; step <= example.steps; step++) {
    if (state.phase === 'run-up' && state.x >= example.markerX - example.positionTolerance) {
      state = canTakeOff(state.x, state.velocity, example)
        ? {
            ...state,
            phase: 'airborne',
            verticalVelocity: example.verticalVelocity,
            takeoffX: state.x,
            takeoffSeconds: state.seconds,
          }
        : { ...state, phase: 'rejected' };
    }
    const runUp = state.phase === 'run-up' ? jumpRunUpStep(state, example) : null;
    samples.push({ state, runUp });
    if (state.phase === 'landed' || state.phase === 'rejected' || step === example.steps) break;
    if (state.phase === 'run-up' && runUp) {
      const next = runUp;
      state = {
        ...state,
        seconds: state.seconds + example.timeStep,
        x: next.x,
        velocity: next.velocity,
      };
    } else {
      const airTime = Math.min(duration, state.airTime + example.timeStep);
      const takeoffX = state.takeoffX ?? state.x;
      const takeoffSeconds = state.takeoffSeconds ?? state.seconds;
      state = {
        ...state,
        ...jumpFlightPoint(takeoffX, state.velocity, airTime, example),
        seconds: takeoffSeconds + airTime,
        airTime,
        phase: airTime >= duration ? 'landed' : 'airborne',
      };
    }
  }
  return samples;
}

export function jumpPointFrames(
  example: JumpPointsParameters,
  startX = example.startX,
): readonly JumpPointState[] {
  return jumpPointSamples(example, startX).map(({ state }) => state);
}

export function stateAt(states: readonly JumpPointState[], seconds: number) {
  return states.reduce((latest, state) => (state.seconds <= seconds ? state : latest), states[0]);
}

/** The requested ballistic arc is fixed for the whole run, independent of the scrubbed frame. */
export const plannedJump = (example: JumpPointsParameters) =>
  Array.from({ length: 17 }, (_unused, index) =>
    jumpFlightPoint(
      example.markerX,
      example.requiredVelocity,
      (jumpFlightDuration(example) * index) / 16,
      example,
    ),
  );

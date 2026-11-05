import type { StudyParameters } from '@dotln-angular/models';
import {
  add,
  clipLength,
  cosine,
  length,
  scale,
  seek,
  sine,
  type SteeringBody,
  subtract,
  type Vec2,
} from '@dotln-angular/scene-engine';

import { numberParameter } from '../parameters';

export interface HalfDimensionsParameters {
  readonly startX: number;
  readonly startZ: number;
  readonly targetX: number;
  readonly targetZ: number;
  readonly maxSpeed: number;
  readonly maxAcceleration: number;
  readonly rampStart: number;
  readonly rampRun: number;
  readonly ledgeRun: number;
  readonly rise: number;
  readonly timeStep: number;
  readonly steps: number;
  readonly bodyHeight: number;
}

export interface CourierState {
  readonly x: number;
  readonly height: number;
  readonly z: number;
  readonly velocity: Vec2;
  readonly verticalSpeed: number;
  readonly yaw: number;
  readonly pitch: 0;
  readonly roll: 0;
}

export const readParameters = (parameters: StudyParameters): HalfDimensionsParameters => ({
  startX: numberParameter(parameters, 'startX'),
  startZ: numberParameter(parameters, 'startZ'),
  targetX: numberParameter(parameters, 'targetX'),
  targetZ: numberParameter(parameters, 'targetZ'),
  maxSpeed: numberParameter(parameters, 'maxSpeed'),
  maxAcceleration: numberParameter(parameters, 'maxAcceleration'),
  rampStart: numberParameter(parameters, 'rampStart'),
  rampRun: numberParameter(parameters, 'rampRun'),
  ledgeRun: numberParameter(parameters, 'ledgeRun'),
  rise: numberParameter(parameters, 'rise'),
  timeStep: numberParameter(parameters, 'timeStep'),
  steps: numberParameter(parameters, 'steps'),
  bodyHeight: numberParameter(parameters, 'bodyHeight'),
});

export const degrees = (angle: number) => (angle * 180) / Math.PI;

export const planeOf = (state: CourierState): Vec2 => ({ x: state.x, y: state.z });

export const targetOf = (example: HalfDimensionsParameters): Vec2 => ({
  x: example.targetX,
  y: example.targetZ,
});

/** This single-valued surface is a teaching sampler, not a collision or navigation query. */
export function concourseHeight(
  x: number,
  example: HalfDimensionsParameters,
  rampRun = example.rampRun,
) {
  if (x < example.rampStart) return 0;
  if (rampRun === 0) return example.rise;
  return example.rise * Math.max(0, Math.min(1, (x - example.rampStart) / rampRun));
}

export const initialCourierState = (
  example: HalfDimensionsParameters,
  rampRun = example.rampRun,
): CourierState => ({
  x: example.startX,
  height: concourseHeight(example.startX, example, rampRun),
  z: example.startZ,
  velocity: { x: 0, y: 0 },
  verticalSpeed: 0,
  yaw: 0,
  pitch: 0,
  roll: 0,
});

export function calculateCourierStep(
  state: CourierState,
  example: HalfDimensionsParameters,
  rampRun = example.rampRun,
) {
  // Engine Vec2.y carries world z. Height never enters the engine's planar steering call.
  const body: SteeringBody = {
    position: planeOf(state),
    velocity: state.velocity,
    heading: { x: cosine(state.yaw), y: sine(state.yaw) },
    maxSpeed: example.maxSpeed,
    maxAcceleration: example.maxAcceleration,
    radius: 0,
    wanderAngle: 0,
  };
  const target = targetOf(example);
  const offset = subtract(target, body.position);
  const acceleration = seek(body, target);
  const candidateVelocity = clipLength(
    add(state.velocity, scale(acceleration, example.timeStep)),
    example.maxSpeed,
  );
  const travel = scale(candidateVelocity, example.timeStep);
  // Clamp the last partial step on this straight route; this is not an Arrive controller.
  const reached = length(travel) >= length(offset);
  const position = reached ? target : add(body.position, travel);
  const height = concourseHeight(position.x, example, rampRun);
  const next: CourierState = {
    x: position.x,
    height,
    z: position.y,
    velocity: reached ? { x: 0, y: 0 } : candidateVelocity,
    verticalSpeed: (height - state.height) / example.timeStep,
    yaw:
      length(candidateVelocity) === 0
        ? state.yaw
        : Math.atan2(candidateVelocity.y, candidateVelocity.x),
    pitch: 0,
    roll: 0,
  };
  return { acceleration, candidateVelocity, reached, next };
}

/** Retain the controller result used to advance each displayed state. */
export interface CourierSample {
  readonly state: CourierState;
  readonly calculation: ReturnType<typeof calculateCourierStep>;
  readonly next: CourierState;
}

export function courierSamples(
  example: HalfDimensionsParameters,
  rampRun = example.rampRun,
): readonly CourierSample[] {
  const samples: CourierSample[] = [];
  let state: CourierState = initialCourierState(example, rampRun);
  for (let step = 0; step <= example.steps; step++) {
    const calculation = calculateCourierStep(state, example, rampRun);
    const next = calculation.next;
    samples.push({ state, calculation, next });
    state = next;
  }
  return samples;
}

/** State-only access stays available to existing callers. */
export function courierStates(
  example: HalfDimensionsParameters,
  rampRun = example.rampRun,
): readonly CourierState[] {
  return courierSamples(example, rampRun).map(({ state }) => state);
}

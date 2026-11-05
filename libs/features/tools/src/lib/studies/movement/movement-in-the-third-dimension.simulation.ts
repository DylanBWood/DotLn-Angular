import type { StudyParameters } from '@dotln-angular/models';
import { cosine, sine } from '@dotln-angular/scene-engine';

import { numberParameter } from '../parameters';
import type { StudyPoint } from '../study-model';

export interface ThirdDimensionParameters {
  readonly startX: number;
  readonly startY: number;
  readonly startZ: number;
  readonly targetX: number;
  readonly targetY: number;
  readonly targetZ: number;
  readonly maxSpeed: number;
  readonly maxAcceleration: number;
  readonly timeStep: number;
  readonly steps: number;
  readonly rollDegrees: number;
  readonly verticalWeight: number;
  readonly flatVerticalWeight: number;
  readonly wingSpan: number;
}

export interface VolumeVector {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface DroneState {
  readonly position: VolumeVector;
  readonly velocity: VolumeVector;
  readonly yaw: number;
  readonly pitch: number;
  readonly roll: number;
}

export const readParameters = (parameters: StudyParameters): ThirdDimensionParameters => ({
  startX: numberParameter(parameters, 'startX'),
  startY: numberParameter(parameters, 'startY'),
  startZ: numberParameter(parameters, 'startZ'),
  targetX: numberParameter(parameters, 'targetX'),
  targetY: numberParameter(parameters, 'targetY'),
  targetZ: numberParameter(parameters, 'targetZ'),
  maxSpeed: numberParameter(parameters, 'maxSpeed'),
  maxAcceleration: numberParameter(parameters, 'maxAcceleration'),
  timeStep: numberParameter(parameters, 'timeStep'),
  steps: numberParameter(parameters, 'steps'),
  rollDegrees: numberParameter(parameters, 'rollDegrees'),
  verticalWeight: numberParameter(parameters, 'verticalWeight'),
  flatVerticalWeight: numberParameter(parameters, 'flatVerticalWeight'),
  wingSpan: numberParameter(parameters, 'wingSpan'),
});

export const origin: VolumeVector = { x: 0, y: 0, z: 0 };

export const add3 = (a: VolumeVector, b: VolumeVector): VolumeVector => ({
  x: a.x + b.x,
  y: a.y + b.y,
  z: a.z + b.z,
});

export const subtract3 = (a: VolumeVector, b: VolumeVector): VolumeVector => ({
  x: a.x - b.x,
  y: a.y - b.y,
  z: a.z - b.z,
});

export const scale3 = (value: VolumeVector, factor: number): VolumeVector => ({
  x: value.x * factor,
  y: value.y * factor,
  z: value.z * factor,
});

export const volumeLength = (value: VolumeVector) =>
  Math.sqrt(value.x * value.x + value.y * value.y + value.z * value.z);

export const clipped3 = (value: VolumeVector, maximum: number) => {
  const speed = volumeLength(value);
  return speed > maximum ? scale3(value, maximum / speed) : value;
};

export const targetOf = (example: ThirdDimensionParameters): VolumeVector => ({
  x: example.targetX,
  y: example.targetY,
  z: example.targetZ,
});

export const radians = (degrees: number) => (degrees * Math.PI) / 180;

export const degrees = (angle: number) => (angle * 180) / Math.PI;

export const initialDroneState = (example: ThirdDimensionParameters): DroneState => ({
  position: { x: example.startX, y: example.startY, z: example.startZ },
  velocity: origin,
  yaw: 0,
  pitch: 0,
  roll: radians(example.rollDegrees),
});

/** The public scene engine has Vec2 only; this volume step is explicitly study-local. */
export function calculateThirdDimensionStep(
  state: DroneState,
  example: ThirdDimensionParameters,
  verticalWeight = example.verticalWeight,
) {
  const target = targetOf(example);
  const effectiveTarget = {
    ...target,
    y: state.position.y + (target.y - state.position.y) * verticalWeight,
  };
  const offset = subtract3(effectiveTarget, state.position);
  const distance = volumeLength(offset);
  const acceleration = distance === 0 ? origin : scale3(offset, example.maxAcceleration / distance);
  const candidateVelocity = clipped3(
    add3(state.velocity, scale3(acceleration, example.timeStep)),
    example.maxSpeed,
  );
  const travel = scale3(candidateVelocity, example.timeStep);
  // This example approaches along one straight ray. The final partial step prevents buzzing.
  const reached = volumeLength(travel) >= distance;
  const moving = volumeLength(candidateVelocity) > 0;
  const horizontalSpeed = Math.hypot(candidateVelocity.x, candidateVelocity.z);
  const next: DroneState = {
    position: reached ? effectiveTarget : add3(state.position, travel),
    velocity: reached ? origin : candidateVelocity,
    yaw: horizontalSpeed === 0 ? state.yaw : Math.atan2(candidateVelocity.z, candidateVelocity.x),
    pitch: moving ? Math.atan2(candidateVelocity.y, horizontalSpeed) : state.pitch,
    roll: radians(example.rollDegrees),
  };
  return { offset, distance, acceleration, candidateVelocity, reached, next };
}

/** Retain the controller result used to advance each displayed state. */
export interface ThirdDimensionSample {
  readonly state: DroneState;
  readonly calculation: ReturnType<typeof calculateThirdDimensionStep>;
  readonly next: DroneState;
}

export function thirdDimensionSamples(
  example: ThirdDimensionParameters,
  verticalWeight = example.verticalWeight,
): readonly ThirdDimensionSample[] {
  const samples: ThirdDimensionSample[] = [];
  let state: DroneState = initialDroneState(example);
  for (let step = 0; step <= example.steps; step++) {
    const calculation = calculateThirdDimensionStep(state, example, verticalWeight);
    const next = calculation.next;
    samples.push({ state, calculation, next });
    state = next;
  }
  return samples;
}

/** State-only access stays available to existing callers. */
export function thirdDimensionStates(
  example: ThirdDimensionParameters,
  verticalWeight = example.verticalWeight,
): readonly DroneState[] {
  return thirdDimensionSamples(example, verticalWeight).map(({ state }) => state);
}

/** Yaw and pitch choose the nose; roll independently turns the wing about that nose. */
export function droneAxes(state: Pick<DroneState, 'yaw' | 'pitch' | 'roll'>) {
  const [cy, sy] = [cosine(state.yaw), sine(state.yaw)];
  const [cp, sp] = [cosine(state.pitch), sine(state.pitch)];
  const forward = { x: cp * cy, y: sp, z: cp * sy };
  const levelRight = { x: -sy, y: 0, z: cy };
  const levelUp = { x: -sp * cy, y: cp, z: -sp * sy };
  const right = add3(scale3(levelRight, cosine(state.roll)), scale3(levelUp, sine(state.roll)));
  return { forward, levelRight, right };
}

// An oblique projection keeps height separate from depth on the existing motion surface.
export const projectDrone = ({ x, y, z }: VolumeVector): StudyPoint => ({
  x: x + z * 0.5,
  y: z * 0.35 - y,
});

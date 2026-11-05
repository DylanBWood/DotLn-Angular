import type { StudyParameters } from '@dotln-angular/models';
import {
  add,
  blend,
  clipLength,
  distance,
  scale,
  seek,
  separate,
  type SteeringBody,
  type Vec2,
  zero,
} from '@dotln-angular/scene-engine';

import { numberParameter } from '../parameters';

export interface WeightedBlendingParameters {
  readonly startX: number;
  readonly startY: number;
  readonly targetX: number;
  readonly targetY: number;
  readonly robotX: number;
  readonly robotY: number;
  readonly alignedRobotY: number;
  readonly radius: number;
  readonly threshold: number;
  readonly maxAcceleration: number;
  readonly maxSpeed: number;
  readonly seekWeight: number;
  readonly separationWeight: number;
  readonly timeStep: number;
  readonly steps: number;
  readonly accelerationScale: number;
}

export interface BlendingStep {
  readonly seekRequest: Vec2;
  readonly separationRequest: Vec2;
  readonly weightedSeek: Vec2;
  readonly weightedSeparation: Vec2;
  readonly raw: Vec2;
  readonly acceleration: Vec2;
  readonly robotDistance: number;
  readonly next: SteeringBody;
}

export const readParameters = (parameters: StudyParameters): WeightedBlendingParameters => ({
  startX: numberParameter(parameters, 'startX'),
  startY: numberParameter(parameters, 'startY'),
  targetX: numberParameter(parameters, 'targetX'),
  targetY: numberParameter(parameters, 'targetY'),
  robotX: numberParameter(parameters, 'robotX'),
  robotY: numberParameter(parameters, 'robotY'),
  alignedRobotY: numberParameter(parameters, 'alignedRobotY'),
  radius: numberParameter(parameters, 'radius'),
  threshold: numberParameter(parameters, 'threshold'),
  maxAcceleration: numberParameter(parameters, 'maxAcceleration'),
  maxSpeed: numberParameter(parameters, 'maxSpeed'),
  seekWeight: numberParameter(parameters, 'seekWeight'),
  separationWeight: numberParameter(parameters, 'separationWeight'),
  timeStep: numberParameter(parameters, 'timeStep'),
  steps: numberParameter(parameters, 'steps'),
  accelerationScale: numberParameter(parameters, 'accelerationScale'),
});

export const targetOf = (example: WeightedBlendingParameters): Vec2 => ({
  x: example.targetX,
  y: example.targetY,
});

export const robotOf = (example: WeightedBlendingParameters, y = example.robotY): Vec2 => ({
  x: example.robotX,
  y,
});

export const createNia = (example: WeightedBlendingParameters): SteeringBody => ({
  position: { x: example.startX, y: example.startY },
  velocity: zero,
  heading: { x: 1, y: 0 },
  radius: example.radius,
  maxAcceleration: example.maxAcceleration,
  maxSpeed: example.maxSpeed,
  wanderAngle: 0,
});

/** Engine behaviours produce the requests and the blend; this study applies their result. */
export function calculateBlendingStep(
  before: SteeringBody,
  example: WeightedBlendingParameters,
  robotY = example.robotY,
): BlendingStep {
  const robot: SteeringBody = { ...createNia(example), position: robotOf(example, robotY) };
  const seekRequest = seek(before, targetOf(example));
  const separationRequest = separate(before, 0, [before, robot], {
    separationThreshold: example.threshold,
    separationFalloff: 1,
  });
  const weightedSeek = scale(seekRequest, example.seekWeight);
  const weightedSeparation = scale(separationRequest, example.separationWeight);
  const raw = add(weightedSeek, weightedSeparation);
  const acceleration = blend(
    [
      { acceleration: seekRequest, weight: example.seekWeight },
      { acceleration: separationRequest, weight: example.separationWeight },
    ],
    example.maxAcceleration,
  );
  const velocity = clipLength(
    add(before.velocity, scale(acceleration, example.timeStep)),
    example.maxSpeed,
  );
  return {
    seekRequest,
    separationRequest,
    weightedSeek,
    weightedSeparation,
    raw,
    acceleration,
    robotDistance: distance(before.position, robot.position),
    next: {
      ...before,
      velocity,
      position: add(before.position, scale(velocity, example.timeStep)),
    },
  };
}

/** Retain the controller result used to advance each displayed state. */
export interface BlendingSample {
  readonly state: SteeringBody;
  readonly calculation: ReturnType<typeof calculateBlendingStep>;
  readonly next: SteeringBody;
}

export function blendingSamples(
  example: WeightedBlendingParameters,
  robotY = example.robotY,
): readonly BlendingSample[] {
  const samples: BlendingSample[] = [];
  let state: SteeringBody = createNia(example);
  for (let step = 0; step <= example.steps; step++) {
    const calculation = calculateBlendingStep(state, example, robotY);
    const next = calculation.next;
    samples.push({ state, calculation, next });
    state = next;
  }
  return samples;
}

/** State-only access stays available to existing callers. */
export function blendingFrames(
  example: WeightedBlendingParameters,
  robotY = example.robotY,
): readonly SteeringBody[] {
  return blendingSamples(example, robotY).map(({ state }) => state);
}

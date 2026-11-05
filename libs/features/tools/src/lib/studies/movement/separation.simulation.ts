import type { StudyParameters } from '@dotln-angular/models';
import {
  add,
  clipLength,
  distance,
  scale,
  separate,
  type SteeringBody,
  type Vec2,
} from '@dotln-angular/scene-engine';

import { numberParameter } from '../parameters';

export interface SeparationParameters {
  readonly centre: number;
  readonly initialGap: number;
  readonly inwardSpeed: number;
  readonly fastInwardSpeed: number;
  readonly radius: number;
  readonly threshold: number;
  readonly maxAcceleration: number;
  readonly maxSpeed: number;
  readonly timeStep: number;
  readonly steps: number;
  readonly laneOffset: number;
  readonly accelerationScale: number;
}

export type ShelfPair = readonly [SteeringBody, SteeringBody];

export interface SeparationStep {
  readonly gap: number;
  readonly accelerations: readonly [Vec2, Vec2];
  readonly next: ShelfPair;
}

export const readParameters = (parameters: StudyParameters): SeparationParameters => ({
  centre: numberParameter(parameters, 'centre'),
  initialGap: numberParameter(parameters, 'initialGap'),
  inwardSpeed: numberParameter(parameters, 'inwardSpeed'),
  fastInwardSpeed: numberParameter(parameters, 'fastInwardSpeed'),
  radius: numberParameter(parameters, 'radius'),
  threshold: numberParameter(parameters, 'threshold'),
  maxAcceleration: numberParameter(parameters, 'maxAcceleration'),
  maxSpeed: numberParameter(parameters, 'maxSpeed'),
  timeStep: numberParameter(parameters, 'timeStep'),
  steps: numberParameter(parameters, 'steps'),
  laneOffset: numberParameter(parameters, 'laneOffset'),
  accelerationScale: numberParameter(parameters, 'accelerationScale'),
});

export function createShelfPair(
  example: SeparationParameters,
  inwardSpeed = example.inwardSpeed,
): ShelfPair {
  const courier = (side: number): SteeringBody => ({
    position: { x: example.centre + (side * example.initialGap) / 2, y: 0 },
    velocity: { x: -side * inwardSpeed, y: 0 },
    heading: { x: side, y: 0 },
    radius: example.radius,
    maxAcceleration: example.maxAcceleration,
    maxSpeed: example.maxSpeed,
    wanderAngle: 0,
  });
  return [courier(-1), courier(1)];
}

/** Both steering calls read the same pair before either courier changes position. */
export function calculateSeparationStep(
  before: ShelfPair,
  example: SeparationParameters,
  falloff: 1 | 2,
): SeparationStep {
  const tuning = { separationThreshold: example.threshold, separationFalloff: falloff };
  const accelerations = [
    separate(before[0], 0, before, tuning),
    separate(before[1], 1, before, tuning),
  ] as const;
  const move = (body: SteeringBody, acceleration: Vec2): SteeringBody => {
    const velocity = clipLength(
      add(body.velocity, scale(acceleration, example.timeStep)),
      body.maxSpeed,
    );
    return { ...body, velocity, position: add(body.position, scale(velocity, example.timeStep)) };
  };
  return {
    gap: distance(before[0].position, before[1].position),
    accelerations,
    next: [move(before[0], accelerations[0]), move(before[1], accelerations[1])],
  };
}

/** Retain the controller result used to advance each displayed state. */
export interface SeparationSample {
  readonly state: ShelfPair;
  readonly calculation: ReturnType<typeof calculateSeparationStep>;
  readonly next: ShelfPair;
}

export function separationSamples(
  example: SeparationParameters,
  falloff: 1 | 2,
  inwardSpeed = example.inwardSpeed,
): readonly SeparationSample[] {
  const samples: SeparationSample[] = [];
  let state: ShelfPair = createShelfPair(example, inwardSpeed);
  for (let step = 0; step <= example.steps; step++) {
    const calculation = calculateSeparationStep(state, example, falloff);
    const next = calculation.next;
    samples.push({ state, calculation, next });
    state = next;
  }
  return samples;
}

/** State-only access stays available to existing callers. */
export function separationFrames(
  example: SeparationParameters,
  falloff: 1 | 2,
  inwardSpeed = example.inwardSpeed,
): readonly ShelfPair[] {
  return separationSamples(example, falloff, inwardSpeed).map(({ state }) => state);
}

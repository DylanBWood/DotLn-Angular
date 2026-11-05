import type { StudyParameters } from '@dotln-angular/models';
import {
  add,
  clipLength,
  dot,
  length,
  scale,
  seek,
  subtract,
  type Vec2,
  zero,
} from '@dotln-angular/scene-engine';

import { numberParameter } from '../parameters';

export interface SeekParameters {
  readonly startX: number;
  readonly startY: number;
  readonly targetX: number;
  readonly targetY: number;
  readonly velocityX: number;
  readonly velocityY: number;
  readonly comparisonVelocityY: number;
  readonly maxSpeed: number;
  readonly maxAcceleration: number;
  readonly timeStep: number;
  readonly steps: number;
  readonly velocitySeconds: number;
  readonly accelerationSecondsSquared: number;
}

export interface SeekState {
  readonly position: Vec2;
  readonly velocity: Vec2;
}

export interface SeekStep {
  readonly offset: Vec2;
  readonly distance: number;
  readonly acceleration: Vec2;
  readonly trialVelocity: Vec2;
  readonly next: SeekState;
}

export const readParameters = (parameters: StudyParameters): SeekParameters => ({
  startX: numberParameter(parameters, 'startX'),
  startY: numberParameter(parameters, 'startY'),
  targetX: numberParameter(parameters, 'targetX'),
  targetY: numberParameter(parameters, 'targetY'),
  velocityX: numberParameter(parameters, 'velocityX'),
  velocityY: numberParameter(parameters, 'velocityY'),
  comparisonVelocityY: numberParameter(parameters, 'comparisonVelocityY'),
  maxSpeed: numberParameter(parameters, 'maxSpeed'),
  maxAcceleration: numberParameter(parameters, 'maxAcceleration'),
  timeStep: numberParameter(parameters, 'timeStep'),
  steps: numberParameter(parameters, 'steps'),
  velocitySeconds: numberParameter(parameters, 'velocitySeconds'),
  accelerationSecondsSquared: numberParameter(parameters, 'accelerationSecondsSquared'),
});

export const beaconOf = (example: SeekParameters): Vec2 => ({
  x: example.targetX,
  y: example.targetY,
});

/** Seek is the engine's rule; the open-plane update uses its vector operations. */
export function calculateSeekStep(state: SeekState, example: SeekParameters): SeekStep {
  const beacon = beaconOf(example);
  const offset = subtract(beacon, state.position);
  const acceleration = seek(
    {
      ...state,
      maxSpeed: example.maxSpeed,
      maxAcceleration: example.maxAcceleration,
      // These fields complete the steering contract; seek does not read them.
      heading: zero,
      radius: 0,
      wanderAngle: 0,
    },
    beacon,
  );
  const trialVelocity = add(state.velocity, scale(acceleration, example.timeStep));
  const velocity = clipLength(trialVelocity, example.maxSpeed);
  return {
    offset,
    distance: length(offset),
    acceleration,
    trialVelocity,
    next: {
      position: add(state.position, scale(velocity, example.timeStep)),
      velocity,
    },
  };
}

/** Retain the controller result used to advance each displayed state. */
export interface SeekSample {
  readonly state: SeekState;
  readonly calculation: ReturnType<typeof calculateSeekStep>;
  readonly next: SeekState;
}

export function seekSamples(example: SeekParameters): readonly SeekSample[] {
  const samples: SeekSample[] = [];
  let state: SeekState = {
    position: { x: example.startX, y: example.startY },
    velocity: { x: example.velocityX, y: example.velocityY },
  };
  for (let step = 0; step <= example.steps; step++) {
    const calculation = calculateSeekStep(state, example);
    const next = calculation.next;
    samples.push({ state, calculation, next });
    state = next;
  }
  return samples;
}

/** State-only access stays available to existing callers. */
export function seekFrames(example: SeekParameters): readonly SeekState[] {
  return seekSamples(example).map(({ state }) => state);
}

/** Unwrap the radius direction to distinguish a complete circuit from a close pass. */
export function sweptAngles(states: readonly SeekState[], beacon: Vec2): readonly number[] {
  let angle = 0;
  return states.map((state, step) => {
    if (step > 0) {
      const before = subtract(states[step - 1].position, beacon);
      const after = subtract(state.position, beacon);
      const cross = before.x * after.y - before.y * after.x;
      angle += Math.atan2(cross, dot(before, after));
    }
    return angle;
  });
}

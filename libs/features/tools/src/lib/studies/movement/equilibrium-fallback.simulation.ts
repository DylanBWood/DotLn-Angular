import type { StudyParameters } from '@dotln-angular/models';
import {
  add,
  blend,
  clipLength,
  firstActive,
  length,
  normalize,
  scale,
  seek,
  type SteeringBody,
  type Vec2,
  wander,
} from '@dotln-angular/scene-engine';

import { numberParameter } from '../parameters';

export interface EquilibriumParameters {
  readonly initialX: number;
  readonly initialY: number;
  readonly initialVelocityX: number;
  readonly initialVelocityY: number;
  readonly headingX: number;
  readonly headingY: number;
  readonly beaconHalfSpan: number;
  readonly beaconY: number;
  readonly beaconWeight: number;
  readonly maxSpeed: number;
  readonly maxAcceleration: number;
  readonly radius: number;
  readonly wanderAngle: number;
  readonly wanderRadius: number;
  readonly wanderOffset: number;
  readonly responseTime: number;
  readonly fallbackWeight: number;
  readonly weakFallbackWeight: number;
  readonly epsilon: number;
  readonly timeStep: number;
  readonly steps: number;
}

export interface EquilibriumState {
  readonly position: Vec2;
  readonly velocity: Vec2;
}

export interface EquilibriumStep {
  readonly state: EquilibriumState;
  readonly left: Vec2;
  readonly right: Vec2;
  readonly primary: Vec2;
  readonly wander: Vec2;
  readonly fallback: Vec2;
  readonly acceleration: Vec2;
  readonly activeGroup: 'Beacon blend' | 'Wander fallback' | 'None';
  readonly next: EquilibriumState;
}

export const readParameters = (parameters: StudyParameters): EquilibriumParameters => ({
  initialX: numberParameter(parameters, 'initialX'),
  initialY: numberParameter(parameters, 'initialY'),
  initialVelocityX: numberParameter(parameters, 'initialVelocityX'),
  initialVelocityY: numberParameter(parameters, 'initialVelocityY'),
  headingX: numberParameter(parameters, 'headingX'),
  headingY: numberParameter(parameters, 'headingY'),
  beaconHalfSpan: numberParameter(parameters, 'beaconHalfSpan'),
  beaconY: numberParameter(parameters, 'beaconY'),
  beaconWeight: numberParameter(parameters, 'beaconWeight'),
  maxSpeed: numberParameter(parameters, 'maxSpeed'),
  maxAcceleration: numberParameter(parameters, 'maxAcceleration'),
  radius: numberParameter(parameters, 'radius'),
  wanderAngle: numberParameter(parameters, 'wanderAngle'),
  wanderRadius: numberParameter(parameters, 'wanderRadius'),
  wanderOffset: numberParameter(parameters, 'wanderOffset'),
  responseTime: numberParameter(parameters, 'responseTime'),
  fallbackWeight: numberParameter(parameters, 'fallbackWeight'),
  weakFallbackWeight: numberParameter(parameters, 'weakFallbackWeight'),
  epsilon: numberParameter(parameters, 'epsilon'),
  timeStep: numberParameter(parameters, 'timeStep'),
  steps: numberParameter(parameters, 'steps'),
});

/** A fixed wander heading isolates the nudge from any random change of direction. */
export function calculateEquilibriumStep(
  state: EquilibriumState,
  example: EquilibriumParameters,
  fallbackWeight = example.fallbackWeight,
): EquilibriumStep {
  const body: SteeringBody = {
    ...state,
    heading: normalize({ x: example.headingX, y: example.headingY }),
    maxSpeed: example.maxSpeed,
    maxAcceleration: example.maxAcceleration,
    radius: example.radius,
    wanderAngle: example.wanderAngle,
  };
  const left = seek(body, { x: -example.beaconHalfSpan, y: example.beaconY });
  const right = seek(body, { x: example.beaconHalfSpan, y: example.beaconY });
  const primary = blend(
    [
      { weight: example.beaconWeight, acceleration: left },
      { weight: example.beaconWeight, acceleration: right },
    ],
    example.maxAcceleration,
  );
  const wandering = wander(body, {
    wanderRadius: example.wanderRadius,
    wanderOffset: example.wanderOffset,
    timeToTarget: example.responseTime,
  });
  const fallback = blend(
    [{ weight: fallbackWeight, acceleration: wandering }],
    example.maxAcceleration,
  );
  const acceleration = firstActive([primary, fallback], example.epsilon);
  const activeGroup =
    length(acceleration) === 0
      ? 'None'
      : acceleration === primary
        ? 'Beacon blend'
        : 'Wander fallback';
  const velocity = clipLength(
    add(state.velocity, scale(acceleration, example.timeStep)),
    example.maxSpeed,
  );
  return {
    state,
    left,
    right,
    primary,
    wander: wandering,
    fallback,
    acceleration,
    activeGroup,
    next: { position: add(state.position, scale(velocity, example.timeStep)), velocity },
  };
}

export function equilibriumSteps(
  example: EquilibriumParameters,
  fallbackWeight = example.fallbackWeight,
): readonly EquilibriumStep[] {
  let state: EquilibriumState = {
    position: { x: example.initialX, y: example.initialY },
    velocity: { x: example.initialVelocityX, y: example.initialVelocityY },
  };
  const steps: EquilibriumStep[] = [];
  for (let index = 0; index <= example.steps; index++) {
    const step = calculateEquilibriumStep(state, example, fallbackWeight);
    steps.push(step);
    state = step.next;
  }
  return steps;
}

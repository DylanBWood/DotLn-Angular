import type { StudyParameters } from '@dotln-angular/models';
import {
  add,
  avoid,
  clipLength,
  distance,
  dot,
  length,
  normalize,
  scale,
  type SteeringBody,
  subtract,
  type Vec2,
} from '@dotln-angular/scene-engine';

import { numberParameter } from '../parameters';

export interface CollisionAvoidanceParameters {
  readonly courierStartX: number;
  readonly courierStartY: number;
  readonly courierVelocityX: number;
  readonly courierVelocityY: number;
  readonly porterStartX: number;
  readonly porterStartY: number;
  readonly porterVelocityX: number;
  readonly porterVelocityY: number;
  readonly courierRadius: number;
  readonly porterRadius: number;
  readonly maxSpeed: number;
  readonly maxAcceleration: number;
  readonly predictionHorizon: number;
  readonly comparisonPorterY: number;
  readonly timeStep: number;
  readonly steps: number;
  readonly velocitySeconds: number;
  readonly accelerationSecondsSquared: number;
}

export interface CollisionAgent {
  readonly position: Vec2;
  readonly velocity: Vec2;
}

export interface CollisionState {
  readonly courier: CollisionAgent;
  readonly porter: CollisionAgent;
}

export interface ClosestApproach {
  readonly relativePosition: Vec2;
  readonly relativeVelocity: Vec2;
  readonly relativeSpeedSquared: number;
  readonly time: number | null;
  readonly courierProjection: Vec2;
  readonly porterProjection: Vec2;
  readonly separation: number;
}

export interface CollisionAvoidanceStep {
  readonly prediction: ClosestApproach;
  readonly acceleration: Vec2;
  readonly next: CollisionState;
}

export const readParameters = (parameters: StudyParameters): CollisionAvoidanceParameters => ({
  courierStartX: numberParameter(parameters, 'courierStartX'),
  courierStartY: numberParameter(parameters, 'courierStartY'),
  courierVelocityX: numberParameter(parameters, 'courierVelocityX'),
  courierVelocityY: numberParameter(parameters, 'courierVelocityY'),
  porterStartX: numberParameter(parameters, 'porterStartX'),
  porterStartY: numberParameter(parameters, 'porterStartY'),
  porterVelocityX: numberParameter(parameters, 'porterVelocityX'),
  porterVelocityY: numberParameter(parameters, 'porterVelocityY'),
  courierRadius: numberParameter(parameters, 'courierRadius'),
  porterRadius: numberParameter(parameters, 'porterRadius'),
  maxSpeed: numberParameter(parameters, 'maxSpeed'),
  maxAcceleration: numberParameter(parameters, 'maxAcceleration'),
  predictionHorizon: numberParameter(parameters, 'predictionHorizon'),
  comparisonPorterY: numberParameter(parameters, 'comparisonPorterY'),
  timeStep: numberParameter(parameters, 'timeStep'),
  steps: numberParameter(parameters, 'steps'),
  velocitySeconds: numberParameter(parameters, 'velocitySeconds'),
  accelerationSecondsSquared: numberParameter(parameters, 'accelerationSecondsSquared'),
});

export const initialCollisionState = (
  example: CollisionAvoidanceParameters,
  porterY = example.porterStartY,
): CollisionState => ({
  courier: {
    position: { x: example.courierStartX, y: example.courierStartY },
    velocity: { x: example.courierVelocityX, y: example.courierVelocityY },
  },
  porter: {
    position: { x: example.porterStartX, y: porterY },
    velocity: { x: example.porterVelocityX, y: example.porterVelocityY },
  },
});

/** Constant-velocity projections explain the same dot-product test that engine avoid reads. */
export function closestApproach(state: CollisionState): ClosestApproach {
  const relativePosition = subtract(state.porter.position, state.courier.position);
  const relativeVelocity = subtract(state.porter.velocity, state.courier.velocity);
  const relativeSpeedSquared = dot(relativeVelocity, relativeVelocity);
  const time =
    relativeSpeedSquared === 0
      ? null
      : -dot(relativePosition, relativeVelocity) / relativeSpeedSquared;
  const courierProjection = add(state.courier.position, scale(state.courier.velocity, time ?? 0));
  const porterProjection = add(state.porter.position, scale(state.porter.velocity, time ?? 0));
  return {
    relativePosition,
    relativeVelocity,
    relativeSpeedSquared,
    time,
    courierProjection,
    porterProjection,
    separation: distance(courierProjection, porterProjection),
  };
}

export const steeringBody = (
  agent: CollisionAgent,
  radius: number,
  example: CollisionAvoidanceParameters,
): SteeringBody => ({
  ...agent,
  heading: normalize(agent.velocity),
  radius,
  maxSpeed: example.maxSpeed,
  maxAcceleration: example.maxAcceleration,
  wanderAngle: 0,
});

/** Engine avoid chooses the acceleration; the study advances an open plane at fixed steps. */
export function calculateCollisionAvoidanceStep(
  state: CollisionState,
  example: CollisionAvoidanceParameters,
): CollisionAvoidanceStep {
  if (example.predictionHorizon !== 1.5)
    throw new Error('Engine avoid has a fixed prediction horizon of 1.5 seconds.');
  const courier = steeringBody(state.courier, example.courierRadius, example);
  const porter = steeringBody(state.porter, example.porterRadius, example);
  const acceleration = avoid(courier, 0, [courier, porter]);
  const velocity = clipLength(
    add(state.courier.velocity, scale(acceleration, example.timeStep)),
    example.maxSpeed,
  );
  return {
    prediction: closestApproach(state),
    acceleration,
    next: {
      courier: {
        position: add(state.courier.position, scale(velocity, example.timeStep)),
        velocity,
      },
      porter: {
        position: add(state.porter.position, scale(state.porter.velocity, example.timeStep)),
        velocity: state.porter.velocity,
      },
    },
  };
}

/** Retain the controller result used to advance each displayed state. */
export interface CollisionAvoidanceSample {
  readonly state: CollisionState;
  readonly calculation: ReturnType<typeof calculateCollisionAvoidanceStep>;
  readonly next: CollisionState;
}

export function collisionAvoidanceSamples(
  example: CollisionAvoidanceParameters,
  porterY = example.porterStartY,
): readonly CollisionAvoidanceSample[] {
  const samples: CollisionAvoidanceSample[] = [];
  let state: CollisionState = initialCollisionState(example, porterY);
  for (let step = 0; step <= example.steps; step++) {
    const calculation = calculateCollisionAvoidanceStep(state, example);
    const next = calculation.next;
    samples.push({ state, calculation, next });
    state = next;
  }
  return samples;
}

/** State-only access stays available to existing callers. */
export function collisionAvoidanceFrames(
  example: CollisionAvoidanceParameters,
  porterY = example.porterStartY,
): readonly CollisionState[] {
  return collisionAvoidanceSamples(example, porterY).map(({ state }) => state);
}

/** Check the straight movement between samples as well as the displayed sample positions. */
export function minimumCollisionSeparation(states: readonly CollisionState[]): number {
  return Math.min(
    ...states.map((state, index) => {
      const start = subtract(state.porter.position, state.courier.position);
      if (index === states.length - 1) return length(start);
      const next = states[index + 1];
      const change = subtract(subtract(next.porter.position, next.courier.position), start);
      const square = dot(change, change);
      const fraction = square === 0 ? 0 : Math.max(0, Math.min(1, -dot(start, change) / square));
      return length(add(start, scale(change, fraction)));
    }),
  );
}

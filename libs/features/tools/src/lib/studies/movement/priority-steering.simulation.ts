import type { StudyParameters } from '@dotln-angular/models';
import {
  add,
  arrive,
  blend,
  clipLength,
  distance,
  firstActive,
  length,
  matchVelocity,
  scale,
  separate,
  type SteeringBody,
  type Vec2,
  zero,
} from '@dotln-angular/scene-engine';

import { numberParameter } from '../parameters';

export interface PriorityParameters {
  readonly initialPosition: number;
  readonly initialVelocity: number;
  readonly trolleyPosition: number;
  readonly target: number;
  readonly maxSpeed: number;
  readonly maxAcceleration: number;
  readonly radius: number;
  readonly separationThreshold: number;
  readonly separationFalloff: number;
  readonly separationWeight: number;
  readonly brakeWeight: number;
  readonly slowRadius: number;
  readonly targetRadius: number;
  readonly responseTime: number;
  readonly epsilon: number;
  readonly timeStep: number;
  readonly steps: number;
  readonly clearancePriority: number;
}

export interface PriorityState {
  readonly position: Vec2;
  readonly velocity: Vec2;
}

export interface PriorityStep {
  readonly state: PriorityState;
  readonly gap: number;
  readonly separation: Vec2;
  readonly brake: Vec2;
  readonly clearance: Vec2;
  readonly travel: Vec2;
  readonly acceleration: Vec2;
  readonly activeGroup: 'Clearance' | 'Travel' | 'None';
  readonly next: PriorityState;
}

export const readParameters = (parameters: StudyParameters): PriorityParameters => ({
  initialPosition: numberParameter(parameters, 'initialPosition'),
  initialVelocity: numberParameter(parameters, 'initialVelocity'),
  trolleyPosition: numberParameter(parameters, 'trolleyPosition'),
  target: numberParameter(parameters, 'target'),
  maxSpeed: numberParameter(parameters, 'maxSpeed'),
  maxAcceleration: numberParameter(parameters, 'maxAcceleration'),
  radius: numberParameter(parameters, 'radius'),
  separationThreshold: numberParameter(parameters, 'separationThreshold'),
  separationFalloff: numberParameter(parameters, 'separationFalloff'),
  separationWeight: numberParameter(parameters, 'separationWeight'),
  brakeWeight: numberParameter(parameters, 'brakeWeight'),
  slowRadius: numberParameter(parameters, 'slowRadius'),
  targetRadius: numberParameter(parameters, 'targetRadius'),
  responseTime: numberParameter(parameters, 'responseTime'),
  epsilon: numberParameter(parameters, 'epsilon'),
  timeStep: numberParameter(parameters, 'timeStep'),
  steps: numberParameter(parameters, 'steps'),
  clearancePriority: numberParameter(parameters, 'clearancePriority'),
});

export const bodyOf = (state: PriorityState, example: PriorityParameters): SteeringBody => ({
  ...state,
  heading: { x: 1, y: 0 },
  maxSpeed: example.maxSpeed,
  maxAcceleration: example.maxAcceleration,
  radius: example.radius,
  wanderAngle: 0,
});

/** Engine groups choose acceleration; the study advances velocity and then position. */
export function calculatePriorityStep(
  state: PriorityState,
  example: PriorityParameters,
  clearancePriority = example.clearancePriority,
): PriorityStep {
  const body = bodyOf(state, example);
  const trolley = bodyOf(
    { position: { x: example.trolleyPosition, y: 0 }, velocity: zero },
    example,
  );
  const separation = separate(body, 0, [body, trolley], example);
  const brake = matchVelocity(body, zero, example.responseTime);
  // Braking belongs to the clearance group only while there is a separation request.
  const clearance =
    length(separation) === 0
      ? zero
      : blend(
          [
            { weight: example.separationWeight, acceleration: separation },
            { weight: example.brakeWeight, acceleration: brake },
          ],
          example.maxAcceleration,
        );
  const travel = arrive(
    body,
    { x: example.target, y: 0 },
    {
      slowRadius: example.slowRadius,
      targetRadius: example.targetRadius,
      timeToTarget: example.responseTime,
    },
  );
  const groups = clearancePriority === 1 ? [clearance, travel] : [travel, clearance];
  const acceleration = firstActive(groups, example.epsilon);
  const activeGroup =
    length(acceleration) === 0 ? 'None' : acceleration === clearance ? 'Clearance' : 'Travel';
  const velocity = clipLength(
    add(state.velocity, scale(acceleration, example.timeStep)),
    example.maxSpeed,
  );
  return {
    state,
    gap: distance(body.position, trolley.position),
    separation,
    brake,
    clearance,
    travel,
    acceleration,
    activeGroup,
    next: { position: add(state.position, scale(velocity, example.timeStep)), velocity },
  };
}

export function prioritySteps(
  example: PriorityParameters,
  clearancePriority = example.clearancePriority,
): readonly PriorityStep[] {
  let state: PriorityState = {
    position: { x: example.initialPosition, y: 0 },
    velocity: { x: example.initialVelocity, y: 0 },
  };
  const steps: PriorityStep[] = [];
  for (let index = 0; index <= example.steps; index++) {
    const step = calculatePriorityStep(state, example, clearancePriority);
    steps.push(step);
    state = step.next;
  }
  return steps;
}

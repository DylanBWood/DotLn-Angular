import type { StudyParameters } from '@dotln-angular/models';
import {
  add,
  arrive,
  clipLength,
  scale,
  seek,
  type SteeringBody,
  type Vec2,
} from '@dotln-angular/scene-engine';

import { numberParameter } from '../parameters';

export interface BehaviourParameters {
  readonly initialPosition: number;
  readonly initialVelocity: number;
  readonly target: number;
  readonly maxSpeed: number;
  readonly maxAcceleration: number;
  readonly radius: number;
  readonly slowRadius: number;
  readonly targetRadius: number;
  readonly responseTime: number;
  readonly arrivalEnabled: number;
  readonly timeStep: number;
  readonly steps: number;
}

export interface BehaviourState {
  readonly position: Vec2;
  readonly velocity: Vec2;
}

export interface BehaviourStep {
  readonly state: BehaviourState;
  readonly seekRequest: Vec2;
  readonly arriveRequest: Vec2;
  readonly desiredVelocity: number;
  readonly acceleration: Vec2;
  readonly next: BehaviourState;
}

export const readParameters = (parameters: StudyParameters): BehaviourParameters => ({
  initialPosition: numberParameter(parameters, 'initialPosition'),
  initialVelocity: numberParameter(parameters, 'initialVelocity'),
  target: numberParameter(parameters, 'target'),
  maxSpeed: numberParameter(parameters, 'maxSpeed'),
  maxAcceleration: numberParameter(parameters, 'maxAcceleration'),
  radius: numberParameter(parameters, 'radius'),
  slowRadius: numberParameter(parameters, 'slowRadius'),
  targetRadius: numberParameter(parameters, 'targetRadius'),
  responseTime: numberParameter(parameters, 'responseTime'),
  arrivalEnabled: numberParameter(parameters, 'arrivalEnabled'),
  timeStep: numberParameter(parameters, 'timeStep'),
  steps: numberParameter(parameters, 'steps'),
});

/** Both family members read the same snapshot and return the engine's acceleration. */
export function calculateBehaviourStep(
  state: BehaviourState,
  example: BehaviourParameters,
  arrivalEnabled = example.arrivalEnabled,
): BehaviourStep {
  const body: SteeringBody = {
    ...state,
    heading: { x: 1, y: 0 },
    maxSpeed: example.maxSpeed,
    maxAcceleration: example.maxAcceleration,
    radius: example.radius,
    wanderAngle: 0,
  };
  const target = { x: example.target, y: 0 };
  const seekRequest = seek(body, target);
  const arriveRequest = arrive(body, target, {
    slowRadius: example.slowRadius,
    targetRadius: example.targetRadius,
    timeToTarget: example.responseTime,
  });
  const acceleration = arrivalEnabled === 1 ? arriveRequest : seekRequest;
  const velocity = clipLength(
    add(state.velocity, scale(acceleration, example.timeStep)),
    example.maxSpeed,
  );
  const gap = Math.abs(example.target - state.position.x);
  const stop = example.targetRadius / 2;
  // This is a readout of Arrive's requested velocity, not a second steering implementation.
  const desiredSpeed =
    gap <= stop
      ? 0
      : gap >= example.slowRadius
        ? example.maxSpeed
        : (example.maxSpeed * (gap - stop)) / (example.slowRadius - stop);

  return {
    state,
    seekRequest,
    arriveRequest,
    desiredVelocity: Math.sign(example.target - state.position.x) * desiredSpeed,
    acceleration,
    next: {
      position: add(state.position, scale(velocity, example.timeStep)),
      velocity,
    },
  };
}

export function behaviourSteps(
  example: BehaviourParameters,
  arrivalEnabled = example.arrivalEnabled,
): readonly BehaviourStep[] {
  let state: BehaviourState = {
    position: { x: example.initialPosition, y: 0 },
    velocity: { x: example.initialVelocity, y: 0 },
  };
  const run: BehaviourStep[] = [];

  for (let index = 0; index <= example.steps; index++) {
    const step = calculateBehaviourStep(state, example, arrivalEnabled);
    run.push(step);
    state = step.next;
  }

  return run;
}

export function behaviourExperiment(example: BehaviourParameters) {
  const run = behaviourSteps(example);
  const comparisonEnabled = example.arrivalEnabled === 1 ? 0 : 1;
  const comparison = behaviourSteps(example, comparisonEnabled);
  const seconds = run.map((_step, index) => index * example.timeStep);
  const braking = run.findIndex(
    ({ arriveRequest, seekRequest }) => arriveRequest.x < 0 && seekRequest.x > 0,
  );
  const cruise = run.findIndex(({ state }) => Math.abs(state.velocity.x) >= example.maxSpeed);
  const highest = (steps: readonly BehaviourStep[]) =>
    Math.max(...steps.map(({ state }) => state.position.x));
  const overshoot = Math.max(0, highest(run) - example.target);
  const comparisonOvershoot = Math.max(0, highest(comparison) - example.target);
  const inputValues = Object.fromEntries(
    Object.entries(example).map(([key, value]) => [key, String(value)]),
  );
  const lane = example.slowRadius / 2;
  return {
    run,
    comparisonEnabled,
    comparison,
    seconds,
    braking,
    cruise,
    overshoot,
    comparisonOvershoot,
    inputValues,
    lane,
  };
}

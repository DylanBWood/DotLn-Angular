import type { ToolId } from '@dotln-angular/models';

import type { ArriveCalculationView, ArriveState, ArriveStep } from './types';

/** The catalog row the authored Arrive study is attached to. */
export const arriveStudyId: ToolId = 'aifg-a:112';

export const arriveExample = {
  target: 100,
  slowRadius: 36,
  maxSpeed: 16,
  maxAcceleration: 12,
  responseTime: 0.4,
  tolerance: 0.3,
  timeStep: 0.1,
  steps: 240,
} as const;

const limit = (value: number, magnitude: number) =>
  Math.max(-magnitude, Math.min(magnitude, value));
export const desiredVelocity = (
  position: number,
  slowRadius: number = arriveExample.slowRadius,
) => {
  const offset = arriveExample.target - position;
  return Math.sign(offset) * arriveExample.maxSpeed * Math.min(1, Math.abs(offset) / slowRadius);
};

/** The displayed calculation and the motion use this same one-dimensional step. */
export function calculateArriveStep(
  state: ArriveState,
  slowRadius: number = arriveExample.slowRadius,
): ArriveStep {
  const offset = arriveExample.target - state.position;
  const settled =
    Math.abs(offset) <= arriveExample.tolerance &&
    Math.abs(state.velocity) <= arriveExample.tolerance;
  const desired = desiredVelocity(state.position, slowRadius);
  const requestedAcceleration = (desired - state.velocity) / arriveExample.responseTime;
  const acceleration = limit(requestedAcceleration, arriveExample.maxAcceleration);
  const velocity = limit(
    state.velocity + acceleration * arriveExample.timeStep,
    arriveExample.maxSpeed,
  );
  return {
    distance: Math.abs(offset),
    desired,
    requestedAcceleration,
    acceleration,
    settled,
    next: settled
      ? { position: arriveExample.target, velocity: 0 }
      : { position: state.position + velocity * arriveExample.timeStep, velocity },
  };
}

export function stepArrive(
  state: ArriveState,
  slowRadius: number = arriveExample.slowRadius,
): ArriveState {
  return calculateArriveStep(state, slowRadius).next;
}

export function arriveCalculationView(state: ArriveState, step: number): ArriveCalculationView {
  const calculation = calculateArriveStep(state);
  const values = {
    ...arriveExample,
    seconds: step * arriveExample.timeStep,
    nextSeconds: (step + 1) * arriveExample.timeStep,
    position: state.position,
    velocity: state.velocity,
    distance: calculation.distance,
    desired: calculation.desired,
    requestedAcceleration: calculation.requestedAcceleration,
    acceleration: calculation.acceleration,
    nextVelocity: calculation.next.velocity,
    nextPosition: calculation.next.position,
  };
  return {
    step,
    settled: calculation.settled,
    withinRadius: calculation.distance < arriveExample.slowRadius,
    motion:
      Math.abs(calculation.acceleration) < 0.005
        ? 'steady'
        : calculation.acceleration < 0
          ? 'braking'
          : 'accelerating',
    values: Object.fromEntries(
      Object.entries(values).map(([key, value]) => [key, value.toFixed(2)]),
    ),
  };
}

export function arriveFrames(
  slowRadius: number = arriveExample.slowRadius,
): readonly ArriveState[] {
  const frames: ArriveState[] = [{ position: 0, velocity: 0 }];
  for (let step = 0; step < arriveExample.steps; step++)
    frames.push(stepArrive(frames[frames.length - 1], slowRadius));
  return frames;
}

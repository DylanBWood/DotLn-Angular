import type { StudyParameters } from '@dotln-angular/models';
import { matchVelocity, type SteeringBody, zero } from '@dotln-angular/scene-engine';

import { numberParameter } from '../parameters';

export interface MotorControlParameters {
  readonly initialSpeed: number;
  readonly steeringLimit: number;
  readonly motorBrake: number;
  readonly weakBrake: number;
  readonly responseTime: number;
  readonly timeStep: number;
  readonly steps: number;
  readonly stopLine: number;
}

export interface MotorControlState {
  readonly position: number;
  readonly velocity: number;
}

export interface MotorControlStep {
  readonly rawRequest: number;
  readonly requested: number;
  readonly applied: number;
  readonly next: MotorControlState;
}

export const readParameters = (parameters: StudyParameters): MotorControlParameters => ({
  initialSpeed: numberParameter(parameters, 'initialSpeed'),
  steeringLimit: numberParameter(parameters, 'steeringLimit'),
  motorBrake: numberParameter(parameters, 'motorBrake'),
  weakBrake: numberParameter(parameters, 'weakBrake'),
  responseTime: numberParameter(parameters, 'responseTime'),
  timeStep: numberParameter(parameters, 'timeStep'),
  steps: numberParameter(parameters, 'steps'),
  stopLine: numberParameter(parameters, 'stopLine'),
});

/** The engine requests a stop; the rail cart's local brake policy limits what reaches its body. */
export function motorControlStep(
  state: MotorControlState,
  example: MotorControlParameters,
  brake = example.motorBrake,
): MotorControlStep {
  const body: SteeringBody = {
    position: { x: state.position, y: 0 },
    velocity: { x: state.velocity, y: 0 },
    heading: { x: 1, y: 0 },
    maxSpeed: example.initialSpeed,
    maxAcceleration: example.steeringLimit,
    radius: 0,
    wanderAngle: 0,
  };
  const requested = matchVelocity(body, zero, example.responseTime).x;
  const applied = Math.max(-brake, Math.min(0, requested));
  // A brake can stop this cart, but cannot propel it backwards.
  const velocity = Math.max(0, state.velocity + applied * example.timeStep);
  return {
    rawRequest: -state.velocity / example.responseTime,
    requested,
    applied,
    next: { position: state.position + velocity * example.timeStep, velocity },
  };
}

export interface MotorControlSample {
  readonly state: MotorControlState;
  readonly calculation: ReturnType<typeof motorControlStep>;
  readonly next: MotorControlState;
}

export function motorControlSamples(
  example: MotorControlParameters,
  brake = example.motorBrake,
): readonly MotorControlSample[] {
  const samples: MotorControlSample[] = [];
  let state: MotorControlState = { position: 0, velocity: example.initialSpeed };
  for (let step = 0; step <= example.steps; step++) {
    const calculation = motorControlStep(state, example, brake);
    samples.push({ state, calculation, next: calculation.next });
    state = calculation.next;
  }
  return samples;
}

export function motorControlFrames(
  example: MotorControlParameters,
  brake = example.motorBrake,
): readonly MotorControlState[] {
  return motorControlSamples(example, brake).map(({ state }) => state);
}

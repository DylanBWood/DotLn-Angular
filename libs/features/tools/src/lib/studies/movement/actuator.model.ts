import type { StudyParameters } from '@dotln-angular/models';
import { clipLength, matchVelocity, type SteeringBody } from '@dotln-angular/scene-engine';

import { numberParameter } from '../parameters';
import type { MotionFrame, MotionStudyModel } from '../study-model';

export interface ActuatorParameters {
  readonly beltSpeed: number;
  readonly impossibleSpeed: number;
  readonly initialSpeed: number;
  readonly maxSpeed: number;
  readonly maxAcceleration: number;
  readonly responseTime: number;
  readonly timeStep: number;
  readonly steps: number;
}

export interface ActuatorState {
  readonly position: number;
  readonly velocity: number;
}

export interface ActuatorStep {
  readonly agreed: number;
  readonly feasible: number;
  readonly rawAcceleration: number;
  readonly acceleration: number;
  readonly next: ActuatorState;
}

const readParameters = (parameters: StudyParameters): ActuatorParameters => ({
  beltSpeed: numberParameter(parameters, 'beltSpeed'),
  impossibleSpeed: numberParameter(parameters, 'impossibleSpeed'),
  initialSpeed: numberParameter(parameters, 'initialSpeed'),
  maxSpeed: numberParameter(parameters, 'maxSpeed'),
  maxAcceleration: numberParameter(parameters, 'maxAcceleration'),
  responseTime: numberParameter(parameters, 'responseTime'),
  timeStep: numberParameter(parameters, 'timeStep'),
  steps: numberParameter(parameters, 'steps'),
});

const fixed = (value: number) => value.toFixed(2);

/** One velocity-channel actuator, followed by the study's fixed-step motion harness. */
export function actuatorStep(
  state: ActuatorState,
  example: ActuatorParameters,
  agreed = example.beltSpeed,
): ActuatorStep {
  const feasible = clipLength({ x: agreed, y: 0 }, example.maxSpeed);
  const body: SteeringBody = {
    position: { x: state.position, y: 0 },
    velocity: { x: state.velocity, y: 0 },
    heading: { x: 1, y: 0 },
    maxSpeed: example.maxSpeed,
    maxAcceleration: example.maxAcceleration,
    radius: 0,
    wanderAngle: 0,
  };
  const acceleration = matchVelocity(body, feasible, example.responseTime);
  const velocity = clipLength(
    { x: state.velocity + acceleration.x * example.timeStep, y: 0 },
    example.maxSpeed,
  ).x;
  return {
    agreed,
    feasible: feasible.x,
    rawAcceleration: (feasible.x - state.velocity) / example.responseTime,
    acceleration: acceleration.x,
    next: { position: state.position + velocity * example.timeStep, velocity },
  };
}

export function actuatorFrames(
  example: ActuatorParameters,
  agreed = example.beltSpeed,
): readonly ActuatorState[] {
  const states: ActuatorState[] = [{ position: 0, velocity: example.initialSpeed }];
  for (let step = 0; step < example.steps; step++)
    states.push(actuatorStep(states[states.length - 1], example, agreed).next);
  return states;
}

function frameOf(
  state: ActuatorState,
  step: number,
  example: ActuatorParameters,
  left: number,
  right: number,
): MotionFrame {
  const calculation = actuatorStep(state, example);
  const seconds = step * example.timeStep;
  const markerPosition = example.beltSpeed * seconds;
  const speedGap = example.beltSpeed - state.velocity;
  return {
    seconds,
    bodies: [
      { id: 'courier', x: state.position, y: 0, heading: 0, label: 'Courier' },
      {
        id: 'belt-marker',
        x: markerPosition,
        y: -6,
        heading: 0,
        label: 'Belt marker',
        tone: 'target',
      },
    ],
    vectors: [
      { x: state.position, y: 4, dx: state.velocity, dy: 0, tone: 'actual' },
      { x: state.position, y: 7, dx: calculation.feasible, dy: 0, tone: 'desired' },
    ],
    links: [
      { from: { x: left, y: 0 }, to: { x: right, y: 0 } },
      { from: { x: left, y: -6 }, to: { x: right, y: -6 } },
      { from: { x: state.position, y: 0 }, to: { x: markerPosition, y: -6 } },
    ],
    values: {
      elapsed: fixed(seconds),
      duration: fixed(example.steps * example.timeStep),
      position: fixed(state.position),
      markerPosition: fixed(markerPosition),
      positionGap: fixed(markerPosition - state.position),
      speed: fixed(state.velocity),
      agreed: fixed(calculation.agreed),
      feasible: fixed(calculation.feasible),
      acceleration: fixed(calculation.acceleration),
      speedGap: fixed(speedGap),
      beltSpeed: String(example.beltSpeed),
      impossibleSpeed: String(example.impossibleSpeed),
      initialSpeed: String(example.initialSpeed),
      maxSpeed: String(example.maxSpeed),
      maxAcceleration: String(example.maxAcceleration),
      responseTime: String(example.responseTime),
      timeStep: String(example.timeStep),
    },
    note:
      example.beltSpeed > example.maxSpeed
        ? 'The agreed belt velocity exceeds the courier capability. A bounded output protects the motion limits but cannot fulfil the original velocity goal.'
        : Math.abs(speedGap) <= 0.01
          ? 'The speed gap is below the displayed precision. Matching velocity leaves the belt marker ahead; this channel does not close a position gap.'
          : 'The actuator reads an agreed velocity and emits bounded acceleration. The courier builds speed while the marker already rides the belt.',
    worked: {
      title: `Actuator step: ${fixed(seconds)} → ${fixed(seconds + example.timeStep)} s`,
      lines: [
        `Read the agreed velocity channel: ${fixed(calculation.agreed)} units/s.`,
        `Clip its magnitude to the ${fixed(example.maxSpeed)} units/s capability: feasible velocity = ${fixed(calculation.feasible)} units/s.`,
        `Request (${fixed(calculation.feasible)} − ${fixed(state.velocity)}) / ${fixed(example.responseTime)} = ${fixed(calculation.rawAcceleration)} units/s².`,
        `The engine's matchVelocity limits acceleration to ±${fixed(example.maxAcceleration)}: output = ${fixed(calculation.acceleration)} units/s².`,
        `The local harness updates velocity, capped at ±${fixed(example.maxSpeed)}: ${fixed(state.velocity)} + ${fixed(calculation.acceleration)} × ${fixed(example.timeStep)} → ${fixed(calculation.next.velocity)} units/s.`,
        `Use the new velocity for position: ${fixed(state.position)} + ${fixed(calculation.next.velocity)} × ${fixed(example.timeStep)} = ${fixed(calculation.next.position)} units.`,
      ],
      note: 'The actuator produces acceleration; the harness applies it. Neither step chooses a new target or negotiates a different belt velocity.',
    },
  };
}

export const model = (parameters: StudyParameters): MotionStudyModel => {
  const example = readParameters(parameters);
  const states = actuatorFrames(example);
  const alternative = actuatorFrames(example, example.impossibleSpeed);
  const seconds = states.map((_state, step) => step * example.timeStep);
  const calculations = states.map((state) => actuatorStep(state, example));
  const left = -2;
  const right =
    Math.max(
      0,
      example.beltSpeed * example.steps * example.timeStep,
      ...states.map(({ position }) => position + example.maxSpeed),
    ) + 2;
  const uncapped = calculations.findIndex(
    ({ rawAcceleration }) => Math.abs(rawAcceleration) < example.maxAcceleration,
  );
  const transition = uncapped < 0 ? example.steps : uncapped;
  const last = states[states.length - 1];
  const otherLast = alternative[alternative.length - 1];
  const alternativeGap = example.impossibleSpeed - otherLast.velocity;
  const alternativeFeasible = Math.abs(example.impossibleSpeed) <= example.maxSpeed;
  return {
    family: 'motion',
    motion: {
      bounds: { minX: left - 8, maxX: right + 8, minY: -11, maxY: 11 },
      frames: states.map((state, step) => frameOf(state, step, example, left, right)),
      trail: true,
    },
    timeline: {
      title: 'Agreed, feasible and actual velocity',
      xLabel: 'Time · seconds',
      yLabel: 'Velocity · units/s',
      seconds,
      yRange: [0, Math.max(example.beltSpeed, example.maxSpeed, example.initialSpeed) + 1],
      series: [
        {
          id: 'agreed',
          label: 'Agreed belt velocity',
          tone: 'target',
          values: states.map(() => example.beltSpeed),
        },
        {
          id: 'feasible',
          label: 'Feasible velocity',
          tone: 'desired',
          values: calculations.map(({ feasible }) => feasible),
        },
        {
          id: 'actual',
          label: 'Courier velocity',
          tone: 'actual',
          values: states.map(({ velocity }) => velocity),
        },
      ],
    },
    initialStep: 0,
    moments: [
      { label: 'Read the goal', step: 0 },
      { label: 'First bounded output', step: 1 },
      { label: 'Velocity gap controls output', step: transition },
      { label: 'End of run', step: example.steps },
    ],
    legend: [
      { tone: 'subject', label: 'Courier platform' },
      { tone: 'target', label: 'Belt marker and agreed velocity' },
      { tone: 'desired', label: 'Velocity within capability' },
      { tone: 'actual', label: 'Courier velocity' },
    ],
    caption:
      'The upper marker rides the inspection belt; the courier moves on the parallel track below. The connecting line exposes their position gap. Green and amber arrows show actual and feasible velocity at one drawing unit per unit/s. Agreed and feasible velocity overlap when the goal fits. The actuator output is acceleration, worked out beside the drawing.',
    comparison: {
      title: 'When the agreed goal exceeds capability',
      intro: `Change only the belt velocity from ${fixed(example.beltSpeed)} to ${fixed(example.impossibleSpeed)} units/s. The speed capability remains ${fixed(example.maxSpeed)} units/s and acceleration remains limited to ${fixed(example.maxAcceleration)} units/s².`,
      timeline: {
        title: 'An output limit cannot make an infeasible goal achievable',
        xLabel: 'Time · seconds',
        yLabel: 'Velocity · units/s',
        seconds,
        yRange: [
          0,
          Math.max(
            example.beltSpeed,
            example.impossibleSpeed,
            example.maxSpeed,
            example.initialSpeed,
          ) + 1,
        ],
        reference: example.maxSpeed,
        series: [
          {
            id: 'normal',
            label: 'Courier with original goal',
            tone: 'actual',
            values: states.map(({ velocity }) => velocity),
          },
          {
            id: 'alternative',
            label: 'Courier with changed goal',
            tone: 'other',
            values: alternative.map(({ velocity }) => velocity),
          },
          {
            id: 'normal-goal',
            label: 'Original agreed velocity',
            tone: 'desired',
            values: states.map(() => example.beltSpeed),
          },
          {
            id: 'alternative-goal',
            label: 'Changed agreed velocity',
            tone: 'target',
            values: states.map(() => example.impossibleSpeed),
          },
        ],
      },
      findings: [
        `At ${fixed(example.steps * example.timeStep)} s the original run reaches ${fixed(last.velocity)} units/s, with an agreed-velocity gap of ${fixed(example.beltSpeed - last.velocity)} units/s.`,
        `The changed run reaches ${fixed(otherLast.velocity)} units/s, leaving a gap of ${fixed(alternativeGap)} units/s to its ${fixed(example.impossibleSpeed)} units/s goal.`,
        alternativeFeasible
          ? 'The changed goal now fits the speed capability. Any remaining speed gap at the end is transient, rather than a permanently unreachable velocity.'
          : 'The actuator keeps the output feasible by capping the velocity it chases. The original agreement still cannot be met; feasibility needs to reach the earlier pipeline stages.',
      ],
      note:
        example.beltSpeed === example.impossibleSpeed
          ? 'The goals are equal, so these are the same run.'
          : 'The horizontal reference is the speed capability. Matching a feasible velocity still does not make the courier catch the belt marker.',
    },
    inputs: [
      {
        name: 'beltSpeed',
        label: 'Agreed belt velocity',
        unit: 'units/s',
        min: 2,
        max: 12,
        step: 1,
      },
      {
        name: 'maxSpeed',
        label: 'Courier speed capability',
        unit: 'units/s',
        min: 4,
        max: 14,
        step: 1,
      },
    ],
  };
};

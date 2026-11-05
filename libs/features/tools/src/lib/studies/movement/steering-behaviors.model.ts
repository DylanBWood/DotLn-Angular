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
import type { MotionFrame, MotionStudyModel } from '../study-model';

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

const readParameters = (parameters: StudyParameters): BehaviourParameters => ({
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

const fixed = (value: number) => value.toFixed(2);
const member = (arrivalEnabled: number) => (arrivalEnabled === 1 ? 'Arrive' : 'Seek');

export const model = (parameters: StudyParameters): MotionStudyModel => {
  const example = readParameters(parameters);
  const run = behaviourSteps(example);
  const comparisonEnabled = example.arrivalEnabled === 1 ? 0 : 1;
  const comparison = behaviourSteps(example, comparisonEnabled);
  const seconds = run.map((_step, index) => index * example.timeStep);
  const chosen = member(example.arrivalEnabled);
  const alternative = member(comparisonEnabled);
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
  const frames: readonly MotionFrame[] = run.map((step, index) => {
    const { state } = step;
    const gap = Math.abs(example.target - state.position.x);
    const stop = example.targetRadius / 2;
    const note =
      state.position.x > example.target
        ? 'Mara is past the depot. The request changes her current velocity; it does not place her on the marker.'
        : step.acceleration.x * state.velocity.x < 0
          ? `${chosen} requests braking: Mara is still travelling ${state.velocity.x < 0 ? 'left' : 'right'} while her speed decreases.`
          : step.acceleration.x === 0 && state.velocity.x !== 0
            ? 'Zero selected acceleration preserves the current velocity; it does not mean Mara has stopped.'
            : `${chosen} supplies this update; the other request is drawn for inspection and is not added.`;

    return {
      seconds: seconds[index],
      bodies: [
        {
          id: 'mara',
          ...state.position,
          heading: state.velocity.x < 0 ? Math.PI : 0,
          label: 'Mara',
        },
      ],
      vectors: [
        { x: state.position.x, y: -lane, dx: step.seekRequest.x, dy: 0, tone: 'other' },
        { x: state.position.x, y: lane, dx: step.arriveRequest.x, dy: 0, tone: 'desired' },
        { ...state.position, dx: step.acceleration.x, dy: 0, tone: 'actual' },
      ],
      marks: [{ x: example.target, y: 0, shape: 'cross', label: 'Depot' }],
      zones: [{ x: example.target, y: 0, radius: example.slowRadius }],
      values: {
        ...inputValues,
        seconds: fixed(seconds[index]),
        duration: fixed(example.steps * example.timeStep),
        position: fixed(state.position.x),
        velocity: fixed(state.velocity.x),
        gap: fixed(gap),
        desiredVelocity: fixed(step.desiredVelocity),
        seekAcceleration: fixed(step.seekRequest.x),
        arriveAcceleration: fixed(step.arriveRequest.x),
        acceleration: fixed(step.acceleration.x),
        member: chosen,
        comparisonMember: alternative,
        overshoot: fixed(overshoot),
        comparisonOvershoot: fixed(comparisonOvershoot),
      },
      note,
      worked: {
        title: `Mara at ${fixed(seconds[index])} s`,
        lines: [
          `Read x = ${fixed(state.position.x)}, velocity = ${fixed(state.velocity.x)} units/s and depot x = ${fixed(example.target)}; gap = ${fixed(gap)} units.`,
          `Seek = sign(${fixed(example.target)} − ${fixed(state.position.x)}) × ${fixed(example.maxAcceleration)} = ${fixed(step.seekRequest.x)} units/s².`,
          gap <= stop
            ? `Inside half the target radius (${fixed(stop)} units), Arrive asks for zero velocity.`
            : gap >= example.slowRadius
              ? `Outside the slowing radius, Arrive asks for signed maximum velocity ${fixed(step.desiredVelocity)} units/s.`
              : `Arrive desired velocity = sign(${fixed(example.target)} − ${fixed(state.position.x)}) × ${fixed(example.maxSpeed)} × (${fixed(gap)} − ${fixed(stop)}) / (${fixed(example.slowRadius)} − ${fixed(stop)}) ≈ ${fixed(step.desiredVelocity)} units/s.`,
          `Arrive = clamp((${fixed(step.desiredVelocity)} − ${fixed(state.velocity.x)}) / ${fixed(example.responseTime)}, ±${fixed(example.maxAcceleration)}) ≈ ${fixed(step.arriveRequest.x)} units/s².`,
          `Select ${chosen}: acceleration = ${fixed(step.acceleration.x)} units/s²; do not sum the two candidates.`,
          `New velocity = clamp(${fixed(state.velocity.x)} + ${fixed(step.acceleration.x)} × ${fixed(example.timeStep)}, ±${fixed(example.maxSpeed)}) ≈ ${fixed(step.next.velocity.x)} units/s.`,
          `New x = ${fixed(state.position.x)} + ${fixed(step.next.velocity.x)} × ${fixed(example.timeStep)} ≈ ${fixed(step.next.position.x)} units.`,
        ],
        note: 'Engine Seek and Arrive compute the requests. This study applies them with its own fixed-step loop, without field edges, drag or a rest snap. Displayed values are rounded.',
      },
    };
  });
  const points = frames.flatMap((frame) => [
    ...frame.bodies,
    ...(frame.vectors ?? []).flatMap(({ x, y, dx, dy }) => [
      { x, y },
      { x: x + dx, y: y + dy },
    ]),
    ...(frame.zones ?? []).flatMap(({ x, y, radius }) => [
      { x: x - radius, y: y - radius },
      { x: x + radius, y: y + radius },
    ]),
  ]);
  const padding = Math.max(
    example.radius * 2,
    (Math.max(...points.map(({ x }) => x)) - Math.min(...points.map(({ x }) => x))) / 10,
  );

  return {
    family: 'motion',
    motion: {
      frames,
      trail: true,
      bounds: {
        minX: Math.min(...points.map(({ x }) => x)) - padding,
        maxX: Math.max(...points.map(({ x }) => x)) + padding,
        minY: Math.min(...points.map(({ y }) => y)) - padding,
        maxY: Math.max(...points.map(({ y }) => y)) + padding,
      },
    },
    timeline: {
      title: 'Signed acceleration requests',
      xLabel: 'Time · seconds',
      yLabel: 'Acceleration · units/s²',
      seconds,
      reference: 0,
      series: [
        {
          id: 'seek',
          label: 'Seek request',
          tone: 'other',
          values: run.map(({ seekRequest }) => seekRequest.x),
        },
        {
          id: 'arrive',
          label: 'Arrive request',
          tone: 'desired',
          values: run.map(({ arriveRequest }) => arriveRequest.x),
        },
        {
          id: 'selected',
          label: `${chosen} selected`,
          tone: 'actual',
          values: run.map(({ acceleration }) => acceleration.x),
        },
      ],
    },
    initialStep: braking < 0 ? 0 : braking,
    moments: [
      { label: 'First request', step: 0 },
      { label: 'On approach', step: cruise < 0 ? Math.floor(example.steps / 4) : cruise },
      { label: 'Braking request', step: braking < 0 ? Math.floor(example.steps / 2) : braking },
      { label: 'End of run', step: example.steps },
    ],
    legend: [
      { tone: 'other', label: 'Upper arrow · Seek request' },
      { tone: 'desired', label: 'Lower arrow · Arrive request' },
      { tone: 'actual', label: 'Arrow through Mara · selected acceleration' },
      { tone: 'zone', label: 'Circle · Arrive slowing radius' },
    ],
    caption:
      'All arrows show acceleration at the same scale, with right positive. Both family members read Mara at the displayed moment; only the selected one moves her. The cross is the depot. The trail records Mara’s previous positions.',
    comparison: {
      title: 'Use the same movement loop with the other family member',
      intro: `Change only arrivalEnabled: ${example.arrivalEnabled} (${chosen}) becomes ${comparisonEnabled} (${alternative}). The starting state, depot, limits and update interval stay the example’s.`,
      timeline: {
        title: 'Position relative to the depot',
        xLabel: 'Time · seconds',
        yLabel: 'Position · units',
        seconds,
        reference: example.target,
        series: [
          {
            id: 'selected',
            label: chosen,
            tone: 'actual',
            values: run.map(({ state }) => state.position.x),
          },
          {
            id: 'other-member',
            label: alternative,
            tone: 'desired',
            values: comparison.map(({ state }) => state.position.x),
          },
        ],
      },
      findings: [
        `${chosen} has a recorded overshoot of ${fixed(overshoot)} units in this sampled run; ${alternative} has ${fixed(comparisonOvershoot)} units.`,
        'Seek keeps asking for acceleration towards the depot, so crossing it changes the request’s sign while momentum carries Mara on. Arrive can ask for braking before crossing. A shared output type does not make the two goals interchangeable.',
      ],
      note: 'Both lines come from independent runs. The candidate arrows above instead compare requests at the selected run’s single current state.',
    },
    inputs: [
      {
        name: 'arrivalEnabled',
        label: 'Use Arrive (1) or Seek (0)',
        unit: 'choice',
        min: 0,
        max: 1,
        step: 1,
      },
    ],
  };
};

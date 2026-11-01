import type { StudyParameters } from '@dotln-angular/models';
import { matchVelocity, type SteeringBody } from '@dotln-angular/scene-engine';

import { numberParameter } from '../parameters';
import type { StudyFrame, StudyModel, StudyWorkedStep } from '../study-model';

export interface VelocityMatchingParameters {
  readonly courierStart: number;
  readonly courierVelocity: number;
  readonly cartStart: number;
  readonly cartVelocity: number;
  readonly maxSpeed: number;
  readonly maxAcceleration: number;
  readonly responseTime: number;
  readonly shortResponseTime: number;
  readonly timeStep: number;
  readonly steps: number;
  readonly radius: number;
  readonly arrowSeconds: number;
}

export interface VelocityMatchingState {
  readonly courierPosition: number;
  readonly courierVelocity: number;
  readonly cartPosition: number;
}

export interface VelocityMatchingStep {
  readonly velocityGap: number;
  readonly requestedAcceleration: number;
  readonly acceleration: number;
  readonly next: VelocityMatchingState;
}

const readParameters = (parameters: StudyParameters): VelocityMatchingParameters => {
  const example: VelocityMatchingParameters = {
    courierStart: numberParameter(parameters, 'courierStart'),
    courierVelocity: numberParameter(parameters, 'courierVelocity'),
    cartStart: numberParameter(parameters, 'cartStart'),
    cartVelocity: numberParameter(parameters, 'cartVelocity'),
    maxSpeed: numberParameter(parameters, 'maxSpeed'),
    maxAcceleration: numberParameter(parameters, 'maxAcceleration'),
    responseTime: numberParameter(parameters, 'responseTime'),
    shortResponseTime: numberParameter(parameters, 'shortResponseTime'),
    timeStep: numberParameter(parameters, 'timeStep'),
    steps: numberParameter(parameters, 'steps'),
    radius: numberParameter(parameters, 'radius'),
    arrowSeconds: numberParameter(parameters, 'arrowSeconds'),
  };
  if (
    !Object.values(example).every(Number.isFinite) ||
    example.responseTime <= 0 ||
    example.shortResponseTime <= 0 ||
    example.timeStep <= 0 ||
    example.maxSpeed <= 0 ||
    example.maxAcceleration <= 0 ||
    example.radius <= 0 ||
    example.arrowSeconds <= 0 ||
    Math.abs(example.courierVelocity) > example.maxSpeed ||
    !Number.isInteger(example.steps) ||
    example.steps < 2 ||
    example.steps > 239
  )
    throw new Error('Velocity matching needs finite values, positive limits and 2–239 steps.');
  return example;
};

/** The engine chooses acceleration; the study advances the courier and cart on one axis. */
export function calculateVelocityMatchingStep(
  state: VelocityMatchingState,
  example: VelocityMatchingParameters,
  responseTime = example.responseTime,
): VelocityMatchingStep {
  const body: SteeringBody = {
    position: { x: state.courierPosition, y: 0 },
    velocity: { x: state.courierVelocity, y: 0 },
    heading: { x: 1, y: 0 },
    maxSpeed: example.maxSpeed,
    maxAcceleration: example.maxAcceleration,
    radius: example.radius,
    wanderAngle: 0,
  };
  const velocityGap = example.cartVelocity - state.courierVelocity;
  const acceleration = matchVelocity(body, { x: example.cartVelocity, y: 0 }, responseTime).x;
  const velocity = Math.max(
    -example.maxSpeed,
    Math.min(example.maxSpeed, state.courierVelocity + acceleration * example.timeStep),
  );
  return {
    velocityGap,
    requestedAcceleration: velocityGap / responseTime,
    acceleration,
    next: {
      courierPosition: state.courierPosition + velocity * example.timeStep,
      courierVelocity: velocity,
      cartPosition: state.cartPosition + example.cartVelocity * example.timeStep,
    },
  };
}

export function velocityMatchingFrames(
  example: VelocityMatchingParameters,
  responseTime = example.responseTime,
): readonly VelocityMatchingState[] {
  const states: VelocityMatchingState[] = [
    {
      courierPosition: example.courierStart,
      courierVelocity: example.courierVelocity,
      cartPosition: example.cartStart,
    },
  ];
  for (let step = 0; step < example.steps; step++)
    states.push(calculateVelocityMatchingStep(states[step], example, responseTime).next);
  return states;
}

const fixed = (value: number) => (Math.abs(value) < 0.005 ? 0 : value).toFixed(2);

function workedStep(
  state: VelocityMatchingState,
  step: number,
  example: VelocityMatchingParameters,
): StudyWorkedStep {
  const calculation = calculateVelocityMatchingStep(state, example);
  return {
    title: `Mira's next update at ${fixed(step * example.timeStep)} s`,
    lines: [
      `Read the cart's velocity, not its position: ${fixed(example.cartVelocity)} − ${fixed(state.courierVelocity)} = ${fixed(calculation.velocityGap)} units/s.`,
      `Request acceleration: ${fixed(calculation.velocityGap)} / ${fixed(example.responseTime)} = ${fixed(calculation.requestedAcceleration)} units/s².`,
      `The engine limits its magnitude to ${fixed(example.maxAcceleration)}; use ${fixed(calculation.acceleration)} units/s².`,
      `Update velocity, limited to ±${fixed(example.maxSpeed)}: ${fixed(state.courierVelocity)} + ${fixed(calculation.acceleration)} × ${fixed(example.timeStep)} ≈ ${fixed(calculation.next.courierVelocity)} units/s.`,
      `Move Mira with the updated velocity: ${fixed(state.courierPosition)} + ${fixed(calculation.next.courierVelocity)} × ${fixed(example.timeStep)} ≈ ${fixed(calculation.next.courierPosition)} units.`,
      `Move the cart at its prescribed velocity: ${fixed(state.cartPosition)} + ${fixed(example.cartVelocity)} × ${fixed(example.timeStep)} ≈ ${fixed(calculation.next.cartPosition)} units.`,
      `The next position gap is ${fixed(calculation.next.cartPosition - calculation.next.courierPosition)} units; it is never an input to the acceleration.`,
    ],
    note:
      Math.abs(calculation.requestedAcceleration) > example.maxAcceleration
        ? 'The acceleration cap is active, so the response time cannot be a promise of when velocities will agree.'
        : 'Below the acceleration cap and speed limit, the next velocity error is the current error multiplied by one minus timeStep / responseTime.',
  };
}

function frameNote(
  state: VelocityMatchingState,
  step: number,
  calculation: VelocityMatchingStep,
  example: VelocityMatchingParameters,
): string {
  if (step === 0)
    return 'The cart is already moving, so Mira must build speed before she can share its pace.';
  if (state.courierVelocity >= example.maxSpeed && example.cartVelocity > example.maxSpeed)
    return 'Mira has reached her speed limit, so the faster cart keeps pulling away.';
  if (Math.abs(calculation.velocityGap) < 0.005)
    return 'Mira nearly matches the cart’s pace, but the distance lost while accelerating remains.';
  if (calculation.velocityGap < 0)
    return 'Mira is moving faster than the cart, so the next correction brakes her.';
  if (calculation.next.courierVelocity > example.cartVelocity)
    return 'Mira is still slower, but this correction sends her past the cart’s pace.';
  return Math.abs(calculation.requestedAcceleration) > example.maxAcceleration
    ? 'Mira accelerates at her limit, so the cart keeps opening the gap.'
    : 'Mira eases her acceleration as the velocities draw closer, while the cart remains ahead.';
}

function frameOf(
  state: VelocityMatchingState,
  step: number,
  example: VelocityMatchingParameters,
): StudyFrame {
  const calculation = calculateVelocityMatchingStep(state, example);
  const lane = example.radius * 5;
  return {
    seconds: step * example.timeStep,
    bodies: [
      { id: 'mira', label: 'Mira', x: state.courierPosition, y: 0, tone: 'subject' },
      { id: 'cart', label: 'Cart', x: state.cartPosition, y: 0, tone: 'target' },
    ],
    vectors: [
      {
        x: state.courierPosition,
        y: -lane,
        dx: state.courierVelocity * example.arrowSeconds,
        dy: 0,
        tone: 'actual',
      },
      {
        x: state.courierPosition,
        y: lane,
        dx: example.cartVelocity * example.arrowSeconds,
        dy: 0,
        tone: 'desired',
      },
    ],
    links: [
      {
        from: { x: state.courierPosition, y: 0 },
        to: { x: state.cartPosition, y: 0 },
      },
    ],
    values: {
      seconds: fixed(step * example.timeStep),
      courierPosition: fixed(state.courierPosition),
      cartPosition: fixed(state.cartPosition),
      courierVelocity: fixed(state.courierVelocity),
      cartVelocity: fixed(example.cartVelocity),
      positionGap: fixed(state.cartPosition - state.courierPosition),
      velocityGap: fixed(calculation.velocityGap),
      responseTime: fixed(example.responseTime),
      requestedAcceleration: fixed(calculation.requestedAcceleration),
      acceleration: fixed(calculation.acceleration),
      maxAcceleration: fixed(example.maxAcceleration),
      timeStep: fixed(example.timeStep),
      nextVelocity: fixed(calculation.next.courierVelocity),
      nextPosition: fixed(calculation.next.courierPosition),
      errorMultiplier: fixed(1 - example.timeStep / example.responseTime),
      arrowSeconds: fixed(example.arrowSeconds),
      shortResponseTime: fixed(example.shortResponseTime),
    },
    note: frameNote(state, step, calculation, example),
    worked: workedStep(state, step, example),
  };
}

function shortResponseComparison(
  states: readonly VelocityMatchingState[],
  example: VelocityMatchingParameters,
): NonNullable<StudyModel['comparison']> {
  const short = velocityMatchingFrames(example, example.shortResponseTime);
  const last = states[states.length - 1];
  const tail = short.slice(-2).map(({ courierVelocity }) => courierVelocity);
  const allVelocities = [...states, ...short].map(({ courierVelocity }) => courierVelocity);
  return {
    title: 'A quick correction can overshoot the desired pace',
    intro:
      example.responseTime === example.shortResponseTime
        ? `Both traces now use response time ${fixed(example.responseTime)} s; increase the response-time control to compare them at the same ${fixed(example.timeStep)} s update interval.`
        : `Compare the chosen response time of ${fixed(example.responseTime)} s with a reference of ${fixed(example.shortResponseTime)} s; only responseTime changes. Mira and the cart keep the same starting states, speed limit, acceleration limit and ${fixed(example.timeStep)} s update interval.`,
    timeline: {
      title: "Mira's velocity with two response times",
      xLabel: 'Time · seconds',
      yLabel: 'Velocity · units/s',
      seconds: states.map((_state, step) => step * example.timeStep),
      yRange: [Math.min(0, ...allVelocities), Math.max(example.cartVelocity, ...allVelocities)],
      reference: example.cartVelocity,
      series: [
        {
          id: 'normal',
          label: `Solid green · chosen response ${fixed(example.responseTime)} s`,
          tone: 'actual',
          values: states.map(({ courierVelocity }) => courierVelocity),
        },
        {
          id: 'short',
          label: `Dashed amber · reference response ${fixed(example.shortResponseTime)} s`,
          tone: 'desired',
          values: short.map(({ courierVelocity }) => courierVelocity),
        },
      ],
    },
    findings: [
      `The reference run ends at successive velocities ${fixed(tail[0])} and ${fixed(tail[1])} units/s, against the cart's ${fixed(example.cartVelocity)} units/s. The chosen run ends at ${fixed(last.courierVelocity)} units/s.`,
      `Without either cap, each update multiplies velocity error by 1 − timeStep / responseTime: ${fixed(1 - example.timeStep / example.responseTime)} for the chosen response, ${fixed(1 - example.timeStep / example.shortResponseTime)} for the reference. A negative factor reverses the error; a magnitude above one amplifies it until a cap intervenes.`,
      `The chosen run leaves Mira ${fixed(last.cartPosition - last.courierPosition)} units behind the cart. Velocity control does not correct the distance already lost while accelerating.`,
    ],
    note: 'The horizontal reference is the cart’s velocity; lines join fixed updates and the explanation rounds values to two decimal places.',
  };
}

export const model = (parameters: StudyParameters): StudyModel => {
  const example = readParameters(parameters);
  const states = velocityMatchingFrames(example);
  const frames = states.map((state, step) => frameOf(state, step, example));
  const ends = frames.flatMap((frame) => [
    ...frame.bodies.map(({ x }) => x),
    ...(frame.vectors ?? []).flatMap(({ x, dx }) => [x, x + dx]),
  ]);
  const padding = example.radius * 4;
  const minX = Math.min(...ends) - padding;
  const maxX = Math.max(...ends) + padding;
  const height = Math.max((maxX - minX) / 2, padding * 4);
  const capped = states.findIndex(
    (state) =>
      Math.abs(calculateVelocityMatchingStep(state, example).requestedAcceleration) >
      example.maxAcceleration,
  );
  const release = states.findIndex(
    (state, step) =>
      step > capped &&
      Math.abs(calculateVelocityMatchingStep(state, example).requestedAcceleration) <=
        example.maxAcceleration,
  );
  const overshoot = states.findIndex(
    ({ courierVelocity }) => courierVelocity > example.cartVelocity,
  );
  const initialStep =
    release > 0
      ? release
      : overshoot >= 0
        ? overshoot
        : Math.min(Math.ceil(example.responseTime / example.timeStep), example.steps);
  const last = states[states.length - 1];

  return {
    motion: {
      bounds: { minX, maxX, minY: -height / 2, maxY: height / 2 },
      frames,
      trail: true,
    },
    timeline: {
      title: 'Mira’s pace against the cart',
      xLabel: 'Time · seconds',
      yLabel: 'Velocity · units/s',
      seconds: frames.map(({ seconds }) => seconds),
      reference: example.cartVelocity,
      series: [
        {
          id: 'courier',
          label: "Solid green · Mira's velocity",
          tone: 'actual',
          values: states.map(({ courierVelocity }) => courierVelocity),
        },
        {
          id: 'cart',
          label: "Dashed amber · cart's velocity to match",
          tone: 'desired',
          values: states.map(() => example.cartVelocity),
        },
      ],
    },
    initialStep,
    moments: [
      { label: 'Cart already moving', step: 0 },
      capped >= 0
        ? {
            label: 'Acceleration limited',
            step: Math.min(capped + 1, release > 0 ? release - 1 : example.steps),
          }
        : { label: 'Closing the velocity gap', step: Math.min(1, example.steps) },
      {
        label: overshoot >= 0 ? 'Pace overshoots' : 'Correction eases',
        step: overshoot >= 0 ? overshoot : initialStep,
      },
      {
        label:
          Math.abs(last.courierVelocity - example.cartVelocity) < 0.005
            ? 'Same pace, still behind'
            : 'Pace still correcting',
        step: example.steps,
      },
    ],
    legend: [
      { tone: 'actual', label: "Solid green · Mira's velocity" },
      { tone: 'desired', label: "Dashed amber · cart's velocity, translated to Mira" },
      { tone: 'muted', label: 'Position gap, unused by this behaviour' },
    ],
    caption: `Mira and Cart move along the same line. The upper arrow shows Mira’s velocity and the lower arrow the cart’s pace, both scaled by ${fixed(example.arrowSeconds)} s; the link shows their separation. The chart compares their velocities.`,
    comparison: shortResponseComparison(states, example),
    inputs: [
      { name: 'responseTime', label: 'Response time', unit: 's', min: 0.1, max: 1, step: 0.05 },
      {
        name: 'maxAcceleration',
        label: 'Acceleration limit',
        unit: 'units/s²',
        min: 1,
        max: 8,
        step: 0.5,
      },
    ],
  };
};

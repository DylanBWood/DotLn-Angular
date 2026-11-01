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
import type { StudyFrame, StudyModel } from '../study-model';

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

const readParameters = (parameters: StudyParameters): PriorityParameters => ({
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

const bodyOf = (state: PriorityState, example: PriorityParameters): SteeringBody => ({
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

const fixed = (value: number) => value.toFixed(2);
const vector = ({ x, y }: Vec2) => `(${fixed(x)}, ${fixed(y)})`;
const orderName = (priority: number) => (priority === 1 ? 'Clearance first' : 'Travel first');

function noteOf(step: PriorityStep, contactDistance: number, example: PriorityParameters) {
  if (step.gap <= contactDistance)
    return 'Mica touches the trolley because clearance has not removed the approach speed in time.';
  if (step.activeGroup === 'None')
    return length(step.state.velocity) === 0
      ? 'The threshold silences both groups, leaving Mica at rest.'
      : 'Neither group clears the threshold, so Mica coasts without a fresh correction.';
  if (step.activeGroup === 'Travel') {
    if (length(step.clearance) > example.epsilon)
      return 'Travel wins despite a clearance request, so reaching the bay takes precedence over braking.';
    return length(step.separation) === 0
      ? 'The trolley is outside the buffer, so Travel controls the approach to the loading bay.'
      : 'Clearance is too small to take control, so Travel gets another turn.';
  }
  const nextGap = distance(step.next.position, { x: example.trolleyPosition, y: 0 });
  return nextGap < step.gap
    ? 'Clearance is braking, but Mica is still closing on the trolley.'
    : 'Mica moves away from the trolley as Clearance keeps Travel waiting.';
}

export const model = (parameters: StudyParameters): StudyModel => {
  const example = readParameters(parameters);
  const comparisonPriority = example.clearancePriority === 1 ? 2 : 1;
  const run = prioritySteps(example);
  const comparison = prioritySteps(example, comparisonPriority);
  const seconds = run.map((_step, index) => index * example.timeStep);
  const contactDistance = example.radius * 2;
  const minimumGap = Math.min(...run.map(({ gap }) => gap));
  const comparisonMinimumGap = Math.min(...comparison.map(({ gap }) => gap));
  const touchingSamples = run.filter(({ gap }) => gap <= contactDistance).length;
  const comparisonTouchingSamples = comparison.filter(({ gap }) => gap <= contactDistance).length;
  const switches = run.filter(
    (step, index) => index > 0 && step.activeGroup !== run[index - 1].activeGroup,
  ).length;
  const firstClearance = run.findIndex(({ activeGroup }) => activeGroup === 'Clearance');
  const closest = run.reduce((best, step, index) => (step.gap < run[best].gap ? index : best), 0);
  const order = orderName(example.clearancePriority);
  const comparisonOrder = orderName(comparisonPriority);
  const outcome =
    touchingSamples > 0
      ? 'Mica touches the trolley in the chosen run.'
      : run.every(({ activeGroup }) => activeGroup === 'None')
        ? 'The chosen threshold prevents Mica from starting.'
        : 'The chosen run stays outside touching distance.';
  const inputValues = Object.fromEntries(
    Object.entries(example).map(([name, value]) => [name, String(Number(fixed(value)))]),
  );
  const lane = example.separationThreshold / 2;
  // Separate label stems keep the names apart even when Mica overlaps a stationary mark.
  const labelHeight = example.separationThreshold + example.radius;
  const trolley = { x: example.trolleyPosition, y: 0 };
  const bay = { x: example.target, y: 0 };
  const frames: readonly StudyFrame[] = run.map((step, index) => {
    const away =
      (step.state.position.x - trolley.x) * step.acceleration.x +
      step.state.position.y * step.acceleration.y;
    const pushDirection =
      length(step.acceleration) === 0
        ? 'with no directional correction'
        : away > 0
          ? 'away from the trolley'
          : away < 0
            ? 'towards the trolley'
            : 'across the aisle';
    return {
      seconds: seconds[index],
      bodies: [
        { id: 'Mica', ...step.state.position, tone: 'subject', label: 'Mica' },
        { id: 'parked trolley', ...trolley, tone: 'other' },
      ],
      vectors: [
        {
          x: step.state.position.x,
          y: step.state.position.y - lane,
          dx: step.clearance.x,
          dy: step.clearance.y,
          tone: 'other',
        },
        {
          x: step.state.position.x,
          y: step.state.position.y + lane,
          dx: step.travel.x,
          dy: step.travel.y,
          tone: 'desired',
        },
        {
          ...step.state.position,
          dx: step.acceleration.x,
          dy: step.acceleration.y,
          tone: 'actual',
        },
      ],
      marks: [
        { ...bay, shape: 'cross', tone: 'target' },
        { x: trolley.x, y: -labelHeight, shape: 'dot', tone: 'other', label: 'Trolley' },
        { x: bay.x, y: labelHeight, shape: 'dot', tone: 'target', label: 'Bay' },
      ],
      links: [
        { from: trolley, to: { x: trolley.x, y: -labelHeight }, tone: 'muted' },
        { from: bay, to: { x: bay.x, y: labelHeight }, tone: 'muted' },
      ],
      zones: [
        { ...trolley, radius: example.separationThreshold, tone: 'zone' },
        { ...trolley, radius: contactDistance, tone: 'other' },
      ],
      values: {
        ...inputValues,
        seconds: fixed(seconds[index]),
        position: vector(step.state.position),
        velocity: vector(step.state.velocity),
        gap: fixed(step.gap),
        clearanceAcceleration: fixed(step.clearance.x),
        travelAcceleration: fixed(step.travel.x),
        acceleration: fixed(step.acceleration.x),
        selectedMagnitude: fixed(length(step.acceleration)),
        activeGroup: step.activeGroup,
        pushDirection,
        trolleyRelationship:
          step.state.position.x < trolley.x
            ? 'stands between Mica and the loading bay'
            : step.state.position.x > trolley.x
              ? 'is behind Mica towards the start of the aisle'
              : 'is alongside Mica',
        contactDistance: fixed(contactDistance),
        minimumGap: fixed(minimumGap),
        comparisonMinimumGap: fixed(comparisonMinimumGap),
        touchingSamples: String(touchingSamples),
        comparisonTouchingSamples: String(comparisonTouchingSamples),
        switches: String(switches),
        order,
        comparisonOrder,
        outcome,
      },
      note: noteOf(step, contactDistance, example),
      worked: {
        title: `Mica at ${fixed(seconds[index])} s`,
        lines: [
          `Begin at position ${vector(step.state.position)} with velocity ${vector(step.state.velocity)} units/s; the trolley is at ${vector(trolley)} and the centre gap is ${fixed(step.gap)} units.`,
          length(step.separation) === 0
            ? `The gap is at least ${fixed(example.separationThreshold)}, so separation and the whole Clearance group are zero.`
            : step.gap === 0 || step.state.position.y !== 0
              ? `Engine separation at this displacement gives ${vector(step.separation)} units/s².`
              : `Linear separation along the aisle = ${Math.sign(step.state.position.x - trolley.x)} × ${fixed(example.maxAcceleration)} × (${fixed(example.separationThreshold)} − ${fixed(step.gap)}) / ${fixed(example.separationThreshold)} ≈ ${fixed(step.separation.x)} units/s².`,
          `Brake = clipLength(−${vector(step.state.velocity)} / ${fixed(example.responseTime)}, ${fixed(example.maxAcceleration)}) ≈ ${vector(step.brake)} units/s².`,
          `When separation is active, Clearance = clipLength(${fixed(example.separationWeight)} × ${vector(step.separation)} + ${fixed(example.brakeWeight)} × ${vector(step.brake)}, ${fixed(example.maxAcceleration)}) = ${vector(step.clearance)} units/s²; otherwise it is zero.`,
          `Travel = engine arrive towards ${vector(bay)} = ${vector(step.travel)} units/s²; ${order} selects ${step.activeGroup} using an unrounded magnitude strictly above epsilon ${fixed(example.epsilon)}.`,
          `New velocity = clipLength(${vector(step.state.velocity)} + ${vector(step.acceleration)} × ${fixed(example.timeStep)}, ${fixed(example.maxSpeed)}) ≈ ${vector(step.next.velocity)} units/s.`,
          `New position = ${vector(step.state.position)} + ${vector(step.next.velocity)} × ${fixed(example.timeStep)} ≈ ${vector(step.next.position)} units.`,
        ],
        note: 'Displayed values are rounded; calculations keep full precision, and the updated velocity moves Mica before the next decision.',
      },
    };
  });
  const points = frames.flatMap((frame) => [
    ...frame.bodies,
    ...(frame.marks ?? []),
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
    (Math.max(...points.map(({ x }) => x)) - Math.min(...points.map(({ x }) => x))) * 0.08,
  );
  return {
    motion: {
      frames,
      bounds: {
        minX: Math.min(...points.map(({ x }) => x)) - padding,
        maxX: Math.max(...points.map(({ x }) => x)) + padding,
        minY: Math.min(...points.map(({ y }) => y)) - padding,
        maxY: Math.max(...points.map(({ y }) => y)) + padding,
      },
      trail: true,
    },
    timeline: {
      title: 'Group requests and selected acceleration',
      xLabel: 'Time · seconds',
      yLabel: 'Magnitude · units/s²',
      seconds,
      reference: example.epsilon,
      series: [
        {
          id: 'clearance',
          label: 'Clearance group',
          tone: 'other',
          values: run.map(({ clearance }) => length(clearance)),
        },
        {
          id: 'travel',
          label: 'Travel group',
          tone: 'desired',
          values: run.map(({ travel }) => length(travel)),
        },
        {
          id: 'selected',
          label: 'Selected acceleration',
          tone: 'actual',
          values: run.map(({ acceleration }) => length(acceleration)),
        },
      ],
    },
    initialStep: firstClearance < 0 ? 0 : firstClearance,
    moments: [
      { label: 'First decision', step: 0 },
      ...(firstClearance > 0
        ? [{ label: 'Clearance takes over', step: firstClearance }]
        : [{ label: 'Next decision', step: Math.min(1, example.steps) }]),
      { label: 'Closest approach', step: closest },
      { label: 'End of run', step: example.steps },
    ],
    legend: [
      { tone: 'other', label: 'Upper arrow · Clearance request' },
      { tone: 'desired', label: 'Lower arrow · Travel request' },
      { tone: 'actual', label: 'Arrow through Mica · selected acceleration' },
      { tone: 'zone', label: 'Outer ring · clearance distance; inner ring · touching' },
    ],
    caption:
      'The trolley and bay names have stems so they stay apart from Mica during an overlap. The outer ring wakes separation and the inner ring marks touching centre distance. Arrows share an acceleration scale; the chart shows their magnitudes against epsilon. Clearance priority is first or second in the order.',
    comparison: {
      title: 'Reverse the group order',
      intro: `Change only Clearance priority: ${order} becomes ${comparisonOrder}. Touching begins at centre distance ${fixed(contactDistance)} units; the comparison keeps the chosen buffer and epsilon.`,
      timeline: {
        title: 'Distance from the parked trolley',
        xLabel: 'Time · seconds',
        yLabel: 'Centre distance · units',
        seconds,
        yRange: [
          0,
          Math.max(
            contactDistance,
            ...run.map(({ gap }) => gap),
            ...comparison.map(({ gap }) => gap),
          ),
        ],
        reference: contactDistance,
        series: [
          { id: 'chosen', label: order, tone: 'actual', values: run.map(({ gap }) => gap) },
          {
            id: 'reversed',
            label: comparisonOrder,
            tone: 'desired',
            values: comparison.map(({ gap }) => gap),
          },
        ],
      },
      findings: [
        `${order}: minimum gap ${fixed(minimumGap)} units and ${touchingSamples} sampled touching moments; ${comparisonOrder}: minimum gap ${fixed(comparisonMinimumGap)} units and ${comparisonTouchingSamples} sampled touching moments.`,
        `${outcome} The chosen run changes selected group ${switches} times; ordering requests does not plan a detour around the trolley.`,
      ],
      note: 'Lines join fixed-step samples, which can miss a brief overlap; touching is measured without collision response or an automatic rest snap.',
    },
    inputs: [
      {
        name: 'clearancePriority',
        label: 'Clearance priority',
        unit: 'rank',
        min: 1,
        max: 2,
        step: 1,
      },
      {
        name: 'separationThreshold',
        label: 'Clearance distance',
        unit: 'units',
        min: 1.25,
        max: 5,
        step: 0.25,
      },
      {
        name: 'epsilon',
        label: 'Activation threshold',
        unit: 'units/s²',
        min: 0,
        max: 4,
        step: 0.1,
      },
    ],
  };
};

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
import type { StudyFrame, StudyModel } from '../study-model';

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

const readParameters = (parameters: StudyParameters): EquilibriumParameters => ({
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

const fixed = (value: number) => value.toFixed(2);
const vector = ({ x, y }: Vec2) => `(${fixed(x)}, ${fixed(y)})`;

function noteOf(step: EquilibriumStep, example: EquilibriumParameters, index: number) {
  if (step.activeGroup === 'None')
    return length(step.state.velocity) === 0
      ? length(step.primary) === 0
        ? 'The beacon pulls cancel and the fallback is too weak, leaving Nori at rest.'
        : 'Neither request clears the threshold, so Nori stays at rest.'
      : 'Both requests are too small to take control, so Nori keeps coasting.';
  if (step.activeGroup === 'Wander fallback')
    return index === 0
      ? 'The beacon pulls cancel, so the fallback gives Nori a nudge across their line.'
      : 'The beacon pull is too small to take control, so the fallback gets another turn.';
  return (step.state.position.y - example.beaconY) * step.state.velocity.y > 0
    ? 'The beacons have reclaimed control, but Nori is still drifting away from their line.'
    : 'The beacons pull Nori back towards their line, so the nudge has not chosen a destination.';
}

export const model = (parameters: StudyParameters): StudyModel => {
  const example = readParameters(parameters);
  const run = equilibriumSteps(example);
  const comparison = equilibriumSteps(example, example.weakFallbackWeight);
  const seconds = run.map((_step, index) => index * example.timeStep);
  const firstPrimary = run.findIndex(({ activeGroup }) => activeGroup === 'Beacon blend');
  const firstReturn = run.findIndex(
    ({ state }) => (state.position.y - example.beaconY) * state.velocity.y < 0,
  );
  const fallbackSteps = run
    .slice(0, -1)
    .filter(({ activeGroup }) => activeGroup === 'Wander fallback').length;
  const maxOffset = Math.max(
    ...run.map(({ state }) => Math.abs(state.position.y - example.beaconY)),
  );
  const comparisonMaxOffset = Math.max(
    ...comparison.map(({ state }) => Math.abs(state.position.y - example.beaconY)),
  );
  const comparisonInitialMagnitude = length(comparison[0].fallback);
  const comparisonStarts = comparisonInitialMagnitude > example.epsilon;
  const comparisonStart = comparisonStarts
    ? 'the comparison fallback clears the threshold'
    : 'the comparison fallback does not clear the threshold';
  const primaryHandover =
    firstPrimary < 0
      ? 'The beacon group never reclaims control in this run.'
      : `The beacon group first reclaims control after ${fixed(seconds[firstPrimary])} s.`;
  const returnReading =
    firstReturn < 0
      ? 'Nori does not move back towards the line during this run.'
      : `Nori first moves back towards the line after ${fixed(seconds[firstReturn])} s.`;
  const movementReading =
    maxOffset === 0
      ? 'Nori stays at rest because neither group clears the threshold.'
      : 'Nori leaves the balance, but neither beacon is chosen as a destination.';
  const inputValues = Object.fromEntries(
    Object.entries(example).map(([name, value]) => [name, String(Number(fixed(value)))]),
  );
  const frames: readonly StudyFrame[] = run.map((step, index) => ({
    seconds: seconds[index],
    bodies: [{ id: 'Nori', ...step.state.position, tone: 'subject', label: 'Nori' }],
    marks: [
      {
        x: -example.beaconHalfSpan,
        y: example.beaconY,
        shape: 'cross',
        tone: 'target',
        label: 'West',
      },
      {
        x: example.beaconHalfSpan,
        y: example.beaconY,
        shape: 'cross',
        tone: 'target',
        label: 'East',
      },
    ],
    links: [
      {
        from: { x: -example.beaconHalfSpan, y: example.beaconY },
        to: { x: example.beaconHalfSpan, y: example.beaconY },
        tone: 'muted',
      },
    ],
    vectors: [
      {
        ...step.state.position,
        dx: step.left.x * example.beaconWeight,
        dy: step.left.y * example.beaconWeight,
        tone: 'target',
      },
      {
        ...step.state.position,
        dx: step.right.x * example.beaconWeight,
        dy: step.right.y * example.beaconWeight,
        tone: 'target',
      },
      { ...step.state.position, dx: step.primary.x, dy: step.primary.y, tone: 'other' },
      {
        x: step.state.position.x + example.radius * 2,
        y: step.state.position.y,
        dx: step.fallback.x,
        dy: step.fallback.y,
        tone: 'desired',
      },
      {
        x: step.state.position.x - example.radius * 2,
        y: step.state.position.y,
        dx: step.acceleration.x,
        dy: step.acceleration.y,
        tone: 'actual',
      },
    ],
    values: {
      ...inputValues,
      seconds: fixed(seconds[index]),
      position: vector(step.state.position),
      velocity: vector(step.state.velocity),
      leftRequest: vector(scale(step.left, example.beaconWeight)),
      rightRequest: vector(scale(step.right, example.beaconWeight)),
      primaryRequest: vector(step.primary),
      fallbackRequest: vector(step.fallback),
      acceleration: vector(step.acceleration),
      activeGroup: step.activeGroup,
      lineOffset: fixed(Math.abs(step.state.position.y - example.beaconY)),
      primaryMagnitude: fixed(length(step.primary)),
      fallbackMagnitude: fixed(length(step.fallback)),
      selectedMagnitude: fixed(length(step.acceleration)),
      beaconReading:
        length(step.primary) === 0
          ? 'the opposing beacon requests cancel'
          : `the beacons pull back towards that line with net acceleration ${fixed(length(step.primary))} units/s²`,
      firstPrimaryTime: firstPrimary < 0 ? 'not reached' : fixed(seconds[firstPrimary]),
      firstReturnTime: firstReturn < 0 ? 'not reached' : fixed(seconds[firstReturn]),
      primaryHandover,
      returnReading,
      movementReading,
      fallbackSteps: String(fallbackSteps),
      maxOffset: fixed(maxOffset),
      comparisonMaxOffset: fixed(comparisonMaxOffset),
      comparisonInitialMagnitude: fixed(comparisonInitialMagnitude),
      comparisonStart,
    },
    note: noteOf(step, example, index),
    worked: {
      title: `Nori at ${fixed(seconds[index])} s`,
      lines: [
        `Begin at position ${vector(step.state.position)} with velocity ${vector(step.state.velocity)} units/s.`,
        `Weighted beacon requests: ${vector(scale(step.left, example.beaconWeight))} + ${vector(scale(step.right, example.beaconWeight))}; clip their sum to ${fixed(example.maxAcceleration)} to get ${vector(step.primary)} units/s².`,
        `The unrounded beacon magnitude ${length(step.primary) > example.epsilon ? 'clears' : 'does not clear'} epsilon ${fixed(example.epsilon)}; its displayed magnitude is ${fixed(length(step.primary))} units/s².`,
        `Engine wander requests ${vector(step.wander)}. Multiply by fallback weight ${fixed(example.fallbackWeight)} and clip to get ${vector(step.fallback)} units/s².`,
        `firstActive([beacon blend, wander fallback], epsilon) selects ${step.activeGroup}: ${vector(step.acceleration)} units/s². The groups are not added together.`,
        `New velocity = clipLength(${vector(step.state.velocity)} + ${vector(step.acceleration)} × ${fixed(example.timeStep)}, ${fixed(example.maxSpeed)}) ≈ ${vector(step.next.velocity)} units/s.`,
        `New position = ${vector(step.state.position)} + ${vector(step.next.velocity)} × ${fixed(example.timeStep)} ≈ ${vector(step.next.position)} units.`,
      ],
      note: 'Displayed values are rounded; calculations keep full precision. Heading and wander angle stay fixed, using the engine’s deterministic trigonometry.',
    },
  }));
  const points = frames.flatMap((frame) => [
    ...frame.bodies,
    ...(frame.marks ?? []),
    ...(frame.vectors ?? []).flatMap(({ x, y, dx, dy }) => [
      { x, y },
      { x: x + dx, y: y + dy },
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
      title: 'Cancellation and control returning to the beacon group',
      xLabel: 'Time · seconds',
      yLabel: 'Acceleration magnitude · units/s²',
      seconds,
      reference: example.epsilon,
      series: [
        {
          id: 'primary',
          label: 'Beacon blend',
          tone: 'other',
          values: run.map(({ primary }) => length(primary)),
        },
        {
          id: 'fallback',
          label: 'Wander fallback request',
          tone: 'desired',
          values: run.map(({ fallback }) => length(fallback)),
        },
        {
          id: 'selected',
          label: 'Selected acceleration',
          tone: 'actual',
          values: run.map(({ acceleration }) => length(acceleration)),
        },
      ],
    },
    initialStep: 0,
    moments: [
      { label: 'Requests cancel', step: 0 },
      {
        label: maxOffset === 0 ? 'Still at rest' : 'The nudge moves Nori',
        step: Math.min(1, example.steps),
      },
      ...(firstPrimary > 1 ? [{ label: 'Beacon group resumes', step: firstPrimary }] : []),
      ...(firstReturn > 1 ? [{ label: 'Returning towards the line', step: firstReturn }] : []),
      { label: 'End of run', step: example.steps },
    ],
    legend: [
      { tone: 'target', label: 'Arrows through Nori · weighted beacon pulls' },
      { tone: 'other', label: 'Arrow through Nori · net beacon request' },
      { tone: 'desired', label: 'Right arrow · fallback request' },
      { tone: 'actual', label: 'Left arrow · selected acceleration' },
    ],
    caption:
      'West and East pull Nori in opposite directions along their line. The fallback arrow is offset right and the selected arrow left so both remain visible. Arrows share an acceleration scale; the chart shows magnitudes against epsilon. The fixed wander heading points across the beacon line, towards the bottom of the drawing.',
    comparison: {
      title: 'Does the fallback clear the threshold?',
      intro: `Compare the chosen fallback weight ${fixed(example.fallbackWeight)} with ${fixed(example.weakFallbackWeight)}, keeping epsilon ${fixed(example.epsilon)}. The comparison starts with magnitude ${fixed(comparisonInitialMagnitude)} units/s²: ${comparisonStart}. Equality does not activate a group.`,
      timeline: {
        title: 'Displacement from the beacon line',
        xLabel: 'Time · seconds',
        yLabel: 'Absolute distance from line · units',
        seconds,
        yRange: [0, Math.max(example.radius, maxOffset, comparisonMaxOffset)],
        reference: 0,
        series: [
          {
            id: 'chosen',
            label: `Chosen weight ${fixed(example.fallbackWeight)}`,
            tone: 'actual',
            values: run.map(({ state }) => Math.abs(state.position.y - example.beaconY)),
          },
          {
            id: 'comparison',
            label: `Comparison weight ${fixed(example.weakFallbackWeight)}`,
            tone: 'desired',
            values: comparison.map(({ state }) => Math.abs(state.position.y - example.beaconY)),
          },
        ],
      },
      findings: [
        `The chosen run reaches a maximum offset of ${fixed(maxOffset)} units; the comparison reaches ${fixed(comparisonMaxOffset)} units. ${comparisonStarts ? 'The comparison fallback is strong enough for the chosen threshold.' : 'The comparison stays at rest because both groups decline.'}`,
        `${primaryHandover} Fallback owns ${fallbackSteps} simulated updates. ${movementReading}`,
      ],
      note: 'Lines join deterministic fixed-step samples; a small net request can mean cancellation or satisfied goals, which the threshold alone cannot distinguish.',
    },
    inputs: [
      {
        name: 'fallbackWeight',
        label: 'Fallback weight',
        unit: 'weight',
        min: 0,
        max: 1,
        step: 0.01,
      },
      {
        name: 'epsilon',
        label: 'Activation threshold',
        unit: 'units/s²',
        min: 0.05,
        max: 1,
        step: 0.05,
      },
    ],
  };
};

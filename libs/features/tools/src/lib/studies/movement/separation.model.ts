import type { StudyParameters } from '@dotln-angular/models';
import {
  add,
  clipLength,
  distance,
  dot,
  length,
  normalize,
  scale,
  separate,
  type SteeringBody,
  subtract,
  type Vec2,
} from '@dotln-angular/scene-engine';

import { namedBoundsOf } from '../drawing';
import { numberParameter } from '../parameters';
import type { StudyFrame, StudyModel } from '../study-model';

export interface SeparationParameters {
  readonly centre: number;
  readonly initialGap: number;
  readonly inwardSpeed: number;
  readonly fastInwardSpeed: number;
  readonly radius: number;
  readonly threshold: number;
  readonly maxAcceleration: number;
  readonly maxSpeed: number;
  readonly timeStep: number;
  readonly steps: number;
  readonly laneOffset: number;
  readonly accelerationScale: number;
}

export type ShelfPair = readonly [SteeringBody, SteeringBody];

export interface SeparationStep {
  readonly gap: number;
  readonly accelerations: readonly [Vec2, Vec2];
  readonly next: ShelfPair;
}

const readParameters = (parameters: StudyParameters): SeparationParameters => ({
  centre: numberParameter(parameters, 'centre'),
  initialGap: numberParameter(parameters, 'initialGap'),
  inwardSpeed: numberParameter(parameters, 'inwardSpeed'),
  fastInwardSpeed: numberParameter(parameters, 'fastInwardSpeed'),
  radius: numberParameter(parameters, 'radius'),
  threshold: numberParameter(parameters, 'threshold'),
  maxAcceleration: numberParameter(parameters, 'maxAcceleration'),
  maxSpeed: numberParameter(parameters, 'maxSpeed'),
  timeStep: numberParameter(parameters, 'timeStep'),
  steps: numberParameter(parameters, 'steps'),
  laneOffset: numberParameter(parameters, 'laneOffset'),
  accelerationScale: numberParameter(parameters, 'accelerationScale'),
});

const shown = (value: number) => String(Number(value.toFixed(2)));

export function createShelfPair(
  example: SeparationParameters,
  inwardSpeed = example.inwardSpeed,
): ShelfPair {
  const courier = (side: number): SteeringBody => ({
    position: { x: example.centre + (side * example.initialGap) / 2, y: 0 },
    velocity: { x: -side * inwardSpeed, y: 0 },
    heading: { x: side, y: 0 },
    radius: example.radius,
    maxAcceleration: example.maxAcceleration,
    maxSpeed: example.maxSpeed,
    wanderAngle: 0,
  });
  return [courier(-1), courier(1)];
}

/** Both steering calls read the same pair before either courier changes position. */
export function calculateSeparationStep(
  before: ShelfPair,
  example: SeparationParameters,
  falloff: 1 | 2,
): SeparationStep {
  const tuning = { separationThreshold: example.threshold, separationFalloff: falloff };
  const accelerations = [
    separate(before[0], 0, before, tuning),
    separate(before[1], 1, before, tuning),
  ] as const;
  const move = (body: SteeringBody, acceleration: Vec2): SteeringBody => {
    const velocity = clipLength(
      add(body.velocity, scale(acceleration, example.timeStep)),
      body.maxSpeed,
    );
    return { ...body, velocity, position: add(body.position, scale(velocity, example.timeStep)) };
  };
  return {
    gap: distance(before[0].position, before[1].position),
    accelerations,
    next: [move(before[0], accelerations[0]), move(before[1], accelerations[1])],
  };
}

export function separationFrames(
  example: SeparationParameters,
  falloff: 1 | 2,
  inwardSpeed = example.inwardSpeed,
): readonly ShelfPair[] {
  const frames: ShelfPair[] = [createShelfPair(example, inwardSpeed)];
  for (let step = 0; step < example.steps; step++)
    frames.push(calculateSeparationStep(frames[frames.length - 1], example, falloff).next);
  return frames;
}

const gapOf = (pair: ShelfPair) => distance(pair[0].position, pair[1].position);
const gapRate = (pair: ShelfPair) =>
  dot(
    subtract(pair[1].velocity, pair[0].velocity),
    normalize(subtract(pair[1].position, pair[0].position)),
  );

function motionOf(pair: ShelfPair, example: SeparationParameters): string {
  if (gapOf(pair) < 2 * example.radius) return 'overlapping';
  const rate = gapRate(pair);
  return rate < 0 ? 'closing' : rate > 0 ? 'moving apart' : 'at rest';
}

function noteOf(square: ShelfPair, linear: ShelfPair, example: SeparationParameters): string {
  if (Math.min(gapOf(square), gapOf(linear)) < 2 * example.radius)
    return 'The couriers’ footprints overlap because repulsion has not kept their closing paths clear.';
  const closing = [square, linear].filter((pair) => gapRate(pair) < 0).length;
  if (closing === 2)
    return 'Both pairs are still closing despite their outward pushes, so separation has yet to secure clearance.';
  if (closing === 1)
    return 'One pair is still closing despite its outward push, so clearance remains uncertain.';
  const squareOutside = gapOf(square) >= example.threshold;
  const linearOutside = gapOf(linear) >= example.threshold;
  if (squareOutside && linearOutside)
    return 'Both pairs coast apart because separation stops pushing without removing their velocity.';
  if (linearOutside)
    return 'The linear pair coasts beyond its neighbourhood while inverse-square repulsion still pushes the other pair apart.';
  if (squareOutside)
    return 'The inverse-square pair coasts beyond its neighbourhood while linear repulsion still pushes the other pair apart.';
  if (length(square[0].velocity) === 0 && length(linear[0].velocity) === 0)
    return 'The pairs start at rest, and their different outward pushes begin making room at different rates.';
  return 'Both pairs move apart as their repulsion fades with increasing distance.';
}

function calculationLines(
  pair: ShelfPair,
  example: SeparationParameters,
  falloff: 1 | 2,
): readonly string[] {
  const step = calculateSeparationStep(pair, example, falloff);
  const name = falloff === 2 ? 'Inverse-square' : 'Linear';
  const a = length(step.accelerations[0]);
  const [A, R, d, c] = [
    shown(example.maxAcceleration),
    shown(example.threshold),
    shown(step.gap),
    shown(2 * example.radius),
  ];
  const strength =
    step.gap >= example.threshold
      ? `${name}: gap ${d} ≥ threshold ${R}, so acceleration is zero.`
      : falloff === 2
        ? step.gap < 0.005
          ? `${name}: the centres are closer than the displayed precision, so the request reaches the ${A}-units/s² acceleration cap.`
          : `${name}: min(${A}, ${A} × ${c}² × (1/${d}² − 1/${R}²)) ≈ ${shown(a)} units/s² away from the other courier.`
        : `${name}: ${A} × (${R} − ${d}) / ${R} ≈ ${shown(a)} units/s² away from the other courier.`;
  const before = pair[0];
  const after = step.next[0];
  return [
    strength,
    `Mira's x velocity: ${shown(before.velocity.x)} + (${shown(step.accelerations[0].x)} × ${shown(example.timeStep)}) ≈ ${shown(after.velocity.x)} units/s after the ${shown(example.maxSpeed)}-units/s speed cap.`,
    `Mira's x position: ${shown(before.position.x)} + (${shown(after.velocity.x)} × ${shown(example.timeStep)}) ≈ ${shown(after.position.x)}; Rowan moves symmetrically, giving next gap ${shown(gapOf(step.next))}.`,
  ];
}

function frameOf(
  square: ShelfPair,
  linear: ShelfPair,
  step: number,
  example: SeparationParameters,
): StudyFrame {
  const squareStep = calculateSeparationStep(square, example, 2);
  const linearStep = calculateSeparationStep(linear, example, 1);
  const lanes = [
    { pair: square, calculation: squareStep, y: -example.laneOffset, tone: 'actual' },
    { pair: linear, calculation: linearStep, y: example.laneOffset, tone: 'desired' },
  ] as const;
  const labelLift = 8 * example.radius;
  return {
    seconds: step * example.timeStep,
    bodies: lanes.flatMap(({ pair, y, tone }) =>
      pair.map((body, index) => ({
        id: `${tone}-${index === 0 ? 'mira' : 'rowan'}`,
        x: body.position.x,
        y: body.position.y + y,
        tone,
        ...(index === 0 ? { label: 'Mira' } : {}),
      })),
    ),
    marks: lanes.map(({ pair, y, tone }) => ({
      x: pair[1].position.x,
      y: pair[1].position.y + y + labelLift,
      shape: 'dot',
      tone,
      label: 'Rowan',
    })),
    vectors: lanes.flatMap(({ pair, calculation, y, tone }) =>
      pair.map((body, index) => ({
        x: body.position.x,
        y: body.position.y + y,
        dx: calculation.accelerations[index].x * example.accelerationScale,
        dy: calculation.accelerations[index].y * example.accelerationScale,
        tone,
      })),
    ),
    zones: lanes.flatMap(({ pair, y, tone }) => [
      { ...pair[0].position, y: pair[0].position.y + y, radius: example.threshold, tone: 'zone' },
      ...pair.map((body) => ({
        ...body.position,
        y: body.position.y + y,
        radius: example.radius,
        tone,
      })),
    ]),
    links: lanes.flatMap(({ pair, y }) => [
      {
        from: { x: pair[0].position.x, y: pair[0].position.y + y },
        to: { x: pair[1].position.x, y: pair[1].position.y + y },
        tone: 'muted',
      },
      {
        from: { x: pair[1].position.x, y: pair[1].position.y + y },
        to: { x: pair[1].position.x, y: pair[1].position.y + y + labelLift },
        tone: 'muted',
      },
    ]),
    values: {
      seconds: shown(step * example.timeStep),
      squareGap: shown(squareStep.gap),
      squareSpeed: shown(length(square[0].velocity)),
      squareAcceleration: shown(length(squareStep.accelerations[0])),
      squareMotion: motionOf(square, example),
      linearGap: shown(linearStep.gap),
      linearSpeed: shown(length(linear[0].velocity)),
      linearAcceleration: shown(length(linearStep.accelerations[0])),
      linearMotion: motionOf(linear, example),
      initialGap: shown(example.initialGap),
      inwardSpeed: shown(example.inwardSpeed),
      fastInwardSpeed: shown(example.fastInwardSpeed),
      threshold: shown(example.threshold),
      radius: shown(example.radius),
      timeStep: shown(example.timeStep),
      maxSpeed: shown(example.maxSpeed),
      accelerationScale: shown(example.accelerationScale),
    },
    note: noteOf(square, linear, example),
    worked: {
      title: `Shelf calculation at ${shown(step * example.timeStep)} s`,
      lines: [
        `Body diameter = 2 × ${shown(example.radius)} = ${shown(2 * example.radius)} units; the centre gaps are ${shown(squareStep.gap)} above and ${shown(linearStep.gap)} below.`,
        ...calculationLines(square, example, 2),
        ...calculationLines(linear, example, 1),
      ],
      note:
        step === example.steps
          ? 'This final sample previews the next update; displayed values are rounded while calculations retain full precision.'
          : 'Both runs use the same speed cap and update order; displayed values are rounded while calculations retain full precision.',
    },
  };
}

export const model = (parameters: StudyParameters): StudyModel => {
  const example = readParameters(parameters);
  const square = separationFrames(example, 2);
  const linear = separationFrames(example, 1);
  const fast = separationFrames(example, 2, example.fastInwardSpeed);
  const frames = square.map((pair, step) => frameOf(pair, linear[step], step, example));
  const seconds = frames.map((frame) => frame.seconds);
  const squareGaps = square.map(gapOf);
  const linearGaps = linear.map(gapOf);
  const fastGaps = fast.map(gapOf);
  const closest = fastGaps.reduce((best, gap, step) => (gap < fastGaps[best] ? step : best), 0);
  const contact = 2 * example.radius;
  const overlap = squareGaps.findIndex((gap, step) => Math.min(gap, linearGaps[step]) < contact);
  const comparisonEnd = Math.min(
    seconds[example.steps],
    Math.max(example.timeStep, example.initialGap / Math.abs(example.fastInwardSpeed)),
  );
  const comparisonCount = seconds.filter((second) => second <= comparisonEnd).length;
  const comparisonPeak = Math.max(
    contact,
    ...squareGaps.slice(0, comparisonCount),
    ...fastGaps.slice(0, comparisonCount),
  );
  const firstOverlap = fastGaps.findIndex((gap) => gap < contact);
  const exit = (gaps: readonly number[]) => gaps.findIndex((gap) => gap >= example.threshold);
  const linearExit = exit(linearGaps);
  const squareExit = exit(squareGaps);
  return {
    motion: { bounds: namedBoundsOf(frames, 2 * example.radius), frames, trail: true },
    timeline: {
      title: 'Space made at the shelf',
      xLabel: 'Time · seconds',
      yLabel: 'Centre distance · units',
      seconds,
      reference: example.threshold,
      series: [
        { id: 'square-gap', label: 'Inverse-square gap', tone: 'actual', values: squareGaps },
        { id: 'linear-gap', label: 'Linear gap', tone: 'desired', values: linearGaps },
      ],
    },
    initialStep: overlap < 0 ? 0 : overlap,
    moments: [
      { label: 'First pushes', step: 0 },
      {
        label: linearExit < 0 ? 'Linear run at the end' : 'Linear run leaves the neighbourhood',
        step: linearExit < 0 ? example.steps : linearExit,
      },
      {
        label:
          squareExit < 0
            ? 'Inverse-square run at the end'
            : 'Inverse-square run leaves the neighbourhood',
        step: squareExit < 0 ? example.steps : squareExit,
      },
      {
        label: overlap < 0 ? 'End of observation' : 'Footprints overlap',
        step: overlap < 0 ? example.steps : overlap,
      },
    ],
    legend: [
      { tone: 'actual', label: 'Upper pair · inverse-square falloff' },
      { tone: 'desired', label: 'Lower pair · linear falloff' },
      { tone: 'zone', label: 'Outer circles · neighbourhood around Mira' },
      { tone: 'muted', label: 'Inner circles · body footprints; dotted lines attach names' },
    ],
    caption: `Both rows repeat Mira and Rowan: inverse-square above, linear below. Arrows push away from the other courier at ${shown(example.accelerationScale)} drawing units per unit/s². Rowan's name follows a dotted callout so the names stay apart when the couriers meet.`,
    comparison: {
      title: 'The spacing rule cannot enforce clearance',
      intro: `Compare initial inward speeds ${shown(example.inwardSpeed)} and ${shown(example.fastInwardSpeed)} units/s each; only the starting velocity changes, with the same gap ${shown(example.initialGap)}, threshold ${shown(example.threshold)} and acceleration cap ${shown(example.maxAcceleration)}.`,
      timeline: {
        title: 'Does the centre gap fall below the body diameter?',
        xLabel: 'Time · seconds',
        yLabel: 'Centre distance · units',
        seconds,
        reference: contact,
        xRange: [0, comparisonEnd],
        yRange: [0, comparisonPeak],
        series: [
          {
            id: 'reference',
            label: `Inward speed ${shown(example.inwardSpeed)} units/s`,
            tone: 'actual',
            values: squareGaps,
          },
          {
            id: 'inward',
            label: `Comparison speed ${shown(example.fastInwardSpeed)} units/s`,
            tone: 'desired',
            values: fastGaps,
          },
        ],
        marks: [{ x: seconds[closest], y: fastGaps[closest], tone: 'desired' }],
      },
      findings: [
        firstOverlap < 0
          ? 'No sampled overlap occurs in the comparison run at these settings.'
          : `The comparison pair first overlaps at ${shown(seconds[firstOverlap])} s: gap ${shown(fastGaps[firstOverlap])} is smaller than body diameter ${shown(contact)}; its smallest sampled gap is ${shown(fastGaps[closest])} at ${shown(seconds[closest])} s.`,
        example.inwardSpeed === example.fastInwardSpeed
          ? 'The chosen speeds match, so both lines repeat the same run.'
          : `Both runs initially request ${shown(length(calculateSeparationStep(square[0], example, 2).accelerations[0]))} units/s² away from the other courier because velocity does not enter this steering request.`,
        `The main inverse-square run ends with gap ${shown(squareGaps[example.steps])} and speed ${shown(length(square[example.steps][0].velocity))} units/s each; separation supplies no finishing brake.`,
      ],
      note: `The chart focuses on the first ${shown(comparisonEnd)} s; below the body-diameter reference the footprints overlap, and no collision solver prevents the couriers passing through one another.`,
    },
    inputs: [
      {
        name: 'inwardSpeed',
        label: 'Initial inward speed',
        unit: 'units/s each',
        min: 0,
        max: 4,
        step: 0.5,
      },
      { name: 'threshold', label: 'Neighbour range', unit: 'units', min: 2.5, max: 6, step: 0.5 },
    ],
  };
};

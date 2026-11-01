import type { StudyParameters } from '@dotln-angular/models';
import {
  add,
  centroid,
  distance,
  patternSlots,
  subtract,
  type Vec2,
} from '@dotln-angular/scene-engine';

import { numberParameter } from '../parameters';
import type {
  MotionBounds,
  StudyFrame,
  StudyInput,
  StudyModel,
  StudyWorkedStep,
} from '../study-model';

export interface ScalableFormationParameters {
  readonly initialCount: number;
  readonly targetCount: number;
  readonly comparisonCount: number;
  readonly spacing: number;
  readonly memberRadius: number;
  readonly laneWidth: number;
  readonly anchorX: number;
  readonly anchorY: number;
  readonly joinStart: number;
  readonly joinInterval: number;
  readonly timeStep: number;
  readonly steps: number;
}

export interface ScalableFormationSample {
  readonly step: number;
  readonly seconds: number;
  readonly count: number;
  readonly offsets: readonly Vec2[];
  readonly rawOffsets: readonly Vec2[];
  readonly rawCentre: Vec2;
  readonly positions: readonly Vec2[];
  readonly retainedShift: number;
  readonly centreSpan: number;
  readonly width: number;
  readonly clearance: number;
}

const readParameters = (parameters: StudyParameters): ScalableFormationParameters => ({
  initialCount: numberParameter(parameters, 'initialCount'),
  targetCount: numberParameter(parameters, 'targetCount'),
  comparisonCount: numberParameter(parameters, 'comparisonCount'),
  spacing: numberParameter(parameters, 'spacing'),
  memberRadius: numberParameter(parameters, 'memberRadius'),
  laneWidth: numberParameter(parameters, 'laneWidth'),
  anchorX: numberParameter(parameters, 'anchorX'),
  anchorY: numberParameter(parameters, 'anchorY'),
  joinStart: numberParameter(parameters, 'joinStart'),
  joinInterval: numberParameter(parameters, 'joinInterval'),
  timeStep: numberParameter(parameters, 'timeStep'),
  steps: numberParameter(parameters, 'steps'),
});

const inputs: readonly StudyInput[] = [
  { name: 'targetCount', label: 'Requested members', unit: 'scouts', min: 4, max: 7, step: 1 },
  { name: 'spacing', label: 'Slot spacing', unit: 'units', min: 1.5, max: 3, step: 0.25 },
  { name: 'laneWidth', label: 'Lane width', unit: 'units', min: 6, max: 14, step: 0.5 },
];

const fixed = (value: number) => Number(value.toFixed(2)).toFixed(2);
const point = ({ x, y }: Vec2) => `(${fixed(x)}, ${fixed(y)})`;
const namedPoints = (points: readonly Vec2[]) =>
  points.map((position, index) => `slot ${index} ${point(position)}`).join('; ');
const anchorOf = (example: ScalableFormationParameters): Vec2 => ({
  x: example.anchorX,
  y: example.anchorY,
});

/** Membership is a scripted input to the pattern, not the result of moving scouts. */
export function countAt(
  step: number,
  example: ScalableFormationParameters,
  targetCount = example.targetCount,
): number {
  const joins = Math.max(
    0,
    Math.min(
      targetCount - example.initialCount,
      1 + Math.floor((step - example.joinStart) / example.joinInterval),
    ),
  );
  return example.initialCount + joins;
}

/** Run the engine's geometry and measure proposals without inventing a travel controller. */
export function scalableFormationSamples(
  example: ScalableFormationParameters,
  targetCount = example.targetCount,
): readonly ScalableFormationSample[] {
  const anchor = anchorOf(example);
  const upperEdge = anchor.y - example.laneWidth / 2;
  const lowerEdge = anchor.y + example.laneWidth / 2;
  const samples: ScalableFormationSample[] = [];
  for (let step = 0; step <= example.steps; step++) {
    const count = countAt(step, example, targetCount);
    const offsets = patternSlots('wedge', count, example.spacing);
    const positions = offsets.map((offset) => add(anchor, offset));
    // A wedge's raw tip is the origin. Recover the raw offsets for the worked calculation
    // from the engine output instead of maintaining a second layout implementation.
    const rawOffsets = offsets.map((offset) => subtract(offset, offsets[0]));
    const rawCentre = centroid(rawOffsets);
    const previous = samples.at(-1)?.positions ?? positions;
    const retainedShift = Math.max(
      ...positions
        .slice(0, previous.length)
        .map((position, index) => distance(position, previous[index])),
    );
    const upper = Math.min(...positions.map(({ y }) => y));
    const lower = Math.max(...positions.map(({ y }) => y));
    const centreSpan = lower - upper;
    const width = centreSpan + 2 * example.memberRadius;
    const clearance = Math.min(
      upper - example.memberRadius - upperEdge,
      lowerEdge - lower - example.memberRadius,
    );
    samples.push({
      step,
      seconds: step * example.timeStep,
      count,
      offsets,
      rawOffsets,
      rawCentre,
      positions,
      retainedShift,
      centreSpan,
      width,
      clearance,
    });
  }
  return samples;
}

function workedStep(
  sample: ScalableFormationSample,
  example: ScalableFormationParameters,
): StudyWorkedStep {
  const sum = sample.rawOffsets.reduce(add, { x: 0, y: 0 });
  const tip = sample.offsets[0];
  const upperArm = 2 * Math.floor((sample.count - 1) / 2);
  const lowerArm = 2 * Math.floor((sample.count - 2) / 2) + 1;
  const upper = Math.min(...sample.positions.map(({ y }) => y));
  const lower = Math.max(...sample.positions.map(({ y }) => y));
  return {
    title: `The ${sample.count}-scout proposal at ${fixed(sample.seconds)} seconds`,
    lines: [
      `Membership schedule: ${sample.count} scouts; engine wedge spacing = ${fixed(example.spacing)} units along each local axis.`,
      `Before centring, the tip-relative offsets are ${namedPoints(sample.rawOffsets)}.`,
      `Raw mean = (${fixed(sum.x)} / ${sample.count}, ${fixed(sum.y)} / ${sample.count}) = ${point(sample.rawCentre)}.`,
      `Centre the tip: (0 − ${fixed(sample.rawCentre.x)}, 0 − ${fixed(sample.rawCentre.y)}) = ${point(tip)}; add anchor ${point(anchorOf(example))} to get ${point(sample.positions[0])}. Every other slot subtracts the same mean.`,
      `Upper arm ends at slot ${upperArm}, ${point(sample.positions[upperArm])}; lower arm ends at slot ${lowerArm}, ${point(sample.positions[lowerArm])}.`,
      `Transverse centre span = ${fixed(lower)} − (${fixed(upper)}) = ${fixed(sample.centreSpan)} units; full width = ${fixed(sample.centreSpan)} + 2 × ${fixed(example.memberRadius)} = ${fixed(sample.width)} units.`,
      `Compare with lane width ${fixed(example.laneWidth)}: the smallest edge clearance is ${fixed(sample.clearance)} units. Largest retained-slot shift from the preceding sample = ${fixed(sample.retainedShift)} units.`,
    ],
    note: 'Local x runs along the lane, local y across it. Recentring is part of the engine pattern. All positions are proposed destinations; the preview makes no claim about travel between layouts. Values are rounded after calculation.',
  };
}

function boundsOf(
  samples: readonly ScalableFormationSample[],
  example: ScalableFormationParameters,
): MotionBounds {
  const positions = samples.flatMap((sample) => sample.positions);
  const halfLength =
    Math.max(
      example.laneWidth / 2,
      ...positions.map(({ x }) => Math.abs(x - example.anchorX) + example.memberRadius),
    ) + example.spacing;
  return {
    minX: example.anchorX - halfLength,
    maxX: example.anchorX + halfLength,
    minY:
      Math.min(
        example.anchorY - example.laneWidth / 2,
        ...positions.map(({ y }) => y - example.memberRadius),
      ) - example.spacing,
    maxY:
      Math.max(
        example.anchorY + example.laneWidth / 2,
        ...positions.map(({ y }) => y + example.memberRadius),
      ) + example.spacing,
  };
}

function frameNote(sample: ScalableFormationSample, example: ScalableFormationParameters): string {
  if (sample.clearance < 0)
    return sample.retainedShift > 0
      ? 'A scout joins and the wider wedge crosses the lane edges, so this layout cannot fit.'
      : 'The wedge crosses the lane edges, and the recipe keeps every slot despite the failed clearance check.';
  if (sample.step === 0)
    return 'The initial wedge fits the lane, leaving the next join to test its footprint.';
  if (sample.retainedShift > 0)
    return 'A scout joins and the wedge recentres, shifting existing targets to make room.';
  return sample.count === example.targetCount
    ? 'The completed patrol holds its wedge inside the lane, ready for a movement plan.'
    : 'The patrol holds its wedge inside the lane while it waits for another scout.';
}

function frameOf(
  sample: ScalableFormationSample,
  example: ScalableFormationParameters,
  bounds: MotionBounds,
  finalSample: ScalableFormationSample,
): StudyFrame {
  const anchor = anchorOf(example);
  const upperEdge = anchor.y - example.laneWidth / 2;
  const lowerEdge = anchor.y + example.laneWidth / 2;
  const wallInset = Math.max(example.spacing, (bounds.maxX - bounds.minX) / 8);
  return {
    seconds: sample.seconds,
    bodies: sample.positions.map((position, index) => ({
      id: `proposal-slot-${index}`,
      label:
        index === 0
          ? 'Tip'
          : index >= sample.count - 2
            ? index % 2 === 0
              ? 'Upper arm'
              : 'Lower arm'
            : undefined,
      ...position,
    })),
    marks: [
      ...sample.positions.map((position) => ({ ...position, shape: 'ring' as const })),
      { ...anchor, shape: 'cross', tone: 'other', label: 'Anchor' },
      {
        x: bounds.minX + wallInset,
        y: upperEdge,
        shape: 'dot',
        tone: 'actual',
        label: 'Upper edge',
      },
      {
        x: bounds.minX + wallInset,
        y: lowerEdge,
        shape: 'dot',
        tone: 'actual',
        label: 'Lower edge',
      },
    ],
    zones: sample.positions.map((position) => ({ ...position, radius: example.memberRadius })),
    links: [
      ...sample.positions.slice(1).map((position, index) => ({
        from: sample.positions[Math.max(0, index - 1)],
        to: position,
      })),
      ...[upperEdge, lowerEdge].map((y) => ({
        from: { x: bounds.minX + wallInset, y },
        to: { x: bounds.maxX - wallInset, y },
        tone: 'actual' as const,
      })),
    ],
    values: {
      seconds: fixed(sample.seconds),
      count: String(sample.count),
      targetCount: String(example.targetCount),
      initialCount: String(example.initialCount),
      finalWidth: fixed(finalSample.width),
      finalFitStatus: finalSample.clearance >= 0 ? 'fits the lane' : 'does not fit the lane',
      spacing: fixed(example.spacing),
      anchor: point(anchor),
      rawCentre: point(sample.rawCentre),
      offsets: namedPoints(sample.offsets),
      positions: namedPoints(sample.positions),
      retainedShift: fixed(sample.retainedShift),
      centreSpan: fixed(sample.centreSpan),
      memberRadius: fixed(example.memberRadius),
      width: fixed(sample.width),
      laneWidth: fixed(example.laneWidth),
      upperEdge: fixed(upperEdge),
      lowerEdge: fixed(lowerEdge),
      clearance: fixed(sample.clearance),
      fitStatus: sample.clearance >= 0 ? 'fits the lane' : 'does not fit the lane',
    },
    note: frameNote(sample, example),
    worked: workedStep(sample, example),
  };
}

function comparison(
  normal: readonly ScalableFormationSample[],
  example: ScalableFormationParameters,
): NonNullable<StudyModel['comparison']> {
  // Always compare different memberships, including when the reader requests the reference count.
  const referenceCount =
    example.targetCount === example.comparisonCount
      ? example.initialCount
      : example.comparisonCount;
  const reference = scalableFormationSamples(example, referenceCount);
  const normalLast = normal[normal.length - 1];
  const referenceLast = reference[reference.length - 1];
  const referenceFailure = reference.find(({ clearance }) => clearance < 0);
  const failed = referenceFailure ?? normal.find(({ clearance }) => clearance < 0);
  const failedRun = referenceFailure ? 'reference muster' : 'chosen muster';
  return {
    title: 'Membership changes the footprint, not the lane',
    intro: `Change only targetCount from ${example.targetCount} to ${referenceCount}. Both musters start with ${example.initialCount} scouts and use the same joining schedule, spacing ${fixed(example.spacing)}, body radius ${fixed(example.memberRadius)} and ${fixed(example.laneWidth)}-unit lane.`,
    timeline: {
      title: 'Transverse footprint, including body size',
      xLabel: 'Time · seconds',
      yLabel: 'Full width · units',
      seconds: normal.map(({ seconds }) => seconds),
      yRange: [
        0,
        Math.max(
          example.laneWidth,
          ...reference.map(({ width }) => width),
          ...normal.map(({ width }) => width),
        ) +
          2 * example.memberRadius,
      ],
      yTicks: [...new Set([0, normalLast.width, example.laneWidth, referenceLast.width])],
      reference: example.laneWidth,
      series: [
        {
          id: 'normal',
          label: `Solid green · request ${example.targetCount} scouts`,
          tone: 'actual',
          values: normal.map(({ width }) => width),
        },
        {
          id: 'reference',
          label: `Dashed amber · request ${referenceCount} scouts`,
          tone: 'desired',
          values: reference.map(({ width }) => width),
        },
      ],
      marks: failed
        ? [{ x: failed.seconds, y: failed.width, tone: referenceFailure ? 'desired' : 'actual' }]
        : [],
    },
    findings: [
      `The chosen muster ends with ${normalLast.count} scouts, width ${fixed(normalLast.width)} and minimum wall clearance ${fixed(normalLast.clearance)} units. The reference muster ends with ${referenceLast.count} scouts, width ${fixed(referenceLast.width)} and clearance ${fixed(referenceLast.clearance)} units.`,
      failed
        ? `The first failed proposal is at ${fixed(failed.seconds)} s with ${failed.count} scouts in the ${failedRun}: centre span ${fixed(failed.centreSpan)} + 2 × radius ${fixed(example.memberRadius)} = width ${fixed(failed.width)}, exceeding the lane by ${fixed(failed.width - example.laneWidth)} units. No sideways translation can fit an envelope wider than the lane.`
        : 'Every proposed layout in both musters fits this lane; these memberships do not expose a clearance failure.',
      'The engine generates both layouts. Choosing a narrower pattern or splitting the patrol requires another planning decision; scalability alone supplies neither.',
    ],
    note: 'The horizontal reference is lane width; a dot marks the first failed layout when either muster outgrows the lane. Lines join fixed-time samples. Membership and layout change immediately at joining samples, with no simulated movement or interpolation.',
  };
}

export const model = (parameters: StudyParameters): StudyModel => {
  const example = readParameters(parameters);
  const samples = scalableFormationSamples(example);
  const bounds = boundsOf(samples, example);
  const fullStep =
    example.joinStart + (example.targetCount - example.initialCount - 1) * example.joinInterval;
  return {
    motion: {
      bounds,
      frames: samples.map((sample) =>
        frameOf(sample, example, bounds, samples[samples.length - 1]),
      ),
    },
    timeline: {
      title: 'The muster’s full width as scouts join',
      xLabel: 'Time · seconds',
      yLabel: 'Full width · units',
      seconds: samples.map(({ seconds }) => seconds),
      yRange: [
        0,
        Math.max(example.laneWidth, ...samples.map(({ width }) => width)) +
          2 * example.memberRadius,
      ],
      yTicks: [
        ...new Set([0, samples[0].width, samples[samples.length - 1].width, example.laneWidth]),
      ],
      reference: example.laneWidth,
      series: [
        {
          id: 'width',
          label: 'Solid green · full proposed footprint',
          tone: 'actual',
          values: samples.map(({ width }) => width),
        },
      ],
    },
    initialStep: fullStep,
    moments: [
      { label: 'Initial patrol', step: 0 },
      { label: 'An incomplete new row', step: example.joinStart },
      { label: 'Requested patrol complete', step: fullStep },
      { label: 'Muster assessed', step: example.steps },
    ].filter(
      (moment, index, moments) => moments.findIndex(({ step }) => step === moment.step) === index,
    ),
    legend: [
      { tone: 'subject', label: 'Dots · proposed member centres' },
      { tone: 'target', label: 'Rings · generated destinations' },
      { tone: 'zone', label: 'Circles · physical member radius' },
      { tone: 'other', label: 'Cross · stationary anchor' },
      { tone: 'actual', label: 'Green edges · lane limits; chart reference · lane width' },
      { tone: 'muted', label: 'Links · successive slots on each wedge arm' },
    ],
    caption:
      'Tip leads the labelled arms, while Anchor stays on the lane centre line. Dots already occupy their proposed rings; surrounding circles include body size in the clearance check. A joining scout can shift every existing target.',
    comparison: comparison(samples, example),
    inputs,
  };
};

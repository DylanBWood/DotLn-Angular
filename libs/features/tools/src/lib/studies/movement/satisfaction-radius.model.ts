import type { StudyParameters } from '@dotln-angular/models';

import { numberParameter } from '../parameters';
import type { MotionFrame, MotionStudyModel } from '../study-model';

export interface SatisfactionRadiusParameters {
  readonly start: number;
  readonly target: number;
  readonly speed: number;
  readonly satisfactionRadius: number;
  readonly timeStep: number;
  readonly steps: number;
  readonly comparisonRadius: number;
}

export interface SatisfactionRadiusStep {
  readonly offset: number;
  readonly distance: number;
  readonly accepted: boolean;
  readonly velocity: number;
  readonly nextPosition: number;
}

export interface SatisfactionRadiusSample extends SatisfactionRadiusStep {
  readonly position: number;
}

const readParameters = (parameters: StudyParameters): SatisfactionRadiusParameters => ({
  start: numberParameter(parameters, 'start'),
  target: numberParameter(parameters, 'target'),
  speed: numberParameter(parameters, 'speed'),
  satisfactionRadius: numberParameter(parameters, 'satisfactionRadius'),
  timeStep: numberParameter(parameters, 'timeStep'),
  steps: numberParameter(parameters, 'steps'),
  comparisonRadius: numberParameter(parameters, 'comparisonRadius'),
});

/** A local tolerance check gates direct movement; the engine exposes acceleration steering. */
export function calculateSatisfactionRadiusStep(
  position: number,
  example: SatisfactionRadiusParameters,
  radius = example.satisfactionRadius,
): SatisfactionRadiusStep {
  const offset = example.target - position;
  const distance = Math.abs(offset);
  const accepted = distance <= radius;
  const velocity = accepted ? 0 : Math.sign(offset) * example.speed;

  return {
    offset,
    distance,
    accepted,
    velocity,
    nextPosition: position + velocity * example.timeStep,
  };
}

export function satisfactionRadiusSamples(
  example: SatisfactionRadiusParameters,
  radius = example.satisfactionRadius,
): readonly SatisfactionRadiusSample[] {
  const samples: SatisfactionRadiusSample[] = [];
  let position = example.start;

  for (let step = 0; step <= example.steps; step++) {
    const calculation = calculateSatisfactionRadiusStep(position, example, radius);
    samples.push({ position, ...calculation });
    position = calculation.nextPosition;
  }

  return samples;
}

const fixed = (value: number) => value.toFixed(3);

function frameOf(
  sample: SatisfactionRadiusSample,
  step: number,
  example: SatisfactionRadiusParameters,
): MotionFrame {
  return {
    seconds: step * example.timeStep,
    bodies: [{ id: 'shelf-runner', x: sample.position, y: 0 }],
    vectors: [
      {
        x: sample.position,
        y: 0,
        dx: sample.nextPosition - sample.position,
        dy: 0,
        tone: 'actual',
      },
    ],
    marks: [{ x: example.target, y: 0, shape: 'cross' }],
    zones: [{ x: example.target, y: 0, radius: example.satisfactionRadius, tone: 'zone' }],
    values: {
      start: fixed(example.start),
      target: fixed(example.target),
      speed: fixed(example.speed),
      satisfactionRadius: fixed(example.satisfactionRadius),
      comparisonRadius: fixed(example.comparisonRadius),
      timeStep: fixed(example.timeStep),
      steps: String(example.steps),
      position: fixed(sample.position),
      distance: fixed(sample.distance),
      velocity: fixed(sample.velocity),
      nextPosition: fixed(sample.nextPosition),
      stride: fixed(example.speed * example.timeStep),
      accepted: sample.accepted ? 'accepted' : 'outside the accepted region',
      lowerEdge: fixed(example.target - example.satisfactionRadius),
      upperEdge: fixed(example.target + example.satisfactionRadius),
    },
    note: sample.accepted
      ? 'The runner is in the accepted region, including its boundary. It stops at this position and keeps the remaining error.'
      : 'The runner is outside the region. It takes a full stride towards the marker; this tolerance check does not taper speed.',
    worked: {
      title: `Shelf-runner decision at ${fixed(step * example.timeStep)} seconds`,
      lines: [
        `Distance = |${fixed(example.target)} − ${fixed(sample.position)}| = ${fixed(sample.distance)} units.`,
        `${fixed(sample.distance)} ≤ ${fixed(example.satisfactionRadius)} is ${sample.accepted ? 'true' : 'false'}.`,
        sample.accepted
          ? 'Accept the position and assign velocity 0; do not snap onto the marker.'
          : `Assign velocity sign(${fixed(sample.offset)}) × ${fixed(example.speed)} = ${fixed(sample.velocity)} units/s.`,
        `Next position = ${fixed(sample.position)} + ${fixed(sample.velocity)} × ${fixed(example.timeStep)} = ${fixed(sample.nextPosition)}.`,
      ],
      note: 'The threshold decides whether movement runs. This model can set velocity to zero immediately.',
    },
  };
}

function summaryOf(samples: readonly SatisfactionRadiusSample[]) {
  const firstAccepted = samples.findIndex((sample) => sample.accepted);
  const last = samples[samples.length - 1];

  return firstAccepted >= 0
    ? `accepts position ${fixed(samples[firstAccepted].position)} and keeps ${fixed(samples[firstAccepted].distance)} units of error`
    : `never accepts a sampled position and ends ${fixed(last.distance)} units from the marker`;
}

export const model = (parameters: StudyParameters): MotionStudyModel => {
  const example = readParameters(parameters);
  const samples = satisfactionRadiusSamples(example);
  const compared = satisfactionRadiusSamples(example, example.comparisonRadius);
  const seconds = samples.map((_sample, step) => step * example.timeStep);
  const firstAccepted = samples.findIndex((sample) => sample.accepted);
  const selected =
    firstAccepted < 0 ? Math.min(example.steps, Math.floor(example.steps / 2)) : firstAccepted;
  const positions = samples.flatMap((sample) => [sample.position, sample.nextPosition]);
  const reach = Math.max(example.satisfactionRadius, 1);
  const same = example.satisfactionRadius === example.comparisonRadius;

  return {
    family: 'motion',
    motion: {
      bounds: {
        minX: Math.min(...positions, example.target - reach) - 1,
        maxX: Math.max(...positions, example.target + reach) + 1,
        minY: -reach - 1,
        maxY: reach + 1,
      },
      frames: samples.map((sample, step) => frameOf(sample, step, example)),
      trail: true,
    },
    timeline: {
      title: 'Remaining distance and the accepted boundary',
      xLabel: 'Time · seconds',
      yLabel: 'Distance · units',
      seconds,
      reference: example.satisfactionRadius,
      yRange: [
        0,
        Math.max(example.satisfactionRadius, ...samples.map((sample) => sample.distance), 1),
      ],
      series: [
        {
          id: 'distance',
          label: 'Solid green · remaining distance',
          tone: 'actual',
          values: samples.map((sample) => sample.distance),
        },
        {
          id: 'radius',
          label: 'Dashed amber · satisfaction radius',
          tone: 'desired',
          values: samples.map(() => example.satisfactionRadius),
        },
      ],
    },
    initialStep: selected,
    moments: [
      { label: 'Start', step: 0 },
      { label: 'Before the decision', step: Math.max(0, selected - 1) },
      { label: firstAccepted < 0 ? 'Still outside' : 'Place accepted', step: selected },
      { label: 'Run end', step: example.steps },
    ],
    legend: [
      { tone: 'subject', label: 'Dot · shelf runner' },
      { tone: 'actual', label: 'Solid green · next displacement' },
      { tone: 'zone', label: 'Circle · accepted region' },
      { tone: 'target', label: 'Cross · pickup marker' },
    ],
    caption:
      'The circle is the set of accepted places around the pickup marker. The runner travels along its diameter. The vector ends at the next sampled position; after acceptance it has zero length, even though the dot need not coincide with the cross.',
    comparison: {
      title: 'Demanding an exact landing',
      intro: `Only the satisfaction radius changes: ${fixed(example.satisfactionRadius)} units versus ${fixed(example.comparisonRadius)} units. The marker, starting place and ${fixed(example.speed * example.timeStep)}-unit stride stay the same.`,
      timeline: {
        title: 'Position around the pickup marker',
        xLabel: 'Time · seconds',
        yLabel: 'Position · units',
        seconds,
        reference: example.target,
        series: [
          {
            id: 'tolerance',
            label: `Solid green · radius ${fixed(example.satisfactionRadius)}`,
            tone: 'actual',
            values: samples.map((sample) => sample.position),
          },
          {
            id: 'comparison',
            label: `Dashed amber · radius ${fixed(example.comparisonRadius)}`,
            tone: 'desired',
            values: compared.map((sample) => sample.position),
          },
        ],
      },
      findings: same
        ? ['Both radii are equal, so the comparison runs coincide.']
        : [
            `The main run ${summaryOf(samples)}. The changed run ${summaryOf(compared)}.`,
            'The decision is made only at sampled positions. Passing through the region between updates does not count as acceptance in this mechanism.',
          ],
      note: 'A tolerance is a choice of acceptable error. It cannot supply braking or make an unreachable exact landing possible.',
    },
    inputs: [
      {
        name: 'satisfactionRadius',
        label: 'Satisfaction radius',
        unit: 'units',
        min: 0,
        max: 2,
        step: 0.1,
      },
    ],
  };
};

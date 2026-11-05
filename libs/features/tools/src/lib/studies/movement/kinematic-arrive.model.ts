import type { StudyParameters } from '@dotln-angular/models';

import { numberParameter } from '../parameters';
import type { MotionFrame, MotionStudyModel } from '../study-model';

export interface KinematicArriveParameters {
  readonly start: number;
  readonly target: number;
  readonly maxSpeed: number;
  readonly timeToTarget: number;
  readonly satisfactionRadius: number;
  readonly timeStep: number;
  readonly steps: number;
  readonly shortTimeToTarget: number;
}

export interface KinematicArriveStep {
  readonly offset: number;
  readonly distance: number;
  readonly requestedVelocity: number;
  readonly velocity: number;
  readonly accepted: boolean;
  readonly nextPosition: number;
}

export interface KinematicArriveSample extends KinematicArriveStep {
  readonly position: number;
}

const readParameters = (parameters: StudyParameters): KinematicArriveParameters => ({
  start: numberParameter(parameters, 'start'),
  target: numberParameter(parameters, 'target'),
  maxSpeed: numberParameter(parameters, 'maxSpeed'),
  timeToTarget: numberParameter(parameters, 'timeToTarget'),
  satisfactionRadius: numberParameter(parameters, 'satisfactionRadius'),
  timeStep: numberParameter(parameters, 'timeStep'),
  steps: numberParameter(parameters, 'steps'),
  shortTimeToTarget: numberParameter(parameters, 'shortTimeToTarget'),
});

/** Direct velocity assignment is local: the public engine's arrive returns acceleration. */
export function calculateKinematicArriveStep(
  position: number,
  example: KinematicArriveParameters,
  timeToTarget = example.timeToTarget,
): KinematicArriveStep {
  const offset = example.target - position;
  const distance = Math.abs(offset);
  const accepted = distance <= example.satisfactionRadius;
  const requestedVelocity = accepted ? 0 : offset / timeToTarget;
  const velocity = Math.max(-example.maxSpeed, Math.min(example.maxSpeed, requestedVelocity));

  return {
    offset,
    distance,
    requestedVelocity,
    velocity,
    accepted,
    nextPosition: position + velocity * example.timeStep,
  };
}

/** Each sample shows the position now and the velocity assigned for the next interval. */
export function kinematicArriveSamples(
  example: KinematicArriveParameters,
  timeToTarget = example.timeToTarget,
): readonly KinematicArriveSample[] {
  const samples: KinematicArriveSample[] = [];
  let position = example.start;

  for (let step = 0; step <= example.steps; step++) {
    const calculation = calculateKinematicArriveStep(position, example, timeToTarget);
    samples.push({ position, ...calculation });
    position = calculation.nextPosition;
  }

  return samples;
}

const fixed = (value: number) => value.toFixed(3);

function frameOf(
  sample: KinematicArriveSample,
  step: number,
  example: KinematicArriveParameters,
): MotionFrame {
  const taperDistance = example.maxSpeed * example.timeToTarget;
  const displacement = sample.nextPosition - sample.position;
  const note = sample.accepted
    ? 'The trolley accepts its current place and sets velocity to zero. It is not snapped onto the marker.'
    : Math.abs(sample.requestedVelocity) > example.maxSpeed
      ? 'The requested velocity exceeds the speed cap, so the trolley travels at its maximum speed.'
      : 'The speed cap is inactive: less remaining distance now produces a smaller assigned velocity.';

  return {
    seconds: step * example.timeStep,
    bodies: [{ id: 'trolley', x: sample.position, y: 0 }],
    vectors: [{ x: sample.position, y: 0, dx: displacement, dy: 0, tone: 'actual' }],
    zones: [
      { x: example.target, y: 0, radius: taperDistance, tone: 'zone' },
      { x: example.target, y: 0, radius: example.satisfactionRadius, tone: 'target' },
    ],
    marks: [{ x: example.target, y: 0, shape: 'cross' }],
    values: {
      start: fixed(example.start),
      target: fixed(example.target),
      maxSpeed: fixed(example.maxSpeed),
      timeToTarget: fixed(example.timeToTarget),
      shortTimeToTarget: fixed(example.shortTimeToTarget),
      satisfactionRadius: fixed(example.satisfactionRadius),
      timeStep: fixed(example.timeStep),
      steps: String(example.steps),
      position: fixed(sample.position),
      distance: fixed(sample.distance),
      velocity: fixed(sample.velocity),
      speed: fixed(Math.abs(sample.velocity)),
      displacement: fixed(displacement),
      nextPosition: fixed(sample.nextPosition),
      taperDistance: fixed(taperDistance),
      accepted: sample.accepted ? 'accepted' : 'outside the accepted region',
      errorFactor: fixed(1 - example.timeStep / example.timeToTarget),
    },
    note,
    worked: {
      title: `Trolley update at ${fixed(step * example.timeStep)} seconds`,
      lines: sample.accepted
        ? [
            `Distance = |${fixed(example.target)} − ${fixed(sample.position)}| = ${fixed(sample.distance)} units.`,
            `${fixed(sample.distance)} ≤ ${fixed(example.satisfactionRadius)}: accept this place and assign velocity 0.`,
            `Next position = ${fixed(sample.position)} + 0 × ${fixed(example.timeStep)} = ${fixed(sample.nextPosition)}.`,
          ]
        : [
            `Offset = ${fixed(example.target)} − ${fixed(sample.position)} = ${fixed(sample.offset)} units.`,
            `Distance ${fixed(sample.distance)} > satisfaction radius ${fixed(example.satisfactionRadius)}: keep moving.`,
            `Requested velocity = ${fixed(sample.offset)} / ${fixed(example.timeToTarget)} = ${fixed(sample.requestedVelocity)} units/s.`,
            `Limit that velocity to ±${fixed(example.maxSpeed)}: use ${fixed(sample.velocity)} units/s.`,
            `Next position = ${fixed(sample.position)} + ${fixed(sample.velocity)} × ${fixed(example.timeStep)} = ${fixed(sample.nextPosition)}.`,
          ],
      note: 'Velocity changes immediately in this kinematic model; there is no acceleration state.',
    },
  };
}

function summaryOf(samples: readonly KinematicArriveSample[]) {
  const last = samples[samples.length - 1];
  const crossed = samples
    .slice(1)
    .some((sample, index) => sample.offset * samples[index].offset < 0);

  return last.accepted
    ? `stops with ${fixed(last.distance)} units of remaining error`
    : `${crossed ? 'crosses the marker and ' : ''}has not reached the accepted region by the end of this run`;
}

export const model = (parameters: StudyParameters): MotionStudyModel => {
  const example = readParameters(parameters);
  const samples = kinematicArriveSamples(example);
  const short = kinematicArriveSamples(example, example.shortTimeToTarget);
  const seconds = samples.map((_sample, step) => step * example.timeStep);
  const taperDistance = example.maxSpeed * example.timeToTarget;
  const positions = samples.flatMap((sample) => [sample.position, sample.nextPosition]);
  const reach = Math.max(taperDistance, example.satisfactionRadius, 1);
  const firstTaper = samples.findIndex(
    (sample) => !sample.accepted && Math.abs(sample.velocity) < example.maxSpeed,
  );
  const firstAccepted = samples.findIndex((sample) => sample.accepted);
  const selected = firstTaper < 0 ? Math.min(1, example.steps) : firstTaper;
  const same = example.timeToTarget === example.shortTimeToTarget;

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
      title: 'Velocity assigned for the next update',
      xLabel: 'Time · seconds',
      yLabel: 'Velocity · units/s',
      seconds,
      yRange: [-example.maxSpeed, example.maxSpeed],
      reference: 0,
      series: [
        {
          id: 'velocity',
          label: 'Solid green · assigned velocity',
          tone: 'actual',
          values: samples.map((sample) => sample.velocity),
        },
      ],
    },
    initialStep: selected,
    moments: [
      { label: 'Start', step: 0 },
      { label: firstTaper < 0 ? 'Inspect approach' : 'Velocity tapers', step: selected },
      {
        label: firstAccepted < 0 ? 'Still approaching' : 'Place accepted',
        step: firstAccepted < 0 ? example.steps : firstAccepted,
      },
      { label: 'Run end', step: example.steps },
    ],
    legend: [
      { tone: 'actual', label: 'Solid green · next displacement' },
      { tone: 'zone', label: 'Outer circle · speed begins to taper' },
      { tone: 'target', label: 'Inner circle and cross · accepted region and marker' },
    ],
    caption:
      'The dot is the archive trolley and the cross is its charging marker. The green vector ends at the next position. The outer circle is derived from maximum speed × time to target; only the inner circle accepts a stop.',
    comparison: {
      title: 'A response time shorter than an update',
      intro: `Only time to target changes, from ${fixed(example.timeToTarget)} s to ${fixed(example.shortTimeToTarget)} s. Both runs use ${fixed(example.timeStep)} s updates and the same speed cap and satisfaction radius.`,
      timeline: {
        title: 'Position near the charging marker',
        xLabel: 'Time · seconds',
        yLabel: 'Position · units',
        seconds,
        reference: example.target,
        series: [
          {
            id: 'normal',
            label: `Solid green · time to target ${fixed(example.timeToTarget)} s`,
            tone: 'actual',
            values: samples.map((sample) => sample.position),
          },
          {
            id: 'short',
            label: `Dashed amber · time to target ${fixed(example.shortTimeToTarget)} s`,
            tone: 'desired',
            values: short.map((sample) => sample.position),
          },
        ],
      },
      findings: same
        ? ['Both response times are equal, so the comparison runs coincide.']
        : [
            `The main run ${summaryOf(samples)}; the changed run ${summaryOf(short)}.`,
            `Where the speed cap is inactive and the place is not accepted, the next signed error is the current error × (1 − dt / timeToTarget). That multiplier is ${fixed(1 - example.timeStep / example.shortTimeToTarget)} in the changed run. The speed cap limits velocity, but does not guarantee arrival.`,
          ],
      note: 'The chart joins sampled positions. A crossing between samples is not an accepted stop.',
    },
    inputs: [
      { name: 'timeToTarget', label: 'Time to target', unit: 's', min: 0.2, max: 2, step: 0.1 },
      {
        name: 'satisfactionRadius',
        label: 'Satisfaction radius',
        unit: 'units',
        min: 0,
        max: 1,
        step: 0.05,
      },
    ],
  };
};

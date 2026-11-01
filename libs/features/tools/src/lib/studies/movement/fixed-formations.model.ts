import type { StudyParameters } from '@dotln-angular/models';
import {
  advanceFormation,
  cosine,
  createSimulation,
  distance,
  type FormationState,
  length,
  patternSlots,
  sine,
  slotPosition,
  subtract,
  type Vec2,
} from '@dotln-angular/scene-engine';

import { numberParameter } from '../parameters';
import type { StudyFrame, StudyInput, StudyModel, StudyWorkedStep } from '../study-model';

export interface FixedFormationParameters {
  readonly members: number;
  readonly leaderX: number;
  readonly leaderY: number;
  readonly spacing: number;
  readonly turnDegrees: number;
  readonly turnStart: number;
  readonly turnSteps: number;
  readonly fastTurnSteps: number;
  readonly speedLimit: number;
  readonly timeStep: number;
  readonly steps: number;
}

export interface FixedFormationSample {
  readonly step: number;
  readonly seconds: number;
  readonly angleDegrees: number;
  readonly angleRadians: number;
  readonly formation: FormationState;
  readonly targets: readonly Vec2[];
  readonly previousTargets: readonly Vec2[];
  readonly displacement: number;
  readonly requiredSpeed: number;
}

const readParameters = (parameters: StudyParameters): FixedFormationParameters => ({
  members: numberParameter(parameters, 'members'),
  leaderX: numberParameter(parameters, 'leaderX'),
  leaderY: numberParameter(parameters, 'leaderY'),
  spacing: numberParameter(parameters, 'spacing'),
  turnDegrees: numberParameter(parameters, 'turnDegrees'),
  turnStart: numberParameter(parameters, 'turnStart'),
  turnSteps: numberParameter(parameters, 'turnSteps'),
  fastTurnSteps: numberParameter(parameters, 'fastTurnSteps'),
  speedLimit: numberParameter(parameters, 'speedLimit'),
  timeStep: numberParameter(parameters, 'timeStep'),
  steps: numberParameter(parameters, 'steps'),
});

const fixed = (value: number) => Number(value.toFixed(2)).toFixed(2);
const point = ({ x, y }: Vec2) => `(${fixed(x)}, ${fixed(y)})`;
const namedPoints = (points: readonly Vec2[]) =>
  points.map((position, index) => `slot ${index + 1} ${point(position)}`).join('; ');

const spacingInput: StudyInput = {
  name: 'spacing',
  label: 'Slot spacing',
  unit: 'units',
  min: 3,
  max: 6,
  step: 0.5,
};
const turnInput: StudyInput = {
  name: 'turnSteps',
  label: 'Turn duration',
  unit: 'frames',
  min: 2,
  max: 30,
  step: 1,
};

/** The same rebasing used by the scene's fixed-formation interpreter. */
export function fixedOffsets(example: FixedFormationParameters): readonly Vec2[] {
  const centred = patternSlots('wedge', example.members, example.spacing);
  return centred.map((slot) => subtract(slot, centred[0]));
}

/** Generate destinations only: no guard integration or speed clamp is hidden in this run. */
export function fixedFormationSamples(
  example: FixedFormationParameters,
  turnSteps = example.turnSteps,
): readonly FixedFormationSample[] {
  const anchor = { x: example.leaderX, y: example.leaderY };
  const slots = fixedOffsets(example);
  // Only advanceFormation reads this leader; no scene ticks or field boundaries are applied.
  const leader = createSimulation({
    id: 'lantern-court',
    sceneType: 'units-on-terrain',
    field: { width: 0, height: 0 },
    seed: 0,
    units: [
      {
        id: 'mira',
        labels: { name: 'Mira' },
        unitClass: 'escort',
        position: anchor,
        heading: { x: 1, y: 0 },
        velocity: { x: 0, y: 0 },
        maxSpeed: 0,
        maxAcceleration: 0,
        radius: 0,
      },
    ],
  }).units[0];
  const initial: FormationState = {
    kind: 'fixed',
    slots,
    assignment: slots.map((_slot, index) => ({
      unitId: index === 0 ? 'mira' : `escort-${index}`,
      slot: index,
      slotRole: 'escort',
      cost: 0,
    })),
    anchor,
    anchorVelocity: { x: 0, y: 0 },
    heading: leader.heading,
    anchorSpeed: 0,
    lagLimit: 0,
    leader: leader.id,
  };
  const samples: FixedFormationSample[] = [];
  for (let step = 0; step <= example.steps; step++) {
    const progress = Math.max(0, Math.min(1, (step - example.turnStart) / turnSteps));
    const angleDegrees = example.turnDegrees * progress;
    const angleRadians = (angleDegrees * Math.PI) / 180;
    const heading = { x: cosine(angleRadians), y: sine(angleRadians) };
    const formation = advanceFormation(initial, [{ ...leader, heading }], null, example.timeStep);
    const targets = slots.map((_slot, index) => slotPosition(formation, index));
    const previousTargets = samples.at(-1)?.targets ?? targets;
    const displacement = Math.max(
      ...targets.slice(1).map((target, index) => distance(target, previousTargets[index + 1])),
    );
    samples.push({
      step,
      seconds: step * example.timeStep,
      angleDegrees,
      angleRadians,
      formation,
      targets,
      previousTargets,
      displacement,
      requiredSpeed: displacement / example.timeStep,
    });
  }
  return samples;
}

function workedStep(
  sample: FixedFormationSample,
  example: FixedFormationParameters,
): StudyWorkedStep {
  const offset = sample.formation.slots[1];
  const { x: forwardX, y: forwardY } = sample.formation.heading;
  const { anchor } = sample.formation;
  const target = sample.targets[1];
  const previous = sample.previousTargets[1];
  const delta = subtract(target, previous);
  return {
    title: `Mira's pivot at ${fixed(sample.seconds)} seconds`,
    lines: [
      `Keep slot 1 at local offset ${point(offset)}; Mira is at ${point(anchor)}.`,
      `The scheduled heading is ${fixed(sample.angleDegrees)}°; forward = (${fixed(forwardX)}, ${fixed(forwardY)}). The engine copies this heading without smoothing.`,
      `slotX = ${fixed(anchor.x)} + (${fixed(offset.x)} × ${fixed(forwardX)}) − (${fixed(offset.y)} × ${fixed(forwardY)}) ≈ ${fixed(target.x)}.`,
      `slotY = ${fixed(anchor.y)} + (${fixed(offset.x)} × ${fixed(forwardY)}) + (${fixed(offset.y)} × ${fixed(forwardX)}) ≈ ${fixed(target.y)}.`,
      `Slot 1 moves from ${point(previous)} to ${point(target)}: Δ = ${point(delta)}; chord length = √(${fixed(delta.x)}² + ${fixed(delta.y)}²) ≈ ${fixed(distance(target, previous))} units.`,
      `Largest escort chord / frame interval = ${fixed(sample.displacement)} / ${fixed(example.timeStep)} ≈ ${fixed(sample.requiredSpeed)} units/s; compare with ${fixed(example.speedLimit)} units/s.`,
    ],
    note:
      sample.step === 0
        ? 'This is the initial layout, so there is no preceding interval; its displayed displacement is zero. Calculations retain full precision before rounding.'
        : 'The displacement ends at the selected moment. It is a lower bound on travel speed: following the circular arc requires a little more distance. Calculations retain full precision before rounding.',
  };
}

function frameNote(
  sample: FixedFormationSample,
  example: FixedFormationParameters,
  peakSpeed: number,
): string {
  if (sample.step <= example.turnStart)
    return 'Mira holds the escort slots behind her, ready to turn them as one shape.';
  if (sample.step <= example.turnStart + example.turnSteps)
    return sample.requiredSpeed > example.speedLimit
      ? 'Mira turns in place, sweeping the escort slots faster than the guards can reach them.'
      : "Mira turns in place and her escort slots swing together within the guards' speed budget.";
  return peakSpeed > example.speedLimit
    ? 'Mira and the slots are still again, although the pivot demanded more speed than the guards had.'
    : 'Mira stops turning and the escort slots stop with her, keeping their original offsets.';
}

function frameOf(
  sample: FixedFormationSample,
  example: FixedFormationParameters,
  peakSpeed: number,
): StudyFrame {
  const { anchor, slots } = sample.formation;
  const escorts = sample.targets.slice(1);
  const preceding = sample.previousTargets.slice(1);
  const orbitRadius = Math.max(...slots.map(length));
  return {
    seconds: sample.seconds,
    bodies: [{ id: 'mira', label: 'Mira', ...anchor, heading: sample.angleRadians }],
    marks: [
      ...preceding.map((position) => ({
        ...position,
        shape: 'dot' as const,
        tone: 'muted' as const,
      })),
      ...escorts.map((position, index) => ({
        ...position,
        shape: 'ring' as const,
        label: `Slot ${index + 1}`,
      })),
    ],
    zones: [{ ...anchor, radius: orbitRadius }],
    links: escorts.map((target) => ({ from: anchor, to: target })),
    vectors: escorts.map((target, index) => {
      const delta = subtract(target, preceding[index]);
      return { ...preceding[index], dx: delta.x, dy: delta.y, tone: 'desired' };
    }),
    values: {
      members: String(example.members),
      spacing: fixed(example.spacing),
      fastTurnDuration: fixed(example.fastTurnSteps * example.timeStep),
      peakSpeed: fixed(peakSpeed),
      runSpeedStatus:
        peakSpeed > example.speedLimit ? 'over the sampled budget' : 'within the sampled budget',
      seconds: fixed(sample.seconds),
      anchor: point(anchor),
      localSlots: namedPoints(slots.slice(1)),
      targets: namedPoints(escorts),
      previousTargets: namedPoints(preceding),
      angle: fixed(sample.angleDegrees),
      turnDegrees: fixed(example.turnDegrees),
      turnDuration: fixed(example.turnSteps * example.timeStep),
      orbitRadius: fixed(orbitRadius),
      displacement: fixed(sample.displacement),
      requiredSpeed: fixed(sample.requiredSpeed),
      timeStep: fixed(example.timeStep),
      speedLimit: fixed(example.speedLimit),
      speedStatus: sample.requiredSpeed > example.speedLimit ? 'over budget' : 'within budget',
    },
    note: frameNote(sample, example, peakSpeed),
    worked: workedStep(sample, example),
  };
}

function comparison(
  normal: readonly FixedFormationSample[],
  example: FixedFormationParameters,
): NonNullable<StudyModel['comparison']> {
  const fast = fixedFormationSamples(example, example.fastTurnSteps);
  const normalPeak = Math.max(...normal.map(({ requiredSpeed }) => requiredSpeed));
  const fastPeak = Math.max(...fast.map(({ requiredSpeed }) => requiredSpeed));
  const firstOver = fast.find(({ requiredSpeed }) => requiredSpeed > example.speedLimit);
  const fastMove = fast[example.turnStart + 1];
  return {
    title: 'The same pivot, completed sooner',
    intro: `Change only turnSteps from ${example.turnSteps} to ${example.fastTurnSteps}: the heading change still totals ${fixed(example.turnDegrees)}°, while Mira stays still. Spacing, frame interval and the guard speed budget stay the same.`,
    timeline: {
      title: 'Minimum speed needed to reach each sampled escort target',
      xLabel: 'Time · seconds',
      yLabel: 'Required speed · units/s',
      seconds: normal.map(({ seconds }) => seconds),
      yRange: [0, Math.max(normalPeak, fastPeak, example.speedLimit)],
      yTicks: [...new Set([0, example.speedLimit, Math.max(normalPeak, fastPeak)])],
      reference: example.speedLimit,
      series: [
        {
          id: 'normal',
          label: `Solid green · turn over ${fixed(example.turnSteps * example.timeStep)} s`,
          tone: 'actual',
          values: normal.map(({ requiredSpeed }) => requiredSpeed),
        },
        {
          id: 'fast',
          label: `Dashed amber · turn over ${fixed(example.fastTurnSteps * example.timeStep)} s`,
          tone: 'desired',
          values: fast.map(({ requiredSpeed }) => requiredSpeed),
        },
      ],
    },
    findings: [
      `The chosen turn peaks at ${fixed(normalPeak)} units/s; the shorter turn peaks at ${fixed(fastPeak)} units/s against a budget of ${fixed(example.speedLimit)} units/s.${firstOver ? ` The shorter run first exceeds it at ${fixed(firstOver.seconds)} s.` : ' The shorter run stays within this sampled budget.'}`,
      `The first changed sample of the shorter run moves the escort targets by ${fixed(fastMove.displacement)} units: ${fixed(fastMove.displacement)} / ${fixed(example.timeStep)} = ${fixed(fastMove.requiredSpeed)} units/s.`,
      firstOver
        ? 'The generator still returns every target. A real guard limited to the budget cannot occupy every requested position in the shorter run; a controller must slow the turn or allow formation error.'
        : 'The generator still returns every target. Passing this sampled speed check leaves acceleration and terrain constraints unresolved.',
    ],
    note: 'The horizontal reference is the guard speed budget. Lines join sampled demands; neither curve represents actual guard velocity.',
  };
}

export const model = (parameters: StudyParameters): StudyModel => {
  const example = readParameters(parameters);
  const samples = fixedFormationSamples(example);
  const peakSpeed = Math.max(...samples.map(({ requiredSpeed }) => requiredSpeed));
  // Keep the scale steady across the spacing slider so a wider escort looks wider.
  const drawingSpacing = Math.max(example.spacing, spacingInput.max);
  const radius = Math.max(...fixedOffsets({ ...example, spacing: drawingSpacing }).map(length));
  const extent = radius + drawingSpacing;
  const finish = example.turnStart + example.turnSteps;
  return {
    motion: {
      bounds: {
        minX: example.leaderX - extent,
        maxX: example.leaderX + extent,
        minY: example.leaderY - extent,
        maxY: example.leaderY + extent,
      },
      frames: samples.map((sample) => frameOf(sample, example, peakSpeed)),
    },
    timeline: {
      title: 'Escort target demand during Mira’s pivot',
      xLabel: 'Time · seconds',
      yLabel: 'Required speed · units/s',
      seconds: samples.map(({ seconds }) => seconds),
      yRange: [
        0,
        Math.max(example.speedLimit, ...samples.map(({ requiredSpeed }) => requiredSpeed)),
      ],
      yTicks: [...new Set([0, example.speedLimit, peakSpeed])],
      reference: example.speedLimit,
      series: [
        {
          id: 'required',
          label: 'Solid green · largest sampled escort speed demand',
          tone: 'actual',
          values: samples.map(({ requiredSpeed }) => requiredSpeed),
        },
      ],
    },
    initialStep: example.turnStart + Math.ceil(example.turnSteps / 2),
    moments: [
      { label: 'Offsets at rest', step: 0 },
      { label: 'First turn sample', step: example.turnStart + 1 },
      { label: 'Mid-turn', step: example.turnStart + Math.ceil(example.turnSteps / 2) },
      { label: 'Turn completed', step: finish },
      { label: 'Targets still again', step: Math.min(finish + 1, example.steps) },
    ].filter(
      (moment, index, moments) => moments.findIndex(({ step }) => step === moment.step) === index,
    ),
    legend: [
      { tone: 'subject', label: 'Leader arrow · Mira' },
      { tone: 'target', label: 'Rings · escort destinations' },
      { tone: 'muted', label: 'Dots · preceding destinations; spokes · fixed offsets' },
      { tone: 'desired', label: 'Arrows · one sampled displacement' },
      { tone: 'zone', label: 'Circular guide · outer slot distance from Mira' },
    ],
    caption:
      'Mira leads the named escort rings; spokes keep their offsets tied to her heading. Arrows join each preceding target to its current position, and the circle shows their distance from Mira. The chart checks sampled target demand against the guard speed budget.',
    comparison: comparison(samples, example),
    inputs: [turnInput, spacingInput],
  };
};

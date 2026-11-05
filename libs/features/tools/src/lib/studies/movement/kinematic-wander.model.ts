import type { StudyParameters } from '@dotln-angular/models';
import {
  add,
  cosine,
  dot,
  length,
  normalize,
  scale,
  sine,
  type Vec2,
} from '@dotln-angular/scene-engine';

import { numberParameter } from '../parameters';
import type { MotionFrame, MotionStudyModel } from '../study-model';

export interface KinematicWanderParameters {
  readonly startX: number;
  readonly startY: number;
  readonly startHeading: number;
  readonly speed: number;
  readonly maxRotation: number;
  readonly seed: number;
  readonly timeStep: number;
  readonly steps: number;
  readonly failureRotation: number;
}

export interface KinematicWanderState {
  readonly position: Vec2;
  readonly heading: number;
  readonly seed: number;
}

interface WanderUpdate {
  readonly velocity: Vec2;
  readonly turnRate: number;
  readonly headingChange: number;
  readonly next: KinematicWanderState;
}

const readParameters = (parameters: StudyParameters): KinematicWanderParameters => ({
  startX: numberParameter(parameters, 'startX'),
  startY: numberParameter(parameters, 'startY'),
  startHeading: numberParameter(parameters, 'startHeading'),
  speed: numberParameter(parameters, 'speed'),
  maxRotation: numberParameter(parameters, 'maxRotation'),
  seed: numberParameter(parameters, 'seed'),
  timeStep: numberParameter(parameters, 'timeStep'),
  steps: numberParameter(parameters, 'steps'),
  failureRotation: numberParameter(parameters, 'failureRotation'),
});

const fixed = (value: number) => value.toFixed(4);

/** Study-local mulberry32; the engine's seeded random helpers are not public exports. */
function uniformDraw(seed: number) {
  const nextSeed = (seed + 0x6d2b79f5) | 0;
  let mixed = Math.imul(nextSeed ^ (nextSeed >>> 15), 1 | nextSeed);
  mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
  return { value: ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296, seed: nextSeed };
}

const facing = (heading: number) => normalize({ x: cosine(heading), y: sine(heading) });

/** Direct velocity and angle integration, rather than the engine's acceleration-based wander. */
export function applyKinematicWander(
  state: KinematicWanderState,
  sample: number,
  example: KinematicWanderParameters,
  maxRotation = example.maxRotation,
): WanderUpdate {
  const velocity = scale(facing(state.heading), example.speed);
  const turnRate = sample * maxRotation;
  const headingChange = turnRate * example.timeStep;
  return {
    velocity,
    turnRate,
    headingChange,
    next: {
      ...state,
      position: add(state.position, scale(velocity, example.timeStep)),
      heading: state.heading + headingChange,
    },
  };
}

export function kinematicWanderStep(
  state: KinematicWanderState,
  example: KinematicWanderParameters,
  maxRotation = example.maxRotation,
) {
  const first = uniformDraw(state.seed);
  const second = uniformDraw(first.seed);
  const sample = first.value - second.value;
  const update = applyKinematicWander(state, sample, example, maxRotation);
  return {
    ...update,
    first: first.value,
    second: second.value,
    sample,
    next: { ...update.next, seed: second.seed },
  };
}

export function kinematicWanderFrames(
  example: KinematicWanderParameters,
  maxRotation = example.maxRotation,
): readonly KinematicWanderState[] {
  const states: KinematicWanderState[] = [
    {
      position: { x: example.startX, y: example.startY },
      heading: example.startHeading,
      seed: example.seed,
    },
  ];
  for (let step = 0; step < example.steps; step++)
    states.push(kinematicWanderStep(states[states.length - 1], example, maxRotation).next);
  return states;
}

function frameOf(
  state: KinematicWanderState,
  step: number,
  example: KinematicWanderParameters,
): MotionFrame {
  const seconds = step * example.timeStep;
  const ended = step === example.steps;
  const update = ended ? null : kinematicWanderStep(state, example);
  const velocity = scale(facing(state.heading), example.speed);
  const nextHeading = update?.next.heading ?? state.heading;
  const nextVelocity = scale(facing(nextHeading), example.speed);
  return {
    seconds,
    bodies: [{ id: 'moss', ...state.position, heading: state.heading, label: 'Moss' }],
    vectors: [
      { ...state.position, dx: velocity.x, dy: velocity.y, tone: 'actual' },
      { ...state.position, dx: nextVelocity.x, dy: nextVelocity.y, tone: 'desired' },
    ],
    marks: [{ x: example.startX, y: example.startY, shape: 'ring', tone: 'muted' }],
    values: {
      ...Object.fromEntries(Object.entries(example).map(([key, value]) => [key, String(value)])),
      duration: fixed(example.steps * example.timeStep),
      seconds: fixed(seconds),
      x: fixed(state.position.x),
      y: fixed(state.position.y),
      heading: fixed(state.heading),
      currentSpeed: fixed(length(velocity)),
      velocityX: fixed(velocity.x),
      velocityY: fixed(velocity.y),
      turnRate: fixed(update?.turnRate ?? 0),
      nextHeading: fixed(nextHeading),
      turnDescription: update
        ? `the sampled turn rate is ${fixed(update.turnRate)} radians/s`
        : 'the sampled run has ended without another turn draw',
    },
    note: ended
      ? 'This is the sampling horizon, not a stopping decision. Moss would keep walking if the run continued.'
      : 'Green moves Moss during this update. Amber shows the facing used for velocity on the following update; both arrows have the same length.',
    worked: update
      ? {
          title: `Moss: ${fixed(seconds)} → ${fixed(seconds + example.timeStep)} s`,
          lines: [
            `Facing ${fixed(state.heading)} rad gives velocity (${fixed(velocity.x)}, ${fixed(velocity.y)}) units/s at speed ${fixed(example.speed)}.`,
            `Subtract the seeded draws: ${fixed(update.first)} − ${fixed(update.second)} ≈ ${fixed(update.sample)}.`,
            `Turn rate = ${fixed(update.sample)} × ${fixed(example.maxRotation)} ≈ ${fixed(update.turnRate)} radians/s.`,
            `Position = (${fixed(state.position.x)}, ${fixed(state.position.y)}) + (${fixed(velocity.x)}, ${fixed(velocity.y)}) × ${fixed(example.timeStep)} ≈ (${fixed(update.next.position.x)}, ${fixed(update.next.position.y)}).`,
            `Next facing = ${fixed(state.heading)} + ${fixed(update.turnRate)} × ${fixed(example.timeStep)} ≈ ${fixed(nextHeading)} radians.`,
          ],
          note: 'The current displacement uses the old facing. The sampled turn affects the next displacement. Rounded readouts are not fed back into the run.',
        }
      : {
          title: `Sampling ends at ${fixed(seconds)} s`,
          lines: [],
          note: `Moss still has speed ${fixed(example.speed)} units/s; the horizon does not stop it.`,
        },
  };
}

const changesOf = (states: readonly KinematicWanderState[]) =>
  states.map((state, step) =>
    step + 1 < states.length ? Math.abs(states[step + 1].heading - state.heading) : 0,
  );

export const kinematicReversals = (states: readonly KinematicWanderState[]) =>
  states
    .slice(1)
    .filter((state, step) => dot(facing(states[step].heading), facing(state.heading)) < 0).length;

export const model = (parameters: StudyParameters): MotionStudyModel => {
  const example = readParameters(parameters);
  const states = kinematicWanderFrames(example);
  const abrupt = kinematicWanderFrames(example, example.failureRotation);
  const seconds = states.map((_state, step) => step * example.timeStep);
  const normalChanges = changesOf(states);
  const abruptChanges = changesOf(abrupt);
  const padding = Math.max(example.speed * 2, 1);
  const initialStep = normalChanges.reduce(
    (best, change, step) => (change > normalChanges[best] ? step : best),
    0,
  );
  const normalPeak = Math.max(...normalChanges);
  const abruptPeak = Math.max(...abruptChanges);
  return {
    family: 'motion',
    motion: {
      bounds: {
        minX: Math.min(...states.map(({ position }) => position.x)) - padding,
        maxX: Math.max(...states.map(({ position }) => position.x)) + padding,
        minY: Math.min(...states.map(({ position }) => position.y)) - padding,
        maxY: Math.max(...states.map(({ position }) => position.y)) + padding,
      },
      frames: states.map((state, step) => frameOf(state, step, example)),
      trail: true,
    },
    timeline: {
      title: 'Remembered facing',
      xLabel: 'Time · seconds',
      yLabel: 'Unwrapped angle · radians',
      seconds,
      series: [
        {
          id: 'heading',
          label: 'Solid green · facing',
          tone: 'actual',
          values: states.map(({ heading }) => heading),
        },
      ],
    },
    initialStep,
    moments: [
      { label: 'Start at full speed', step: 0 },
      { label: 'Largest sampled turn', step: initialStep },
      { label: 'Sampling horizon', step: example.steps },
    ],
    legend: [
      { tone: 'actual', label: 'Green · velocity used now' },
      { tone: 'desired', label: 'Amber · velocity for the next update' },
      { tone: 'muted', label: 'Ring · patrol start' },
    ],
    caption:
      'Moss is the arrowhead. The faint dots trace its recent positions. Green and amber show current and next-update velocities at the same scale; the chart keeps the angle unwrapped so turns remain continuous.',
    comparison: {
      title: 'When the turn bound destroys a leisurely patrol',
      intro: `The same seeded draws and ${example.timeStep}-s steps drive both runs. Only maxRotation changes: ${example.maxRotation} or ${example.failureRotation} radians/s. Speed remains ${example.speed} units/s.`,
      timeline: {
        title: 'Magnitude of each heading change',
        xLabel: 'Time · seconds',
        yLabel: 'Turn per update · radians',
        seconds,
        yRange: [0, Math.max(normalPeak, abruptPeak, 0.01) * 1.05],
        series: [
          {
            id: 'normal',
            label: `Green · bound ${example.maxRotation}`,
            tone: 'actual',
            values: normalChanges,
          },
          {
            id: 'abrupt',
            label: `Amber · bound ${example.failureRotation}`,
            tone: 'desired',
            values: abruptChanges,
          },
        ],
      },
      findings: [
        `The largest changes are ${fixed(normalPeak)} and ${fixed(abruptPeak)} radians per update. The two runs contain ${kinematicReversals(states)} and ${kinematicReversals(abrupt)} changes beyond a right angle, respectively.`,
        example.maxRotation === example.failureRotation
          ? 'The bounds now match, so these are the same patrol.'
          : 'A larger bound changes direction more abruptly without reducing speed. There is no acceleration controller to smooth the transition.',
      ],
      note: 'Changes are plotted at the start of the update that samples them. The final zero marks the horizon, when no further draw is taken.',
    },
    inputs: [
      {
        name: 'maxRotation',
        label: 'Turn-rate bound',
        unit: 'radians/s',
        min: 0.1,
        max: 4,
        step: 0.1,
      },
      { name: 'speed', label: 'Walking speed', unit: 'units/s', min: 2, max: 10, step: 1 },
    ],
  };
};

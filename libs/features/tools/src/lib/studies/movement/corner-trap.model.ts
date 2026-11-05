import type { StudyParameters } from '@dotln-angular/models';
import {
  add,
  blend,
  clipLength,
  length,
  normalize,
  scale,
  seek,
  type SteeringBody,
  subtract,
  type Vec2,
} from '@dotln-angular/scene-engine';

import { numberParameter } from '../parameters';
import type { MotionFrame, MotionStudyModel } from '../study-model';

export interface CornerParameters {
  readonly startX: number;
  readonly targetX: number;
  readonly cornerX: number;
  readonly wallDepth: number;
  readonly wallRise: number;
  readonly rayForward: number;
  readonly raySide: number;
  readonly rayLength: number;
  readonly wallAcceleration: number;
  readonly maxAcceleration: number;
  readonly maxSpeed: number;
  readonly timeStep: number;
  readonly steps: number;
  readonly stallEpsilon: number;
  readonly winnerRay: number;
}

export interface CornerState {
  readonly position: Vec2;
  readonly velocity: Vec2;
}

interface Wall {
  readonly start: Vec2;
  readonly end: Vec2;
  readonly normal: Vec2;
}

export interface CornerRay {
  readonly end: Vec2;
  readonly hit: Vec2 | null;
  readonly correction: Vec2;
}

export interface CornerStep {
  readonly rays: readonly CornerRay[];
  readonly goal: Vec2;
  readonly acceleration: Vec2;
  readonly stalled: boolean;
  readonly next: CornerState;
}

const readParameters = (parameters: StudyParameters): CornerParameters => ({
  startX: numberParameter(parameters, 'startX'),
  targetX: numberParameter(parameters, 'targetX'),
  cornerX: numberParameter(parameters, 'cornerX'),
  wallDepth: numberParameter(parameters, 'wallDepth'),
  wallRise: numberParameter(parameters, 'wallRise'),
  rayForward: numberParameter(parameters, 'rayForward'),
  raySide: numberParameter(parameters, 'raySide'),
  rayLength: numberParameter(parameters, 'rayLength'),
  wallAcceleration: numberParameter(parameters, 'wallAcceleration'),
  maxAcceleration: numberParameter(parameters, 'maxAcceleration'),
  maxSpeed: numberParameter(parameters, 'maxSpeed'),
  timeStep: numberParameter(parameters, 'timeStep'),
  steps: numberParameter(parameters, 'steps'),
  stallEpsilon: numberParameter(parameters, 'stallEpsilon'),
  winnerRay: numberParameter(parameters, 'winnerRay'),
});

const cross = (a: Vec2, b: Vec2) => a.x * b.y - a.y * b.x;
const fixed = (value: number) => (Math.abs(value) < 0.000005 ? '0.00' : value.toFixed(2));
const pair = (value: Vec2) => `(${fixed(value.x)}, ${fixed(value.y)})`;
// The example uses positive y upwards; screen coordinates increase downwards.
const drawnPoint = ({ x, y }: Vec2): Vec2 => ({ x, y: -y });

const wallsOf = (example: CornerParameters): readonly Wall[] => {
  const wallLength = length({ x: example.wallDepth, y: example.wallRise });
  return [1, -1].map((side) => ({
    start: { x: example.cornerX, y: 0 },
    end: { x: example.cornerX + example.wallDepth, y: side * example.wallRise },
    normal: {
      x: -example.wallRise / wallLength,
      y: (side * example.wallDepth) / wallLength,
    },
  }));
};

/** Intersects two finite segments; a miss is not a collision on an extended wall. */
export function rayWallHit(origin: Vec2, end: Vec2, wallStart: Vec2, wallEnd: Vec2): Vec2 | null {
  const ray = subtract(end, origin);
  const wall = subtract(wallEnd, wallStart);
  const denominator = cross(ray, wall);
  if (denominator === 0) return null;
  const offset = subtract(wallStart, origin);
  const alongRay = cross(offset, wall) / denominator;
  const alongWall = cross(offset, ray) / denominator;
  return alongRay >= 0 && alongRay <= 1 && alongWall >= 0 && alongWall <= 1
    ? add(origin, scale(ray, alongRay))
    : null;
}

function castRay(state: CornerState, side: number, example: CornerParameters): CornerRay {
  const end = add(
    state.position,
    scale(normalize({ x: example.rayForward, y: side * example.raySide }), example.rayLength),
  );
  let nearest: { readonly hit: Vec2; readonly normal: Vec2 } | null = null;
  for (const wall of wallsOf(example)) {
    const hit = rayWallHit(state.position, end, wall.start, wall.end);
    if (
      hit &&
      (!nearest ||
        length(subtract(hit, state.position)) < length(subtract(nearest.hit, state.position)))
    )
      nearest = { hit, normal: wall.normal };
  }
  return {
    end,
    hit: nearest?.hit ?? null,
    correction: nearest ? scale(nearest.normal, example.wallAcceleration) : { x: 0, y: 0 },
  };
}

/** Ray sensing and wall-normal requests are local; seek, blending and clipping use the engine. */
export function calculateCornerStep(
  state: CornerState,
  example: CornerParameters,
  winnerRay = example.winnerRay > 0,
): CornerStep {
  const body: SteeringBody = {
    position: state.position,
    velocity: state.velocity,
    heading: { x: 1, y: 0 },
    maxSpeed: example.maxSpeed,
    maxAcceleration: example.maxAcceleration,
    radius: 0,
    wanderAngle: 0,
  };
  const rays = [castRay(state, 1, example), castRay(state, -1, example)];
  const hits = rays.filter((ray) => ray.hit !== null);
  // A fixed upper-first choice is enough to break this particular symmetric equilibrium.
  const selected = winnerRay && hits.length > 1 ? hits.slice(0, 1) : hits;
  const goal = seek(body, { x: example.targetX, y: 0 });
  const acceleration = blend(
    [
      { acceleration: goal, weight: 1 },
      ...selected.map(({ correction }) => ({ acceleration: correction, weight: 1 })),
    ],
    example.maxAcceleration,
  );
  const velocity = clipLength(
    add(state.velocity, scale(acceleration, example.timeStep)),
    example.maxSpeed,
  );
  return {
    rays,
    goal,
    acceleration,
    stalled:
      hits.length === 2 &&
      length(acceleration) <= example.stallEpsilon &&
      length(state.velocity) <= example.stallEpsilon,
    next: { position: add(state.position, scale(velocity, example.timeStep)), velocity },
  };
}

export function cornerStates(
  example: CornerParameters,
  winnerRay = example.winnerRay > 0,
): readonly CornerState[] {
  const states: CornerState[] = [
    { position: { x: example.startX, y: 0 }, velocity: { x: 0, y: 0 } },
  ];
  for (let step = 0; step < example.steps; step++)
    states.push(calculateCornerStep(states[states.length - 1], example, winnerRay).next);
  return states;
}

function frameOf(state: CornerState, step: number, example: CornerParameters): MotionFrame {
  const calculation = calculateCornerStep(state, example);
  const [upper, lower] = calculation.rays;
  const parameterValues = Object.fromEntries(
    Object.entries(example).map(([key, value]) => [key, String(value)]),
  );
  return {
    seconds: step * example.timeStep,
    bodies: [{ id: 'rover', ...drawnPoint(state.position), label: 'rover' }],
    links: [
      ...wallsOf(example).map(({ start, end }) => ({
        from: drawnPoint(start),
        to: drawnPoint(end),
        tone: 'muted' as const,
      })),
      { from: drawnPoint(state.position), to: drawnPoint(upper.end), tone: 'desired' },
      { from: drawnPoint(state.position), to: drawnPoint(lower.end), tone: 'other' },
    ],
    marks: [
      { x: example.targetX, y: 0, shape: 'cross', tone: 'target', label: 'Goal' },
      ...calculation.rays.flatMap(({ hit }, index) =>
        hit
          ? [
              {
                ...drawnPoint(hit),
                shape: 'ring' as const,
                tone: index === 0 ? ('desired' as const) : ('other' as const),
                label: index === 0 ? 'upper hit' : 'lower hit',
              },
            ]
          : [],
      ),
    ],
    vectors: [
      {
        ...drawnPoint(state.position),
        dx: calculation.goal.x,
        dy: -calculation.goal.y,
        tone: 'target',
      },
      {
        ...drawnPoint(state.position),
        dx: upper.correction.x,
        dy: -upper.correction.y,
        tone: 'desired',
      },
      {
        ...drawnPoint(state.position),
        dx: lower.correction.x,
        dy: -lower.correction.y,
        tone: 'other',
      },
      {
        ...drawnPoint(state.position),
        dx: calculation.acceleration.x,
        dy: -calculation.acceleration.y,
        tone: 'actual',
      },
    ],
    values: {
      ...parameterValues,
      elapsed: fixed(step * example.timeStep),
      x: fixed(state.position.x),
      y: fixed(state.position.y),
      upperHit: upper.hit ? pair(upper.hit) : 'none',
      lowerHit: lower.hit ? pair(lower.hit) : 'none',
      upperCorrection: pair(upper.correction),
      lowerCorrection: pair(lower.correction),
      goal: pair(calculation.goal),
      net: pair(calculation.acceleration),
      speed: fixed(length(state.velocity)),
      stalled: calculation.stalled ? 'stalled' : 'moving or requesting movement',
    },
    note: calculation.stalled
      ? 'Both whiskers really hit the wedge. Their sideways corrections cancel, and their backward components cancel the destination request. No green net arrow remains.'
      : 'The ray hits determine which wall corrections enter the blend; no prewritten turn is played back.',
    worked: {
      title: `Ray hits and one update at ${fixed(step * example.timeStep)} s`,
      lines: [
        `Cast from ${pair(state.position)} to ${pair(upper.end)} and ${pair(lower.end)}. Segment intersections are ${upper.hit ? pair(upper.hit) : 'absent'} and ${lower.hit ? pair(lower.hit) : 'absent'}.`,
        `A hit requests outward normal × ${fixed(example.wallAcceleration)}: ${pair(upper.correction)} and ${pair(lower.correction)} units/s².`,
        `Engine seek requests ${pair(calculation.goal)}; engine blend clips their sum to ${fixed(example.maxAcceleration)}: ${pair(calculation.acceleration)} units/s².`,
        `v′ = clip(${pair(state.velocity)} + ${pair(calculation.acceleration)} × ${fixed(example.timeStep)}, ${fixed(example.maxSpeed)}) = ${pair(calculation.next.velocity)} units/s.`,
        `p′ = ${pair(state.position)} + ${pair(calculation.next.velocity)} × ${fixed(example.timeStep)} = ${pair(calculation.next.position)}.`,
      ],
      note: 'The comparison changes only the combination rule: when both rays hit, retain the upper ray and discard the lower correction for that update.',
    },
  };
}

export const model = (parameters: StudyParameters): MotionStudyModel => {
  const example = readParameters(parameters);
  const states = cornerStates(example);
  const recovery = cornerStates({ ...example, winnerRay: 1 });
  const frames = states.map((state, step) => frameOf(state, step, example));
  const seconds = frames.map((frame) => frame.seconds);
  const points = frames.flatMap((frame) => [
    ...frame.bodies,
    ...(frame.marks ?? []),
    ...(frame.links ?? []).flatMap(({ from, to }) => [from, to]),
    ...(frame.vectors ?? []).map(({ x, y, dx, dy }) => ({ x: x + dx, y: y + dy })),
  ]);
  const upper = states.map((state) => calculateCornerStep(state, example).rays[0].correction.y);
  const lower = states.map((state) => calculateCornerStep(state, example).rays[1].correction.y);
  const end = recovery[recovery.length - 1];
  return {
    family: 'motion',
    motion: {
      bounds: {
        minX: Math.min(...points.map(({ x }) => x)) - 2,
        maxX: Math.max(...points.map(({ x }) => x)) + 2,
        minY: Math.min(...points.map(({ y }) => y)) - 2,
        maxY: Math.max(...points.map(({ y }) => y)) + 2,
      },
      frames,
      trail: true,
    },
    timeline: {
      title: 'Sideways acceleration requests',
      xLabel: 'Time · seconds',
      yLabel: 'Acceleration · units/s²',
      seconds,
      reference: 0,
      series: [
        { id: 'upper', label: 'Upper wall correction', tone: 'desired', values: upper },
        { id: 'lower', label: 'Lower wall correction', tone: 'other', values: lower },
        {
          id: 'net',
          label: 'Net sideways acceleration',
          tone: 'actual',
          values: states.map((state) => calculateCornerStep(state, example).acceleration.y),
        },
      ],
    },
    initialStep: 0,
    moments: [
      { label: 'Both whiskers hit', step: 0 },
      { label: 'First cancelled update', step: 1 },
      { label: 'Still stalled', step: Math.floor(example.steps / 2) },
      { label: 'No progress', step: example.steps },
    ],
    legend: [
      { tone: 'muted', label: 'Wedge walls' },
      { tone: 'target', label: 'Destination request' },
      { tone: 'desired', label: 'Upper whisker and correction' },
      { tone: 'other', label: 'Lower whisker and correction' },
      { tone: 'actual', label: 'Net acceleration' },
    ],
    caption:
      'The wedge points towards the rover. Positive y points up in this plan view. Whiskers are lines, rings are actual ray hits, and arrows are acceleration requests at the same scale. The missing green arrow is the cancelled sum, rather than a missing collision test.',
    comparison: {
      title: 'Let one ray win the conflict',
      intro: `Repeat the same rover, rays, walls and ${fixed(example.timeStep)} s updates. Change only the rule for simultaneous hits: use the upper ray alone instead of both wall corrections.`,
      timeline: {
        title: 'Sideways position',
        xLabel: 'Time · seconds',
        yLabel: 'Position · units',
        seconds,
        reference: 0,
        series: [
          {
            id: 'symmetric',
            label: 'Both rays combined',
            tone: 'desired',
            values: states.map(({ position }) => position.y),
          },
          {
            id: 'winner',
            label: 'Upper ray wins simultaneous hits',
            tone: 'actual',
            values: recovery.map(({ position }) => position.y),
          },
        ],
      },
      findings: [
        `Combining both hits leaves the rover at ${pair(states[states.length - 1].position)}. With the upper ray winning, it reaches ${pair(end.position)} after ${fixed(example.steps * example.timeStep)} s.`,
        'The second run breaks this symmetry and starts a detour. This short window does not claim to complete a route around the wedge; a fixed preferred side can be wrong in another layout.',
      ],
    },
  };
};

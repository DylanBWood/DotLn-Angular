import type { StudyParameters } from '@dotln-angular/models';
import {
  add,
  clipLength,
  distance,
  dot,
  length,
  normalize,
  scale,
  seek,
  subtract,
  type Vec2,
} from '@dotln-angular/scene-engine';

import { numberParameter } from '../parameters';
import type { MotionFrame, MotionLink, MotionMark, MotionStudyModel } from '../study-model';

export interface WallAvoidanceParameters {
  readonly startX: number;
  readonly startY: number;
  readonly velocityX: number;
  readonly velocityY: number;
  readonly goalX: number;
  readonly goalY: number;
  readonly wallX: number;
  readonly wallBottom: number;
  readonly wallTop: number;
  readonly radius: number;
  readonly rayLength: number;
  readonly avoidDistance: number;
  readonly comparisonRayLength: number;
  readonly comparisonGoalY: number;
  readonly maxSpeed: number;
  readonly maxAcceleration: number;
  readonly timeStep: number;
  readonly steps: number;
  readonly velocitySeconds: number;
  readonly accelerationSecondsSquared: number;
}

export interface WallAvoidanceState {
  readonly position: Vec2;
  readonly velocity: Vec2;
  readonly heading: Vec2;
}

export interface WallRayHit {
  readonly point: Vec2;
  readonly normal: Vec2;
  readonly rayFraction: number;
  readonly wallFraction: number;
}

export interface WallAvoidanceStep {
  readonly rayEnd: Vec2;
  readonly hit: WallRayHit | null;
  readonly avoidanceTarget: Vec2 | null;
  readonly selectedTarget: Vec2;
  readonly acceleration: Vec2;
  readonly clearance: number;
  readonly next: WallAvoidanceState;
}

const readParameters = (parameters: StudyParameters): WallAvoidanceParameters => ({
  startX: numberParameter(parameters, 'startX'),
  startY: numberParameter(parameters, 'startY'),
  velocityX: numberParameter(parameters, 'velocityX'),
  velocityY: numberParameter(parameters, 'velocityY'),
  goalX: numberParameter(parameters, 'goalX'),
  goalY: numberParameter(parameters, 'goalY'),
  wallX: numberParameter(parameters, 'wallX'),
  wallBottom: numberParameter(parameters, 'wallBottom'),
  wallTop: numberParameter(parameters, 'wallTop'),
  radius: numberParameter(parameters, 'radius'),
  rayLength: numberParameter(parameters, 'rayLength'),
  avoidDistance: numberParameter(parameters, 'avoidDistance'),
  comparisonRayLength: numberParameter(parameters, 'comparisonRayLength'),
  comparisonGoalY: numberParameter(parameters, 'comparisonGoalY'),
  maxSpeed: numberParameter(parameters, 'maxSpeed'),
  maxAcceleration: numberParameter(parameters, 'maxAcceleration'),
  timeStep: numberParameter(parameters, 'timeStep'),
  steps: numberParameter(parameters, 'steps'),
  velocitySeconds: numberParameter(parameters, 'velocitySeconds'),
  accelerationSecondsSquared: numberParameter(parameters, 'accelerationSecondsSquared'),
});

const cross = (left: Vec2, right: Vec2) => left.x * right.y - left.y * right.x;
const wallStart = (example: WallAvoidanceParameters): Vec2 => ({
  x: example.wallX,
  y: example.wallBottom,
});
const wallEnd = (example: WallAvoidanceParameters): Vec2 => ({
  x: example.wallX,
  y: example.wallTop,
});
const goal = (example: WallAvoidanceParameters): Vec2 => ({ x: example.goalX, y: example.goalY });

const nearestWallPoint = (position: Vec2, example: WallAvoidanceParameters): Vec2 => ({
  x: example.wallX,
  y: Math.max(example.wallBottom, Math.min(example.wallTop, position.y)),
});

/** Distance from the disc to the finite wall, including its ends; negative means overlap. */
export const wallClearance = (position: Vec2, example: WallAvoidanceParameters) =>
  distance(position, nearestWallPoint(position, example)) - example.radius;

/** Intersect two finite segments, returning a surface normal opposed to the incoming ray. */
export function castWallRay(from: Vec2, to: Vec2, wallFrom: Vec2, wallTo: Vec2): WallRayHit | null {
  const ray = subtract(to, from);
  const wall = subtract(wallTo, wallFrom);
  const denominator = cross(ray, wall);
  if (denominator === 0) return null;
  const offset = subtract(wallFrom, from);
  const rayFraction = cross(offset, wall) / denominator;
  const wallFraction = cross(offset, ray) / denominator;
  if (rayFraction < 0 || rayFraction > 1 || wallFraction < 0 || wallFraction > 1) return null;
  const outward = normalize({ x: -wall.y, y: wall.x });
  return {
    point: add(from, scale(ray, rayFraction)),
    normal: dot(outward, ray) > 0 ? scale(outward, -1) : outward,
    rayFraction,
    wallFraction,
  };
}

export const initialWallAvoidanceState = (example: WallAvoidanceParameters): WallAvoidanceState => {
  const velocity = { x: example.velocityX, y: example.velocityY };
  return {
    position: { x: example.startX, y: example.startY },
    velocity,
    heading: length(velocity) === 0 ? { x: 1, y: 0 } : normalize(velocity),
  };
};

/** The detector and target construction are local; both target pulls use engine seek. */
export function calculateWallAvoidanceStep(
  state: WallAvoidanceState,
  example: WallAvoidanceParameters,
  rayLength = example.rayLength,
): WallAvoidanceStep {
  const direction = length(state.velocity) === 0 ? state.heading : normalize(state.velocity);
  const rayEnd = add(state.position, scale(direction, rayLength));
  const hit = castWallRay(state.position, rayEnd, wallStart(example), wallEnd(example));
  const avoidanceTarget =
    hit === null ? null : add(hit.point, scale(hit.normal, example.avoidDistance));
  const selectedTarget = avoidanceTarget ?? goal(example);
  const acceleration = seek(
    {
      ...state,
      maxSpeed: example.maxSpeed,
      maxAcceleration: example.maxAcceleration,
      radius: example.radius,
      wanderAngle: 0,
    },
    selectedTarget,
  );
  const velocity = clipLength(
    add(state.velocity, scale(acceleration, example.timeStep)),
    example.maxSpeed,
  );
  return {
    rayEnd,
    hit,
    avoidanceTarget,
    selectedTarget,
    acceleration,
    clearance: wallClearance(state.position, example),
    next: {
      position: add(state.position, scale(velocity, example.timeStep)),
      velocity,
      heading: length(velocity) === 0 ? state.heading : normalize(velocity),
    },
  };
}

export function wallAvoidanceFrames(
  example: WallAvoidanceParameters,
  rayLength = example.rayLength,
): readonly WallAvoidanceState[] {
  const states: WallAvoidanceState[] = [initialWallAvoidanceState(example)];
  for (let step = 0; step < example.steps; step++)
    states.push(calculateWallAvoidanceStep(states[states.length - 1], example, rayLength).next);
  return states;
}

const fixed = (value: number) => Number(value.toFixed(2)).toFixed(2);
const pair = (value: Vec2) => `(${fixed(value.x)}, ${fixed(value.y)})`;

function decision(state: WallAvoidanceState, calculation: WallAvoidanceStep) {
  if (calculation.clearance < 0)
    return 'The courier disc reaches through the wall; steering has no collision response to repair it.';
  if (calculation.hit === null)
    return 'The forward segment misses the wall, so the courier seeks the delivery point.';
  return dot(calculation.acceleration, state.velocity) < 0
    ? 'The ray hits; the offset target pulls against the current travel.'
    : 'The ray hits; Seek pulls towards the offset target, which can still lie ahead of the courier.';
}

export const model = (parameters: StudyParameters): MotionStudyModel => {
  const example = readParameters(parameters);
  const states = wallAvoidanceFrames(example);
  const comparison = wallAvoidanceFrames({ ...example, goalY: example.comparisonGoalY });
  const calculations = states.map((state) => calculateWallAvoidanceStep(state, example));
  const clearances = calculations.map((calculation) => calculation.clearance);
  const comparedClearances = comparison.map((state) => wallClearance(state.position, example));
  const seconds = states.map((_state, index) => index * example.timeStep);
  const frames: readonly MotionFrame[] = states.map((state, index) => {
    const calculation = calculations[index];
    const hit = calculation.hit;
    const target = calculation.avoidanceTarget;
    const links: readonly MotionLink[] = [
      { from: wallStart(example), to: wallEnd(example), tone: 'other' },
      { from: state.position, to: calculation.rayEnd, tone: 'desired' },
      ...(hit !== null && target !== null
        ? [{ from: hit.point, to: target, tone: 'muted' as const }]
        : []),
    ];
    const marks: readonly MotionMark[] = [
      { ...goal(example), shape: 'cross', tone: 'target', label: 'Delivery' },
      ...(hit === null
        ? []
        : [{ ...hit.point, shape: 'dot' as const, tone: 'other' as const, label: 'Hit' }]),
      ...(target === null
        ? []
        : [{ ...target, shape: 'cross' as const, tone: 'desired' as const }]),
    ];
    return {
      seconds: seconds[index],
      values: {
        ...Object.fromEntries(
          Object.entries(example).map(([name, value]) => [name, String(value)]),
        ),
        seconds: fixed(seconds[index]),
        position: pair(state.position),
        velocity: pair(state.velocity),
        wallStart: pair(wallStart(example)),
        wallEnd: pair(wallEnd(example)),
        goal: pair(goal(example)),
        rayStart: pair(state.position),
        rayEnd: pair(calculation.rayEnd),
        rayStatus: hit === null ? 'no hit' : `hit at ${pair(hit.point)}`,
        normal: hit === null ? 'none' : pair(hit.normal),
        avoidanceTarget: target === null ? 'none' : pair(target),
        selectedTarget: pair(calculation.selectedTarget),
        acceleration: pair(calculation.acceleration),
        clearance: fixed(calculation.clearance),
        decision: decision(state, calculation),
      },
      bodies: [{ id: 'courier', ...state.position, tone: 'subject', label: 'Courier' }],
      zones: [{ ...state.position, radius: example.radius, tone: 'subject' }],
      marks,
      links,
      vectors: [
        {
          x: state.position.x,
          y: state.position.y + 2,
          dx: state.velocity.x * example.velocitySeconds,
          dy: state.velocity.y * example.velocitySeconds,
          tone: 'actual',
        },
        {
          x: state.position.x,
          y: state.position.y + 4,
          dx: calculation.acceleration.x * example.accelerationSecondsSquared,
          dy: calculation.acceleration.y * example.accelerationSecondsSquared,
          tone: 'desired',
        },
        ...(hit === null
          ? []
          : [
              {
                ...hit.point,
                dx: hit.normal.x * example.avoidDistance,
                dy: hit.normal.y * example.avoidDistance,
                tone: 'muted' as const,
              },
            ]),
      ],
      note: decision(state, calculation),
      worked: {
        title: `Ray and target at ${fixed(seconds[index])} seconds`,
        lines: [
          `Ray end = ${pair(state.position)} + ${pair(length(state.velocity) === 0 ? state.heading : normalize(state.velocity))} × ${fixed(example.rayLength)} = ${pair(calculation.rayEnd)}.`,
          hit === null
            ? 'The finite ray and wall segments do not intersect; there is no avoidance target.'
            : `Segment intersection: ray fraction ${fixed(hit.rayFraction)}, wall fraction ${fixed(hit.wallFraction)}; hit = ${pair(hit.point)}, normal = ${pair(hit.normal)}.`,
          hit === null || target === null
            ? `Use delivery target ${pair(goal(example))}.`
            : `Avoid target = ${pair(hit.point)} + ${pair(hit.normal)} × ${fixed(example.avoidDistance)} = ${pair(target)}.`,
          `Engine seek towards ${pair(calculation.selectedTarget)} returns acceleration ${pair(calculation.acceleration)} units/s².`,
          `Next velocity = clip(${pair(state.velocity)} + ${pair(calculation.acceleration)} × ${fixed(example.timeStep)}, ${fixed(example.maxSpeed)}) = ${pair(calculation.next.velocity)}.`,
          `Next position = ${pair(state.position)} + ${pair(calculation.next.velocity)} × ${fixed(example.timeStep)} = ${pair(calculation.next.position)}; current body clearance = distance(${pair(state.position)}, ${pair(nearestWallPoint(state.position, example))}) − ${fixed(example.radius)} = ${fixed(calculation.clearance)}.`,
        ],
        note: 'At zero speed the ray keeps the last travel heading. The ray is a line, not a swept disc. A normal offset changes the target; it does not teleport or stop the courier. Printed operands are rounded.',
      },
    };
  });
  const points = frames.flatMap((frame) => [
    ...frame.bodies,
    ...(frame.marks ?? []),
    ...(frame.links ?? []).flatMap((link) => [link.from, link.to]),
    ...(frame.vectors ?? []).map((vector) => ({
      x: vector.x + vector.dx,
      y: vector.y + vector.dy,
    })),
  ]);
  const firstHit = calculations.findIndex((calculation) => calculation.hit !== null);
  const turning = calculations.findIndex(
    (calculation) =>
      calculation.hit !== null &&
      Math.abs(calculation.acceleration.y) > Math.abs(calculation.acceleration.x),
  );
  const nearest = clearances.indexOf(Math.min(...clearances));
  const padding = example.radius * 3;
  return {
    family: 'motion',
    initialStep: Math.max(0, firstHit),
    motion: {
      bounds: {
        minX: Math.min(...points.map((point) => point.x)) - padding,
        maxX: Math.max(...points.map((point) => point.x)) + padding,
        minY: Math.min(...points.map((point) => point.y)) - padding,
        maxY: Math.max(...points.map((point) => point.y)) + padding,
      },
      frames,
      trail: true,
    },
    timeline: {
      title: 'Body clearance from the wall',
      xLabel: 'Time (s)',
      yLabel: 'Distance to wall − radius (units)',
      seconds,
      reference: 0,
      series: [
        { id: 'clearance', label: 'Courier body clearance', tone: 'actual', values: clearances },
      ],
    },
    moments: [
      {
        label: firstHit < 0 ? 'Start · ray misses' : 'Ray first hits',
        step: Math.max(0, firstHit),
      },
      ...(turning < 0 ? [] : [{ label: 'Turning along the wall', step: turning }]),
      { label: 'Smallest clearance', step: nearest },
      { label: 'End of run', step: states.length - 1 },
    ],
    legend: [
      { tone: 'subject', label: 'Courier and physical radius' },
      { tone: 'other', label: 'Wall segment and ray hit' },
      {
        tone: 'desired',
        label: `Ray; amber cross · avoidance target; lower lane · acceleration × ${example.accelerationSecondsSquared} s²`,
      },
      { tone: 'actual', label: `Upper lane · velocity × ${example.velocitySeconds} s` },
      { tone: 'muted', label: 'Surface normal × avoid distance' },
      { tone: 'target', label: 'Delivery point beyond the wall' },
    ],
    caption:
      'The long line is the wall. The forward ray runs from the courier to its ray end. On a hit, the normal points back from the surface to the amber avoidance cross. The courier ring is its physical radius. Below the courier, parallel lanes separate velocity above and acceleration below at the same scale as the construction. In the default example, the offset delivery gives the approach a sideways cue: watch the avoidance target turn the courier along the face and the delivery pull resume when the ray clears the end. The clearance chart includes distance round the wall’s ends; it does not treat the wall as infinite.',
    comparison: {
      title: 'Straight ahead gives no side to choose',
      intro: `Change only the delivery height goalY from ${example.goalY} to ${example.comparisonGoalY}. Keep the same initial motion, ray length, radius, normal offset, speed and acceleration.`,
      timeline: {
        title: 'An offset destination and a straight-on destination',
        xLabel: 'Time (s)',
        yLabel: 'Distance to wall − radius (units)',
        seconds,
        reference: 0,
        series: [
          {
            id: 'main',
            label: `Delivery height ${example.goalY}`,
            tone: 'actual',
            values: clearances,
          },
          {
            id: 'head-on',
            label: `Delivery height ${example.comparisonGoalY}`,
            tone: 'other',
            values: comparedClearances,
          },
        ],
      },
      findings: [
        `Minimum body clearance is ${fixed(Math.min(...clearances))} units in the example and ${fixed(Math.min(...comparedClearances))} units with the changed destination.`,
        `The changed run ends at ${pair(comparison[comparison.length - 1].position)}; its largest sideways displacement from the start is ${fixed(Math.max(...comparison.map((state) => Math.abs(state.position.y - example.startY))))} units. Clearance alone does not show whether it finds a way round.`,
        ...(example.goalY === example.comparisonGoalY
          ? ['Both destination heights are equal, so these are the same run.']
          : []),
      ],
      note: 'There is no wall clamp or collision response. The straight-on approach can brake and alternate targets without choosing a side. A centre ray can also miss a wall end that the body clips; neither is route planning.',
    },
    inputs: [
      { name: 'goalY', label: 'Delivery height', unit: 'units', min: 0, max: 18, step: 1 },
      {
        name: 'rayLength',
        label: 'Forward ray length',
        unit: 'units',
        min: 0.5,
        max: 12,
        step: 0.5,
      },
    ],
  };
};

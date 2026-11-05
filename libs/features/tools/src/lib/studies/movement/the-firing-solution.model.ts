import type { StudyParameters } from '@dotln-angular/models';

import { numberParameter } from '../parameters';
import type { MotionFrame, MotionLink, MotionStudyModel, StudyWorkedStep } from '../study-model';

export interface FiringParameters {
  readonly startX: number;
  readonly launchHeight: number;
  readonly targetX: number;
  readonly targetHeight: number;
  readonly launchSpeed: number;
  readonly gravity: number;
  readonly unreachableTargetX: number;
  readonly timeStep: number;
  readonly steps: number;
}

export interface FiringArc {
  readonly name: 'low' | 'high';
  readonly slope: number;
  readonly horizontalVelocity: number;
  readonly verticalVelocity: number;
  readonly targetTime: number;
  readonly landingTime: number;
  readonly landingX: number;
}

export interface FiringSolution {
  readonly distance: number;
  readonly heightOffset: number;
  readonly discriminant: number;
  readonly arcs: readonly FiringArc[];
}

export interface FiringPosition {
  readonly x: number;
  readonly height: number;
  readonly verticalVelocity: number;
  readonly landed: boolean;
}

const fixed = (value: number) => value.toFixed(2);

const readParameters = (parameters: StudyParameters): FiringParameters => ({
  startX: numberParameter(parameters, 'startX'),
  launchHeight: numberParameter(parameters, 'launchHeight'),
  targetX: numberParameter(parameters, 'targetX'),
  targetHeight: numberParameter(parameters, 'targetHeight'),
  launchSpeed: numberParameter(parameters, 'launchSpeed'),
  gravity: numberParameter(parameters, 'gravity'),
  unreachableTargetX: numberParameter(parameters, 'unreachableTargetX'),
  timeStep: numberParameter(parameters, 'timeStep'),
  steps: numberParameter(parameters, 'steps'),
});

/** This study-local solver has no engine equivalent. Its target is ahead and at or above water. */
export function solveFiringSolution(
  example: FiringParameters,
  targetX = example.targetX,
): FiringSolution {
  const distance = targetX - example.startX;
  const heightOffset = example.targetHeight - example.launchHeight;
  const speedSquared = example.launchSpeed ** 2;
  const discriminant =
    speedSquared ** 2 -
    example.gravity * (example.gravity * distance ** 2 + 2 * heightOffset * speedSquared);

  if (distance <= 0 || example.targetHeight < 0 || discriminant < 0)
    return { distance, heightOffset, discriminant, arcs: [] };

  const root = Math.sqrt(discriminant);
  const slopes =
    root === 0
      ? [{ name: 'low' as const, slope: speedSquared / (example.gravity * distance) }]
      : [
          { name: 'low' as const, slope: (speedSquared - root) / (example.gravity * distance) },
          { name: 'high' as const, slope: (speedSquared + root) / (example.gravity * distance) },
        ];
  const arcs = slopes.map(({ name, slope }): FiringArc => {
    const horizontalVelocity = example.launchSpeed / Math.sqrt(1 + slope ** 2);
    const verticalVelocity = slope * horizontalVelocity;
    const landingTime =
      (verticalVelocity +
        Math.sqrt(verticalVelocity ** 2 + 2 * example.gravity * example.launchHeight)) /
      example.gravity;

    return {
      name,
      slope,
      horizontalVelocity,
      verticalVelocity,
      targetTime: distance / horizontalVelocity,
      landingTime,
      landingX: example.startX + horizontalVelocity * landingTime,
    };
  });

  return { distance, heightOffset, discriminant, arcs };
}

/** Launch determines the whole flight; no steering correction is applied after it. */
export function firingPositionAt(
  example: FiringParameters,
  arc: FiringArc,
  seconds: number,
): FiringPosition {
  const landed = seconds + 1e-9 >= arc.landingTime;
  const time = landed ? arc.landingTime : seconds;

  return {
    x: example.startX + arc.horizontalVelocity * time,
    height: landed
      ? 0
      : example.launchHeight + arc.verticalVelocity * time - (example.gravity * time ** 2) / 2,
    verticalVelocity: landed ? 0 : arc.verticalVelocity - example.gravity * time,
    landed,
  };
}

/** Fixed preview samples also include exact apex, target and water-contact events. */
export function firingTimes(
  example: FiringParameters,
  solution: FiringSolution,
): readonly number[] {
  const horizon = example.steps * example.timeStep;
  const end =
    solution.arcs.length === 0
      ? horizon
      : Math.min(horizon, Math.max(...solution.arcs.map(({ landingTime }) => landingTime)));
  const times = Array.from(
    { length: example.steps + 1 },
    (_unused, step) => step * example.timeStep,
  ).filter((seconds) => seconds < end);
  const events = solution.arcs
    .flatMap((arc) => [arc.verticalVelocity / example.gravity, arc.targetTime, arc.landingTime])
    .filter((time) => time >= 0 && time <= end);

  const ordered = [...new Set([0, ...times, ...events, end])].sort((a, b) => a - b);
  const separated: number[] = [];
  // Target contact and water contact can differ by roundoff when both mean the same event.
  for (const time of ordered) {
    const previous = separated.at(-1);
    if (previous !== undefined && time - previous <= 1e-9) separated[separated.length - 1] = time;
    else separated.push(time);
  }
  return separated;
}

function workedStep(
  example: FiringParameters,
  solution: FiringSolution,
  seconds: number,
): StudyWorkedStep {
  const low = solution.arcs[0];
  const high = solution.arcs[1];
  const speedSquared = example.launchSpeed ** 2;
  const lines = [
    `Horizontal offset d = ${fixed(example.targetX)} − ${fixed(example.startX)} = ${fixed(solution.distance)} m; height offset h = ${fixed(example.targetHeight)} − ${fixed(example.launchHeight)} = ${fixed(solution.heightOffset)} m.`,
    `D = ${fixed(example.launchSpeed)}⁴ − ${fixed(example.gravity)} × (${fixed(example.gravity)} × ${fixed(solution.distance)}² + 2 × ${fixed(solution.heightOffset)} × ${fixed(speedSquared)}) = ${fixed(solution.discriminant)}.`,
  ];

  if (!low)
    return {
      title: 'No launch direction',
      lines: [
        ...lines,
        solution.discriminant < 0
          ? 'D < 0: do not take a square root or launch a guessed shot.'
          : 'This example accepts only a target ahead of the launcher and at or above the water.',
      ],
      note: 'An empty solution set is a result. The drawing contains no projectile because the launcher has not fired.',
    };

  const position = firingPositionAt(example, low, seconds);
  return {
    title: `Solve once; inspect at ${fixed(seconds)} seconds`,
    lines: [
      ...lines,
      `Low slope = (${fixed(speedSquared)} − √${fixed(solution.discriminant)}) / (${fixed(example.gravity)} × ${fixed(solution.distance)}) = ${fixed(low.slope)}.`,
      high
        ? `High slope uses +√D instead: ${fixed(high.slope)}. Low/high target times are ${fixed(low.targetTime)} / ${fixed(high.targetTime)} s.`
        : 'D = 0: the two slopes coincide, so retain one launch direction.',
      `For the selected low arc, vx = ${fixed(example.launchSpeed)} / √(1 + ${fixed(low.slope)}²) = ${fixed(low.horizontalVelocity)} m/s; vy = ${fixed(low.slope)} × ${fixed(low.horizontalVelocity)} = ${fixed(low.verticalVelocity)} m/s.`,
      `At t = min(${fixed(seconds)}, ${fixed(low.landingTime)}) s, x = ${fixed(position.x)} m and height = ${fixed(position.height)} m. Water contact holds the projectile at its true landing point.`,
    ],
    note: high
      ? 'Both launch velocities have the configured speed. The low arc arrives sooner; the high arc buys height and spends longer in the air. Neither has an obstacle-clearance guarantee.'
      : 'At the reachability boundary there is one arc, not two different choices.',
  };
}

function frameOf(
  example: FiringParameters,
  solution: FiringSolution,
  seconds: number,
  paths: readonly MotionLink[],
): MotionFrame {
  const low = solution.arcs[0];
  const high = solution.arcs[1];
  const lowPosition = low ? firingPositionAt(example, low, seconds) : null;
  const highPosition = high ? firingPositionAt(example, high, seconds) : null;

  return {
    seconds,
    bodies: solution.arcs.flatMap((arc) => {
      const position = firingPositionAt(example, arc, seconds);
      if (position.landed) return [];
      return [
        {
          id: arc.name,
          x: position.x,
          y: -position.height,
          tone: arc.name === 'low' ? ('actual' as const) : ('desired' as const),
          label:
            seconds === 0 || position.landed
              ? undefined
              : arc.name === 'low'
                ? 'Chosen low arc'
                : 'Alternative high arc',
        },
      ];
    }),
    vectors: solution.arcs.flatMap((arc) => {
      const position = firingPositionAt(example, arc, seconds);
      return position.landed
        ? []
        : [
            {
              x: position.x,
              y: -position.height,
              dx: arc.horizontalVelocity * example.timeStep,
              dy: -position.verticalVelocity * example.timeStep,
              tone: arc.name === 'low' ? ('actual' as const) : ('desired' as const),
            },
          ];
    }),
    marks: [
      ...solution.arcs.flatMap((arc) => {
        const position = firingPositionAt(example, arc, seconds);
        return position.landed
          ? [
              {
                x: position.x,
                y: -position.height,
                shape: 'dot' as const,
                tone: arc.name === 'low' ? ('actual' as const) : ('desired' as const),
              },
            ]
          : [];
      }),
      {
        x: example.startX,
        y: -example.launchHeight,
        shape: 'dot',
        tone: 'muted',
        label: 'Launcher',
      },
      {
        x: example.targetX,
        y: -example.targetHeight,
        shape: 'cross',
        tone: 'target',
        label: 'Beacon',
      },
    ],
    links: paths,
    values: {
      time: fixed(seconds),
      targetX: fixed(example.targetX),
      targetHeight: fixed(example.targetHeight),
      launchHeight: fixed(example.launchHeight),
      launchSpeed: fixed(example.launchSpeed),
      gravity: fixed(example.gravity),
      timeStep: fixed(example.timeStep),
      distance: fixed(solution.distance),
      discriminant: fixed(solution.discriminant),
      solutionCount: String(solution.arcs.length),
      lowVelocity: low
        ? `(${fixed(low.horizontalVelocity)}, ${fixed(low.verticalVelocity)})`
        : 'absent',
      highVelocity: high
        ? `(${fixed(high.horizontalVelocity)}, ${fixed(high.verticalVelocity)})`
        : 'absent',
      lowTime: low ? fixed(low.targetTime) : 'unavailable',
      highTime: high ? fixed(high.targetTime) : 'unavailable',
      lowPosition: lowPosition
        ? `x ${fixed(lowPosition.x)} m, height ${fixed(lowPosition.height)} m`
        : 'not launched',
      highPosition: highPosition
        ? `x ${fixed(highPosition.x)} m, height ${fixed(highPosition.height)} m`
        : 'no second arc',
      unreachableTargetX: fixed(example.unreachableTargetX),
    },
    note: !low
      ? 'The target has no admitted launch direction. The launcher stays silent; no projectile is drawn.'
      : lowPosition?.landed && highPosition && !highPosition.landed
        ? 'The chosen low shot has landed. The high candidate is still flying; showing it does not mean the launcher fires both.'
        : lowPosition?.landed && highPosition?.landed
          ? 'Both candidate flights have reached the water and remain at their landing points.'
          : lowPosition?.landed
            ? 'The single admitted candidate has reached the water and remains at its landing point.'
            : high
              ? 'Green is the selected shot; amber is the alternative launch from the same place at the same speed.'
              : 'The two roots coincide. Green shows the single admitted launch direction.',
    worked: workedStep(example, solution, seconds),
  };
}

function outOfRange(example: FiringParameters): NonNullable<MotionStudyModel['comparison']> {
  const original = solveFiringSolution(example);
  const changed = solveFiringSolution(example, example.unreachableTargetX);
  const seconds = Array.from(
    { length: example.steps + 1 },
    (_unused, step) => step * example.timeStep,
  );
  const remaining = (solution: FiringSolution) =>
    seconds.map((time) => {
      const arc = solution.arcs[0];
      const covered = arc
        ? Math.min(solution.distance, firingPositionAt(example, arc, time).x - example.startX)
        : 0;
      return solution.distance - covered;
    });

  return {
    title: 'What if the beacon moves beyond reach?',
    intro: `Change only target x from ${fixed(example.targetX)} m to ${fixed(example.unreachableTargetX)} m. Speed stays ${fixed(example.launchSpeed)} m/s and gravity stays ${fixed(example.gravity)} m/s². The chart tracks the horizontal distance still unserved by each launch request: while a shot is withheld, it stays the full launcher-to-target distance.`,
    timeline: {
      title: 'Horizontal distance left by the launch request',
      xLabel: 'Time · seconds',
      yLabel: 'Unserved horizontal distance · m',
      seconds,
      reference: 0,
      series: [
        {
          id: 'original',
          label: 'Solid green · selected shot request',
          tone: 'actual',
          values: remaining(original),
        },
        {
          id: 'changed',
          label:
            changed.arcs.length === 0
              ? 'Dashed amber · withheld request, no projectile'
              : 'Dashed amber · changed target request',
          tone: 'desired',
          values: remaining(changed),
        },
      ],
    },
    findings: [
      `The original request has D = ${fixed(original.discriminant)} and ${original.arcs.length} valid launch direction(s). The changed request has D = ${fixed(changed.discriminant)} and ${changed.arcs.length}.`,
      changed.arcs.length === 0
        ? `No projectile is launched for the beacon at x ${fixed(example.unreachableTargetX)} m. Its line remains ${fixed(changed.distance)} m above zero because the request cannot be served, not because a simulated projectile misses by that distance.`
        : 'The changed target is reachable with these inputs; the failure case no longer applies.',
    ],
    note: 'For equal launch and target heights the boundary is speed² / gravity. This solver also includes a height offset; it never clamps a negative discriminant into an artificial solution.',
  };
}

export const model = (parameters: StudyParameters): MotionStudyModel => {
  const example = readParameters(parameters);
  const solution = solveFiringSolution(example);
  const times = firingTimes(example, solution);
  const positions = times.flatMap((time) =>
    solution.arcs.map((arc) => firingPositionAt(example, arc, time)),
  );
  const paths: MotionLink[] = solution.arcs.flatMap((arc) =>
    times.slice(1).flatMap((time, index) => {
      const before = firingPositionAt(example, arc, times[index]);
      const after = firingPositionAt(example, arc, time);
      return before.x === after.x && before.height === after.height
        ? []
        : [
            {
              from: { x: before.x, y: -before.height },
              to: { x: after.x, y: -after.height },
              tone: arc.name === 'low' ? ('actual' as const) : ('desired' as const),
            },
          ];
    }),
  );
  const nearest = (seconds: number) =>
    times.reduce(
      (best, time, index) =>
        Math.abs(time - seconds) < Math.abs(times[best] - seconds) ? index : best,
      0,
    );
  const low = solution.arcs[0];
  const high = solution.arcs[1];
  const initialStep = low ? nearest(low.targetTime) : 0;

  return {
    family: 'motion',
    motion: {
      bounds: {
        minX: Math.min(example.startX, example.targetX, ...positions.map(({ x }) => x)) - 5,
        maxX:
          Math.max(example.startX, example.targetX, ...positions.map(({ x }) => x)) +
          5 +
          example.launchSpeed * example.timeStep,
        minY:
          -Math.max(
            example.launchHeight,
            example.targetHeight,
            ...positions.map(({ height }) => height),
          ) -
          5 -
          example.launchSpeed * example.timeStep,
        maxY: 5 + example.launchSpeed * example.timeStep,
      },
      frames: times.map((seconds) => frameOf(example, solution, seconds, paths)),
      trail: false,
    },
    timeline:
      solution.arcs.length === 0
        ? null
        : {
            title: 'Two candidate heights after launch',
            xLabel: 'Time · seconds',
            yLabel: 'Height above water · m',
            seconds: times,
            reference: example.targetHeight,
            yRange: [
              0,
              Math.max(
                1,
                example.launchHeight,
                example.targetHeight,
                ...positions.map(({ height }) => height),
              ),
            ],
            series: solution.arcs.map((arc) => ({
              id: arc.name,
              label:
                arc.name === 'low'
                  ? 'Solid green · chosen low arc'
                  : 'Dashed amber · alternative high arc',
              tone: arc.name === 'low' ? ('actual' as const) : ('desired' as const),
              values: times.map((seconds) => firingPositionAt(example, arc, seconds).height),
            })),
          },
    initialStep,
    moments: low
      ? [
          { label: 'Launch candidates', step: 0 },
          {
            label:
              low.verticalVelocity / example.gravity <= times[times.length - 1]
                ? 'Low apex'
                : 'Rising preview',
            step: nearest(low.verticalVelocity / example.gravity),
          },
          {
            label:
              low.targetTime <= times[times.length - 1] + 1e-9
                ? 'Chosen shot arrives'
                : 'Preview before target',
            step: initialStep,
          },
          {
            label:
              high && high.targetTime <= times[times.length - 1] + 1e-9
                ? 'High shot arrives'
                : 'Preview ends',
            step: high ? nearest(high.targetTime) : times.length - 1,
          },
        ]
      : [
          { label: 'Solve request', step: 0 },
          { label: 'Still withheld', step: Math.floor(times.length / 2) },
          { label: 'No launch', step: times.length - 1 },
        ],
    legend: [
      { tone: 'actual', label: 'Green · shorter flight, selected launch' },
      ...(high ? [{ tone: 'desired' as const, label: 'Amber · higher, longer alternative' }] : []),
      { tone: 'target', label: 'Cross · breakwater beacon' },
    ],
    caption:
      'A side view of the harbour launcher and fixed beacon. Curves are predicted candidate flights, dots show the current positions, and arrows show velocity × time step. The launcher chooses the low arc; the high arc is shown for comparison. Water contact leaves a smaller dot so the beacon cross stays visible.',
    comparison: outOfRange(example),
  };
};

import type { MotionFrame, MotionLink, MotionStudyModel, StudyWorkedStep } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { decimal } from './presentation';
import {
  type FiringArc,
  firingFrame,
  type FiringParameters,
  type FiringPosition,
  firingPositionAt,
  type FiringSolution,
  firingTimes,
  solveFiringSolution,
} from './the-firing-solution.simulation';

function workedStep(
  example: FiringParameters,
  solution: FiringSolution,
  seconds: number,
  t: StudyTranslate,
): StudyWorkedStep {
  const low = solution.arcs[0];
  const high = solution.arcs[1];
  const speedSquared = example.launchSpeed ** 2;
  const lines = [
    t('studyAifg.the-firing-solution.model.workedStep.steps.horizontalOffsetDHeight', {
      targetX: decimal(example.targetX),
      startX: decimal(example.startX),
      solutionDistance: decimal(solution.distance),
      targetHeight: decimal(example.targetHeight),
      launchHeight: decimal(example.launchHeight),
      solutionHeightOffset: decimal(solution.heightOffset),
    }),
    t('studyAifg.the-firing-solution.model.workedStep.steps.dLaunchSpeed', {
      launchSpeed: decimal(example.launchSpeed),
      gravity: decimal(example.gravity),
      solutionDistance: decimal(solution.distance),
      solutionHeightOffset: decimal(solution.heightOffset),
      speedSquared: decimal(speedSquared),
      solutionDiscriminant: decimal(solution.discriminant),
    }),
  ];

  if (!low)
    return {
      title: t('studyAifg.the-firing-solution.model.workedStep.titles.noLaunchDirection'),
      lines: [
        ...lines,
        solution.discriminant < 0
          ? t('studyAifg.the-firing-solution.model.workedStep.steps.dDoNotTake')
          : t('studyAifg.the-firing-solution.model.workedStep.steps.exampleAcceptsOnlyTarget'),
      ],
      note: t('studyAifg.the-firing-solution.model.workedStep.notes.emptySolutionSetResult'),
    };

  const position = firingPositionAt(example, low, seconds);
  return {
    title: t('studyAifg.the-firing-solution.model.workedStep.titles.solveOnceInspectSeconds', {
      seconds: decimal(seconds),
    }),
    lines: [
      ...lines,
      t('studyAifg.the-firing-solution.model.workedStep.steps.lowSlope', {
        speedSquared: decimal(speedSquared),
        solutionDiscriminant: decimal(solution.discriminant),
        gravity: decimal(example.gravity),
        solutionDistance: decimal(solution.distance),
        lowSlope: decimal(low.slope),
      }),
      high
        ? t('studyAifg.the-firing-solution.model.workedStep.steps.highSlopeUsesD', {
            highSlope: decimal(high.slope),
            lowTargetTime: decimal(low.targetTime),
            highTargetTime: decimal(high.targetTime),
          })
        : t('studyAifg.the-firing-solution.model.workedStep.steps.dTwoSlopesCoincide'),
      t('studyAifg.the-firing-solution.model.workedStep.steps.selectedLowArcVx', {
        launchSpeed: decimal(example.launchSpeed),
        lowSlope: decimal(low.slope),
        lowHorizontalVelocity: decimal(low.horizontalVelocity),
        lowVerticalVelocity: decimal(low.verticalVelocity),
      }),
      t('studyAifg.the-firing-solution.model.workedStep.steps.tMinXHeight', {
        seconds: decimal(seconds),
        lowLandingTime: decimal(low.landingTime),
        position: decimal(position.x),
        positionHeight: decimal(position.height),
      }),
    ],
    note: high
      ? t('studyAifg.the-firing-solution.model.workedStep.notes.bothLaunchVelocitiesHave')
      : t('studyAifg.the-firing-solution.model.workedStep.notes.reachabilityBoundaryThereOne'),
  };
}

function frameValues(
  seconds: number,
  example: FiringParameters,
  solution: FiringSolution,
  projection: ReturnType<typeof firingFrame>,
  t: StudyTranslate,
): MotionFrame['values'] {
  const { low, high, lowPosition, highPosition } = projection;

  return {
    time: decimal(seconds),
    targetX: decimal(example.targetX),
    targetHeight: decimal(example.targetHeight),
    launchHeight: decimal(example.launchHeight),
    launchSpeed: decimal(example.launchSpeed),
    gravity: decimal(example.gravity),
    timeStep: decimal(example.timeStep),
    distance: decimal(solution.distance),
    discriminant: decimal(solution.discriminant),
    solutionCount: String(solution.arcs.length),
    lowVelocity: low
      ? t(
          'studyAifg.the-firing-solution.model.frame.values.lowVelocityCases.lowHorizontalVelocity',
          {
            lowHorizontalVelocity: decimal(low.horizontalVelocity),
            lowVerticalVelocity: decimal(low.verticalVelocity),
          },
        )
      : t('studyAifg.the-firing-solution.model.frame.values.lowVelocityCases.absent'),
    highVelocity: high
      ? t(
          'studyAifg.the-firing-solution.model.frame.values.highVelocityCases.highHorizontalVelocity',
          {
            highHorizontalVelocity: decimal(high.horizontalVelocity),
            highVerticalVelocity: decimal(high.verticalVelocity),
          },
        )
      : t('studyAifg.the-firing-solution.model.frame.values.highVelocityCases.absent'),
    lowTime: low
      ? decimal(low.targetTime)
      : t('studyAifg.the-firing-solution.model.frame.values.lowTime'),
    highTime: high
      ? decimal(high.targetTime)
      : t('studyAifg.the-firing-solution.model.frame.values.highTime'),
    lowPosition: lowPosition
      ? t('studyAifg.the-firing-solution.model.frame.values.lowPositionCases.xHeight', {
          lowPosition: decimal(lowPosition.x),
          lowPositionHeight: decimal(lowPosition.height),
        })
      : t('studyAifg.the-firing-solution.model.frame.values.lowPositionCases.notLaunched'),
    highPosition: highPosition
      ? t('studyAifg.the-firing-solution.model.frame.values.highPositionCases.xHeight', {
          highPosition: decimal(highPosition.x),
          highPositionHeight: decimal(highPosition.height),
        })
      : t('studyAifg.the-firing-solution.model.frame.values.highPositionCases.noSecondArc'),
    unreachableTargetX: decimal(example.unreachableTargetX),
  };
}

function frameDrawing(
  solution: FiringSolution,
  example: FiringParameters,
  seconds: number,
  t: StudyTranslate,
  paths: readonly MotionLink[],
): Pick<MotionFrame, 'bodies' | 'vectors' | 'marks' | 'links'> {
  return {
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
                ? t('studyAifg.the-firing-solution.model.frame.bodies.labels.chosenLowArc')
                : t('studyAifg.the-firing-solution.model.frame.bodies.labels.alternativeHighArc'),
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
        label: t('studyAifg.the-firing-solution.model.frame.marks.labels.launcher'),
      },
      {
        x: example.targetX,
        y: -example.targetHeight,
        shape: 'cross',
        tone: 'target',
        label: t('studyAifg.the-firing-solution.model.frame.marks.labels.beacon'),
      },
    ],
    links: paths,
  };
}

function frameOf(
  example: FiringParameters,
  solution: FiringSolution,
  seconds: number,
  paths: readonly MotionLink[],
  t: StudyTranslate,
): MotionFrame {
  const projection = firingFrame(example, solution, seconds);
  const { low, high, lowPosition, highPosition } = projection;

  return {
    seconds,
    ...frameDrawing(solution, example, seconds, t, paths),
    values: frameValues(seconds, example, solution, projection, t),
    note: !low
      ? t('studyAifg.the-firing-solution.model.frame.notes.targetHasNoAdmitted')
      : lowPosition?.landed && highPosition && !highPosition.landed
        ? t('studyAifg.the-firing-solution.model.frame.notes.chosenLowShotHas')
        : lowPosition?.landed && highPosition?.landed
          ? t('studyAifg.the-firing-solution.model.frame.notes.bothCandidateFlightsHave')
          : lowPosition?.landed
            ? t('studyAifg.the-firing-solution.model.frame.notes.singleAdmittedCandidateHas')
            : high
              ? t('studyAifg.the-firing-solution.model.frame.notes.greenSelectedShotAmber')
              : t('studyAifg.the-firing-solution.model.frame.notes.twoRootsCoincideGreen'),
    worked: workedStep(example, solution, seconds, t),
  };
}

function outOfRange(
  example: FiringParameters,
  t: StudyTranslate,
  original: FiringSolution,
): NonNullable<MotionStudyModel['comparison']> {
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
    title: t('studyAifg.the-firing-solution.model.outOfRange.title'),
    intro: t('studyAifg.the-firing-solution.model.outOfRange.intro', {
      targetX: decimal(example.targetX),
      unreachableTargetX: decimal(example.unreachableTargetX),
      launchSpeed: decimal(example.launchSpeed),
      gravity: decimal(example.gravity),
    }),
    timeline: {
      title: t('studyAifg.the-firing-solution.model.outOfRange.timeline.title'),
      xLabel: t('studyAifg.the-firing-solution.model.outOfRange.timeline.xLabel'),
      yLabel: t('studyAifg.the-firing-solution.model.outOfRange.timeline.yLabel'),
      seconds,
      reference: 0,
      series: [
        {
          id: 'original',
          label: t(
            'studyAifg.the-firing-solution.model.outOfRange.timeline.series.labels.solidGreenSelectedShot',
          ),
          tone: 'actual',
          values: remaining(original),
        },
        {
          id: 'changed',
          label:
            changed.arcs.length === 0
              ? t(
                  'studyAifg.the-firing-solution.model.outOfRange.timeline.series.labels.dashedAmberWithheldRequest',
                )
              : t(
                  'studyAifg.the-firing-solution.model.outOfRange.timeline.series.labels.dashedAmberChangedTarget',
                ),
          tone: 'desired',
          values: remaining(changed),
        },
      ],
    },
    findings: [
      t('studyAifg.the-firing-solution.model.outOfRange.findings.originalRequestHasD', {
        originalDiscriminant: decimal(original.discriminant),
        originalArcs: original.arcs.length,
        changedDiscriminant: decimal(changed.discriminant),
        changedArcs: changed.arcs.length,
      }),
      changed.arcs.length === 0
        ? t('studyAifg.the-firing-solution.model.outOfRange.findings.noProjectileLaunchedBeacon', {
            unreachableTargetX: decimal(example.unreachableTargetX),
            changedDistance: decimal(changed.distance),
          })
        : t('studyAifg.the-firing-solution.model.outOfRange.findings.changedTargetReachableThese'),
    ],
    note: t('studyAifg.the-firing-solution.model.outOfRange.note'),
  };
}

function timelineOf(
  solution: FiringSolution,
  t: StudyTranslate,
  times: readonly number[],
  example: FiringParameters,
  positions: FiringPosition[],
): MotionStudyModel['timeline'] {
  return solution.arcs.length === 0
    ? null
    : {
        title: t('studyAifg.the-firing-solution.model.timeline.title'),
        xLabel: t('studyAifg.the-firing-solution.model.timeline.xLabel'),
        yLabel: t('studyAifg.the-firing-solution.model.timeline.yLabel'),
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
              ? t('studyAifg.the-firing-solution.model.timeline.series.labels.solidGreenChosenLow')
              : t(
                  'studyAifg.the-firing-solution.model.timeline.series.labels.dashedAmberAlternativeHigh',
                ),
          tone: arc.name === 'low' ? ('actual' as const) : ('desired' as const),
          values: times.map((seconds) => firingPositionAt(example, arc, seconds).height),
        })),
      };
}

function motionOf(
  example: FiringParameters,
  positions: FiringPosition[],
  times: readonly number[],
  solution: FiringSolution,
  paths: MotionLink[],
  t: StudyTranslate,
): MotionStudyModel['motion'] {
  return {
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
    frames: times.map((seconds) => frameOf(example, solution, seconds, paths, t)),
    trail: false,
  };
}

function momentsOf(
  low: FiringArc,
  t: StudyTranslate,
  example: FiringParameters,
  times: readonly number[],
  nearest: (seconds: number) => number,
  initialStep: number,
  high: FiringArc,
): MotionStudyModel['moments'] {
  return low
    ? [
        {
          label: t('studyAifg.the-firing-solution.model.moments.labels.launchCandidates'),
          step: 0,
        },
        {
          label:
            low.verticalVelocity / example.gravity <= times[times.length - 1]
              ? t('studyAifg.the-firing-solution.model.moments.labels.lowApex')
              : t('studyAifg.the-firing-solution.model.moments.labels.risingPreview'),
          step: nearest(low.verticalVelocity / example.gravity),
        },
        {
          label:
            low.targetTime <= times[times.length - 1] + 1e-9
              ? t('studyAifg.the-firing-solution.model.moments.labels.chosenShotArrives')
              : t('studyAifg.the-firing-solution.model.moments.labels.previewBeforeTarget'),
          step: initialStep,
        },
        {
          label:
            high && high.targetTime <= times[times.length - 1] + 1e-9
              ? t('studyAifg.the-firing-solution.model.moments.labels.highShotArrives')
              : t('studyAifg.the-firing-solution.model.moments.labels.previewEnds'),
          step: high ? nearest(high.targetTime) : times.length - 1,
        },
      ]
    : [
        { label: t('studyAifg.the-firing-solution.model.moments.labels.solveRequest'), step: 0 },
        {
          label: t('studyAifg.the-firing-solution.model.moments.labels.stillWithheld'),
          step: Math.floor(times.length / 2),
        },
        {
          label: t('studyAifg.the-firing-solution.model.moments.labels.noLaunch'),
          step: times.length - 1,
        },
      ];
}

function legendOf(t: StudyTranslate, high: FiringArc): MotionStudyModel['legend'] {
  return [
    {
      tone: 'actual',
      label: t('studyAifg.the-firing-solution.model.legend.labels.greenShorterFlightSelected'),
    },
    ...(high
      ? [
          {
            tone: 'desired' as const,
            label: t(
              'studyAifg.the-firing-solution.model.legend.labels.amberHigherLongerAlternative',
            ),
          },
        ]
      : []),
    {
      tone: 'target',
      label: t('studyAifg.the-firing-solution.model.legend.labels.crossBreakwaterBeacon'),
    },
  ];
}

export function presentStudy(example: FiringParameters, t: StudyTranslate): MotionStudyModel {
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
    motion: motionOf(example, positions, times, solution, paths, t),
    timeline: timelineOf(solution, t, times, example, positions),
    initialStep,
    moments: momentsOf(low, t, example, times, nearest, initialStep, high),
    legend: legendOf(t, high),
    caption: t('studyAifg.the-firing-solution.model.caption'),
    comparison: outOfRange(example, t, solution),
  };
}

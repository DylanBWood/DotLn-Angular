import { length, type Vec2 } from '@dotln-angular/scene-engine';

import type { MotionFrame, MotionStudyModel, StudyPoint } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import {
  calculateCornerStep,
  type CornerParameters,
  type CornerRay,
  cornerSamples,
  type CornerState,
  type CornerStep,
  wallsOf,
} from './corner-trap.simulation';
import { boundsOfPoints, decimal, vectorText } from './presentation';

// The example uses positive y upwards; screen coordinates increase downwards.
const drawnPoint = ({ x, y }: Vec2): Vec2 => ({ x, y: -y });

function frameWorkedStep(
  t: StudyTranslate,
  step: number,
  example: CornerParameters,
  state: CornerState,
  upper: CornerRay,
  lower: CornerRay,
  calculation: CornerStep,
): MotionFrame['worked'] {
  return {
    title: t('studyAifg.corner-trap.model.frame.worked.title', {
      timeStep: decimal(step * example.timeStep, 2, 0.000005),
    }),
    lines: [
      t('studyAifg.corner-trap.model.frame.worked.steps.castSegmentIntersections', {
        position: vectorText(state.position, 2, 0.000005),
        upperEnd: vectorText(upper.end, 2, 0.000005),
        lowerEnd: vectorText(lower.end, 2, 0.000005),
        upperHitVectorTextAbsent: upper.hit
          ? vectorText(upper.hit, 2, 0.000005)
          : t('studyAifg.corner-trap.model.frame.worked.steps.absent'),
        lowerHitVectorTextAbsent: lower.hit
          ? vectorText(lower.hit, 2, 0.000005)
          : t('studyAifg.corner-trap.model.frame.worked.steps.absent'),
      }),
      t('studyAifg.corner-trap.model.frame.worked.steps.hitRequestsOutwardNormal', {
        wallAcceleration: decimal(example.wallAcceleration, 2, 0.000005),
        upperCorrection: vectorText(upper.correction, 2, 0.000005),
        lowerCorrection: vectorText(lower.correction, 2, 0.000005),
      }),
      t('studyAifg.corner-trap.model.frame.worked.steps.engineSeekRequestsEngine', {
        goal: vectorText(calculation.goal, 2, 0.000005),
        maxAcceleration: decimal(example.maxAcceleration, 2, 0.000005),
        acceleration: vectorText(calculation.acceleration, 2, 0.000005),
      }),
      t('studyAifg.corner-trap.model.frame.worked.steps.velocityUpdate', {
        velocity: vectorText(state.velocity, 2, 0.000005),
        acceleration: vectorText(calculation.acceleration, 2, 0.000005),
        timeStep: decimal(example.timeStep, 2, 0.000005),
        maxSpeed: decimal(example.maxSpeed, 2, 0.000005),
        nextVelocity: vectorText(calculation.next.velocity, 2, 0.000005),
      }),
      t('studyAifg.corner-trap.model.frame.worked.steps.positionUpdate', {
        position: vectorText(state.position, 2, 0.000005),
        nextVelocity: vectorText(calculation.next.velocity, 2, 0.000005),
        timeStep: decimal(example.timeStep, 2, 0.000005),
        nextPosition: vectorText(calculation.next.position, 2, 0.000005),
      }),
    ],
    note: t('studyAifg.corner-trap.model.frame.worked.note'),
  };
}

function frameValues(
  step: number,
  example: CornerParameters,
  state: CornerState,
  calculation: CornerStep,
  t: StudyTranslate,
): MotionFrame['values'] {
  const [upper, lower] = calculation.rays;
  const parameterValues = Object.fromEntries(
    Object.entries(example).map(([key, value]) => [key, String(value)]),
  );
  return {
    ...parameterValues,
    elapsed: decimal(step * example.timeStep, 2, 0.000005),
    x: decimal(state.position.x, 2, 0.000005),
    y: decimal(state.position.y, 2, 0.000005),
    upperHit: upper.hit
      ? vectorText(upper.hit, 2, 0.000005)
      : t('studyAifg.corner-trap.model.frame.values.upperHit'),
    lowerHit: lower.hit
      ? vectorText(lower.hit, 2, 0.000005)
      : t('studyAifg.corner-trap.model.frame.values.lowerHit'),
    upperCorrection: vectorText(upper.correction, 2, 0.000005),
    lowerCorrection: vectorText(lower.correction, 2, 0.000005),
    goal: vectorText(calculation.goal, 2, 0.000005),
    net: vectorText(calculation.acceleration, 2, 0.000005),
    speed: decimal(length(state.velocity), 2, 0.000005),
    stalled: calculation.stalled
      ? t('studyAifg.corner-trap.model.frame.values.stalledCases.stalled')
      : t('studyAifg.corner-trap.model.frame.values.stalledCases.movingRequestingMovement'),
  };
}

function frameDrawing(
  state: CornerState,
  t: StudyTranslate,
  example: CornerParameters,
  upper: CornerRay,
  lower: CornerRay,
  calculation: CornerStep,
): Pick<MotionFrame, 'bodies' | 'links' | 'marks' | 'vectors'> {
  return {
    bodies: [
      {
        id: 'rover',
        ...drawnPoint(state.position),
        label: t('studyAifg.corner-trap.model.frame.bodies.labels.rover'),
      },
    ],
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
      {
        x: example.targetX,
        y: 0,
        shape: 'cross',
        tone: 'target',
        label: t('studyAifg.corner-trap.model.frame.marks.labels.goal'),
      },
      ...calculation.rays.flatMap(({ hit }, index) =>
        hit
          ? [
              {
                ...drawnPoint(hit),
                shape: 'ring' as const,
                tone: index === 0 ? ('desired' as const) : ('other' as const),
                label:
                  index === 0
                    ? t('studyAifg.corner-trap.model.frame.marks.labels.upperHit')
                    : t('studyAifg.corner-trap.model.frame.marks.labels.lowerHit'),
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
  };
}

function frameOf(
  state: CornerState,
  step: number,
  example: CornerParameters,
  t: StudyTranslate,
  calculation: ReturnType<typeof calculateCornerStep>,
): MotionFrame {
  const [upper, lower] = calculation.rays;
  return {
    seconds: step * example.timeStep,
    ...frameDrawing(state, t, example, upper, lower, calculation),
    values: frameValues(step, example, state, calculation, t),
    note: calculation.stalled
      ? t('studyAifg.corner-trap.model.frame.notes.bothWhiskersReallyHit')
      : t('studyAifg.corner-trap.model.frame.notes.rayHitsDetermineWhich'),
    worked: frameWorkedStep(t, step, example, state, upper, lower, calculation),
  };
}

function comparisonTimeline(
  t: StudyTranslate,
  seconds: number[],
  states: readonly CornerState[],
  recovery: readonly CornerState[],
): NonNullable<MotionStudyModel['comparison']>['timeline'] {
  return {
    title: t('studyAifg.corner-trap.model.comparison.timeline.title'),
    xLabel: t('studyAifg.corner-trap.model.comparison.timeline.xLabel'),
    yLabel: t('studyAifg.corner-trap.model.comparison.timeline.yLabel'),
    seconds,
    reference: 0,
    series: [
      {
        id: 'symmetric',
        label: t('studyAifg.corner-trap.model.comparison.timeline.series.labels.bothRaysCombined'),
        tone: 'desired',
        values: states.map(({ position }) => position.y),
      },
      {
        id: 'winner',
        label: t(
          'studyAifg.corner-trap.model.comparison.timeline.series.labels.upperRayWinsSimultaneous',
        ),
        tone: 'actual',
        values: recovery.map(({ position }) => position.y),
      },
    ],
  };
}

function comparisonOf(
  t: StudyTranslate,
  example: CornerParameters,
  seconds: number[],
  states: readonly CornerState[],
  recovery: readonly CornerState[],
  end: CornerState,
): NonNullable<MotionStudyModel['comparison']> {
  return {
    title: t('studyAifg.corner-trap.model.comparison.title'),
    intro: t('studyAifg.corner-trap.model.comparison.intro', {
      timeStep: decimal(example.timeStep, 2, 0.000005),
    }),
    timeline: comparisonTimeline(t, seconds, states, recovery),
    findings: [
      t('studyAifg.corner-trap.model.comparison.findings.combiningBothHitsLeaves', {
        statesPosition: vectorText(states[states.length - 1].position, 2, 0.000005),
        endPosition: vectorText(end.position, 2, 0.000005),
        stepsTimeStep: decimal(example.steps * example.timeStep, 2, 0.000005),
      }),
      t('studyAifg.corner-trap.model.comparison.findings.secondRunBreaksSymmetry'),
    ],
  };
}

function timelineOf(
  t: StudyTranslate,
  seconds: number[],
  upper: number[],
  lower: number[],
  statesSamples: ReturnType<typeof cornerSamples>,
): MotionStudyModel['timeline'] {
  return {
    title: t('studyAifg.corner-trap.model.timeline.title'),
    xLabel: t('studyAifg.corner-trap.model.timeline.xLabel'),
    yLabel: t('studyAifg.corner-trap.model.timeline.yLabel'),
    seconds,
    reference: 0,
    series: [
      {
        id: 'upper',
        label: t('studyAifg.corner-trap.model.timeline.series.labels.upperWallCorrection'),
        tone: 'desired',
        values: upper,
      },
      {
        id: 'lower',
        label: t('studyAifg.corner-trap.model.timeline.series.labels.lowerWallCorrection'),
        tone: 'other',
        values: lower,
      },
      {
        id: 'net',
        label: t('studyAifg.corner-trap.model.timeline.series.labels.netSidewaysAcceleration'),
        tone: 'actual',
        values: statesSamples.map(({ calculation }) => calculation.acceleration.y),
      },
    ],
  };
}

function motionOf(points: StudyPoint[], frames: MotionFrame[]): MotionStudyModel['motion'] {
  return {
    bounds: boundsOfPoints(points, 2),
    frames,
    trail: true,
  };
}

function momentsOf(t: StudyTranslate, example: CornerParameters): MotionStudyModel['moments'] {
  return [
    { label: t('studyAifg.corner-trap.model.moments.labels.bothWhiskersHit'), step: 0 },
    { label: t('studyAifg.corner-trap.model.moments.labels.firstCancelledUpdate'), step: 1 },
    {
      label: t('studyAifg.corner-trap.model.moments.labels.stillStalled'),
      step: Math.floor(example.steps / 2),
    },
    { label: t('studyAifg.corner-trap.model.moments.labels.noProgress'), step: example.steps },
  ];
}

function legendOf(t: StudyTranslate): MotionStudyModel['legend'] {
  return [
    { tone: 'muted', label: t('studyAifg.corner-trap.model.legend.labels.wedgeWalls') },
    { tone: 'target', label: t('studyAifg.corner-trap.model.legend.labels.destinationRequest') },
    {
      tone: 'desired',
      label: t('studyAifg.corner-trap.model.legend.labels.upperWhiskerCorrection'),
    },
    { tone: 'other', label: t('studyAifg.corner-trap.model.legend.labels.lowerWhiskerCorrection') },
    { tone: 'actual', label: t('studyAifg.corner-trap.model.legend.labels.netAcceleration') },
  ];
}

export function presentStudy(example: CornerParameters, t: StudyTranslate): MotionStudyModel {
  const statesSamples = cornerSamples(example);
  const states = statesSamples.map(({ state }) => state);
  const recoverySamples = cornerSamples({ ...example, winnerRay: 1 });
  const recovery = recoverySamples.map(({ state }) => state);
  const frames = states.map((state, step) =>
    frameOf(state, step, example, t, statesSamples[step].calculation),
  );
  const seconds = frames.map((frame) => frame.seconds);
  const points = frames.flatMap((frame) => [
    ...frame.bodies,
    ...(frame.marks ?? []),
    ...(frame.links ?? []).flatMap(({ from, to }) => [from, to]),
    ...(frame.vectors ?? []).map(({ x, y, dx, dy }) => ({ x: x + dx, y: y + dy })),
  ]);
  const upper = statesSamples.map(({ calculation }) => calculation.rays[0].correction.y);
  const lower = statesSamples.map(({ calculation }) => calculation.rays[1].correction.y);
  const end = recovery[recovery.length - 1];
  return {
    family: 'motion',
    motion: motionOf(points, frames),
    timeline: timelineOf(t, seconds, upper, lower, statesSamples),
    initialStep: 0,
    moments: momentsOf(t, example),
    legend: legendOf(t),
    caption: t('studyAifg.corner-trap.model.caption'),
    comparison: comparisonOf(t, example, seconds, states, recovery, end),
  };
}

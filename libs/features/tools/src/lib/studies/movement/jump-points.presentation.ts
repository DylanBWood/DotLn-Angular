import type { MotionFrame, MotionStudyModel, StudyWorkedStep } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import {
  jumpFlightDuration,
  jumpPadCentre,
  jumpPointFrames,
  type JumpPointSample,
  jumpPointSamples,
  type JumpPointsParameters,
  type JumpPointState,
  type JumpRunUpStep,
  plannedJump,
  stateAt,
} from './jump-points.simulation';
import { fixed } from './presentation';

function phaseLabel(phase: JumpPointState['phase'], t: StudyTranslate): string {
  switch (phase) {
    case 'run-up':
      return t('studyAifg.jump-points.model.phases.runUp');
    case 'airborne':
      return t('studyAifg.jump-points.model.phases.airborne');
    case 'landed':
      return t('studyAifg.jump-points.model.phases.landed');
    case 'rejected':
      return t('studyAifg.jump-points.model.phases.rejected');
  }
}

function runUpWorkedStep(
  t: StudyTranslate,
  state: JumpPointState,
  example: JumpPointsParameters,
  next: JumpRunUpStep,
): StudyWorkedStep {
  return {
    title: t('studyAifg.jump-points.model.workedStep.titles.runUp', {
      seconds: fixed(state.seconds),
    }),
    lines: [
      t('studyAifg.jump-points.model.workedStep.steps.velocityRequest', {
        requiredVelocity: fixed(example.requiredVelocity),
        velocity: fixed(state.velocity),
        responseTime: fixed(example.responseTime),
        nextRequestedAcceleration: fixed(next.requestedAcceleration),
      }),
      t('studyAifg.jump-points.model.workedStep.steps.engineCapsRequestGiving', {
        maxAcceleration: fixed(example.maxAcceleration),
        nextAcceleration: fixed(next.acceleration),
      }),
      t('studyAifg.jump-points.model.workedStep.steps.velocityLimited', {
        velocity: fixed(state.velocity),
        nextAcceleration: fixed(next.acceleration),
        timeStep: fixed(example.timeStep),
        nextVelocity: fixed(next.velocity),
        maxSpeed: fixed(example.maxSpeed),
      }),
      t('studyAifg.jump-points.model.workedStep.steps.positionX', {
        x: fixed(state.x),
        nextVelocity: fixed(next.velocity),
        timeStep: fixed(example.timeStep),
        next: fixed(next.x),
      }),
    ],
    note: t('studyAifg.jump-points.model.workedStep.notes.matchingLaunchVelocityDoes'),
  };
}

function launchWorkedStep(
  state: JumpPointState,
  t: StudyTranslate,
  example: JumpPointsParameters,
  positionError: number,
  velocityError: number,
): StudyWorkedStep {
  return {
    title:
      state.phase === 'rejected'
        ? t('studyAifg.jump-points.model.workedStep.titles.launchRefused')
        : t('studyAifg.jump-points.model.workedStep.titles.launchConditionsPass'),
    lines: [
      t('studyAifg.jump-points.model.workedStep.steps.positionErrorAllowed', {
        x: fixed(state.x),
        markerX: fixed(example.markerX),
        positionError: fixed(positionError),
        positionTolerance: fixed(example.positionTolerance),
      }),
      t('studyAifg.jump-points.model.workedStep.steps.velocityErrorAllowed', {
        velocity: fixed(state.velocity),
        requiredVelocity: fixed(example.requiredVelocity),
        velocityError: fixed(velocityError),
        velocityTolerance: fixed(example.velocityTolerance),
      }),
      state.phase === 'rejected'
        ? t('studyAifg.jump-points.model.workedStep.steps.leastOneConditionFails')
        : t('studyAifg.jump-points.model.workedStep.steps.bothPassPreserveHorizontal', {
            velocity: fixed(state.velocity),
            verticalVelocity: fixed(example.verticalVelocity),
          }),
    ],
    note:
      state.phase === 'rejected'
        ? t('studyAifg.jump-points.model.workedStep.notes.studyEndsDecisionRetained')
        : t('studyAifg.jump-points.model.workedStep.notes.markerProtocolVerticalLaunch'),
  };
}

function flightWorkedStep(
  state: JumpPointState,
  t: StudyTranslate,
  example: JumpPointsParameters,
  takeoffX: number,
): StudyWorkedStep {
  return {
    title:
      state.phase === 'landed'
        ? t('studyAifg.jump-points.model.workedStep.titles.landingContact')
        : t('studyAifg.jump-points.model.workedStep.titles.airborneAirTime', {
            airTime: fixed(state.airTime),
          }),
    lines: [
      t('studyAifg.jump-points.model.workedStep.steps.sameHeightFlightTime', {
        verticalVelocity: fixed(example.verticalVelocity),
        gravity: fixed(example.gravity),
        jumpFlightDuration: fixed(jumpFlightDuration(example)),
      }),
      t('studyAifg.jump-points.model.workedStep.steps.horizontalPosition', {
        takeoffX: fixed(takeoffX),
        velocity: fixed(state.velocity),
        airTime: fixed(state.airTime),
        x: fixed(state.x),
      }),
      t('studyAifg.jump-points.model.workedStep.steps.heightVerticalVelocity', {
        verticalVelocity: fixed(example.verticalVelocity),
        airTime: fixed(state.airTime),
        gravity: fixed(example.gravity),
        height: fixed(state.height),
      }),
      t('studyAifg.jump-points.model.workedStep.steps.verticalVelocity', {
        verticalVelocity: fixed(example.verticalVelocity),
        gravity: fixed(example.gravity),
        airTime: fixed(state.airTime),
        verticalVelocity2: fixed(state.verticalVelocity),
      }),
      ...(state.phase === 'landed'
        ? [
            t('studyAifg.jump-points.model.workedStep.steps.landingErrorPadHalf', {
              x: fixed(state.x),
              jumpPadCentre: fixed(jumpPadCentre(example)),
              absJumpPadCentre: fixed(Math.abs(state.x - jumpPadCentre(example))),
              padHalfWidth: fixed(example.padHalfWidth),
            }),
          ]
        : []),
    ],
    note: t('studyAifg.jump-points.model.workedStep.notes.constantDownwardGravityEqual'),
  };
}

function workedStep(
  state: JumpPointState,
  example: JumpPointsParameters,
  t: StudyTranslate,
  runUp: JumpPointSample['runUp'],
): StudyWorkedStep {
  const positionError = Math.abs(state.x - example.markerX);
  const velocityError = Math.abs(state.velocity - example.requiredVelocity);
  if (state.phase === 'run-up') {
    if (!runUp) throw new Error('A run-up frame needs its retained controller result.');
    const next = runUp;
    return runUpWorkedStep(t, state, example, next);
  }
  if (state.phase === 'rejected' || state.airTime === 0)
    return launchWorkedStep(state, t, example, positionError, velocityError);
  const takeoffX = state.takeoffX ?? example.markerX;
  return flightWorkedStep(state, t, example, takeoffX);
}

function frameValues(
  example: JumpPointsParameters,
  state: JumpPointState,
  phase: string,
  padCentre: number,
): MotionFrame['values'] {
  return {
    ...Object.fromEntries(Object.entries(example).map(([key, value]) => [key, String(value)])),
    seconds: fixed(state.seconds),
    phase,
    x: fixed(state.x),
    height: fixed(state.height),
    vx: fixed(state.velocity),
    vy: fixed(state.verticalVelocity),
    positionError: fixed(Math.abs(state.x - example.markerX)),
    velocityError: fixed(Math.abs(state.velocity - example.requiredVelocity)),
    airTime: fixed(state.airTime),
    flightDuration: fixed(jumpFlightDuration(example)),
    padCentre: fixed(padCentre),
    landingError: fixed(Math.abs(state.x - padCentre)),
  };
}

function frameDrawing(
  state: JumpPointState,
  t: StudyTranslate,
  example: JumpPointsParameters,
  padCentre: number,
  planned: { x: number; height: number; verticalVelocity: number }[],
): Pick<MotionFrame, 'bodies' | 'vectors' | 'marks' | 'links'> {
  return {
    bodies: [
      {
        id: 'finch',
        x: state.x,
        y: -state.height,
        heading: Math.atan2(-state.verticalVelocity, state.velocity),
        label: t('studyAifg.jump-points.model.frame.bodies.labels.finch'),
        tone: 'subject',
      },
    ],
    vectors: [
      {
        x: state.x,
        y: -state.height,
        dx: state.velocity * example.arrowSeconds,
        dy: -state.verticalVelocity * example.arrowSeconds,
        tone: 'actual',
      },
      {
        x: example.markerX,
        y: 0.8,
        dx: example.requiredVelocity * example.arrowSeconds,
        dy: 0,
        tone: 'desired',
      },
    ],
    marks: [
      {
        x: example.markerX,
        y: 0,
        shape: 'ring',
        label:
          Math.hypot(state.x - example.markerX, state.height) < 1
            ? undefined
            : t('studyAifg.jump-points.model.frame.marks.labels.takeOff'),
        tone: 'target',
      },
      {
        x: padCentre,
        y: 0,
        shape: 'cross',
        label:
          Math.hypot(state.x - padCentre, state.height) < 1
            ? undefined
            : t('studyAifg.jump-points.model.frame.marks.labels.receivingPad'),
        tone: 'target',
      },
    ],
    links: [
      { from: { x: example.startX - 1, y: 0 }, to: { x: example.markerX, y: 0 }, tone: 'muted' },
      {
        from: { x: padCentre - example.padHalfWidth, y: 0 },
        to: { x: padCentre + example.padHalfWidth, y: 0 },
        tone: 'target',
      },
      ...planned.slice(1).map((point, index) => ({
        from: { x: planned[index].x, y: -planned[index].height },
        to: { x: point.x, y: -point.height },
        tone: 'desired' as const,
      })),
    ],
  };
}

function frameOf(
  state: JumpPointState,
  example: JumpPointsParameters,
  t: StudyTranslate,
  runUp: JumpPointSample['runUp'],
  planned: ReturnType<typeof plannedJump>,
): MotionFrame {
  const padCentre = jumpPadCentre(example);
  const phase = phaseLabel(state.phase, t);
  const note =
    state.phase === 'run-up'
      ? t('studyAifg.jump-points.model.frame.notes.finchBuildsRequiredHorizontal')
      : state.phase === 'rejected'
        ? t('studyAifg.jump-points.model.frame.notes.finchReachesMarkerWithout')
        : state.phase === 'landed'
          ? Math.abs(state.x - padCentre) <= example.padHalfWidth
            ? t('studyAifg.jump-points.model.frame.notes.finchReachesReceivingPad')
            : t('studyAifg.jump-points.model.frame.notes.acceptedTakeOffReaches')
          : state.airTime === 0
            ? t('studyAifg.jump-points.model.frame.notes.positionVelocityBothSatisfy')
            : state.verticalVelocity > 0
              ? t('studyAifg.jump-points.model.frame.notes.finchRisesWhileHorizontal')
              : state.verticalVelocity < 0
                ? t('studyAifg.jump-points.model.frame.notes.finchDescendsTowardsReceiving')
                : t('studyAifg.jump-points.model.frame.notes.finchApexZeroVertical');
  return {
    seconds: state.seconds,
    ...frameDrawing(state, t, example, padCentre, planned),
    values: frameValues(example, state, phase, padCentre),
    note,
    worked: workedStep(state, example, t, runUp),
  };
}

function comparisonTimeline(
  t: StudyTranslate,
  seconds: number[],
  example: JumpPointsParameters,
  states: readonly JumpPointState[],
  late: readonly JumpPointState[],
): NonNullable<MotionStudyModel['comparison']>['timeline'] {
  return {
    title: t('studyAifg.jump-points.model.comparison.timeline.title'),
    xLabel: t('studyAifg.jump-points.model.comparison.timeline.xLabel'),
    yLabel: t('studyAifg.jump-points.model.comparison.timeline.yLabel'),
    seconds,
    reference: 0,
    series: [
      {
        id: 'normal',
        label: t('studyAifg.jump-points.model.comparison.timeline.series.labels.startStartX', {
          startX: fixed(example.startX),
        }),
        tone: 'actual',
        values: states.map(({ velocity }) => example.requiredVelocity - velocity),
      },
      {
        id: 'late',
        label: t('studyAifg.jump-points.model.comparison.timeline.series.labels.startLateStartX', {
          lateStartX: fixed(example.lateStartX),
        }),
        tone: 'desired',
        values: seconds.map((second) => example.requiredVelocity - stateAt(late, second).velocity),
      },
    ],
  };
}

function comparisonOf(
  t: StudyTranslate,
  example: JumpPointsParameters,
  seconds: number[],
  states: readonly JumpPointState[],
  late: readonly JumpPointState[],
): NonNullable<MotionStudyModel['comparison']> {
  const last = states[states.length - 1];
  const padCentre = jumpPadCentre(example);
  const lateLast = late[late.length - 1];
  const decisionOf = (end: JumpPointState) =>
    end.phase === 'landed'
      ? t('studyAifg.jump-points.model.decision.descriptions.reachesLandingContactPad', {
          end: fixed(end.x),
          absEndPadCentre: fixed(Math.abs(end.x - padCentre)),
        })
      : end.phase === 'rejected'
        ? t('studyAifg.jump-points.model.decision.descriptions.rejectsLaunchVelocityError', {
            end: fixed(end.x),
            velocityError: fixed(Math.abs(end.velocity - example.requiredVelocity)),
          })
        : t('studyAifg.jump-points.model.decision.descriptions.endsBoundedHorizonPhase', {
            endPhase: phaseLabel(end.phase, t),
          });

  return {
    title: t('studyAifg.jump-points.model.comparison.title'),
    intro: t('studyAifg.jump-points.model.comparison.intro', {
      startX: fixed(example.startX),
      lateStartX: fixed(example.lateStartX),
    }),
    timeline: comparisonTimeline(t, seconds, example, states, late),
    findings: [
      t('studyAifg.jump-points.model.comparison.findings.mainRunChangedRun', {
        decision: decisionOf(last),
        decision2: decisionOf(lateLast),
      }),
      t('studyAifg.jump-points.model.comparison.findings.smallPositionErrorInsufficient'),
    ],
    note: t('studyAifg.jump-points.model.comparison.note'),
  };
}

function timelineOf(
  t: StudyTranslate,
  seconds: number[],
  example: JumpPointsParameters,
  states: readonly JumpPointState[],
): MotionStudyModel['timeline'] {
  return {
    title: t('studyAifg.jump-points.model.timeline.title'),
    xLabel: t('studyAifg.jump-points.model.timeline.xLabel'),
    yLabel: t('studyAifg.jump-points.model.timeline.yLabel'),
    seconds,
    reference: example.requiredVelocity,
    series: [
      {
        id: 'actual',
        label: t('studyAifg.jump-points.model.timeline.series.labels.finchHorizontalVelocity'),
        tone: 'actual',
        values: states.map(({ velocity }) => velocity),
      },
      {
        id: 'required',
        label: t('studyAifg.jump-points.model.timeline.series.labels.markerRequiredVelocity'),
        tone: 'desired',
        values: states.map(() => example.requiredVelocity),
      },
    ],
  };
}

function motionOf(
  xPoints: number[],
  yPoints: number[],
  frames: MotionFrame[],
): MotionStudyModel['motion'] {
  return {
    bounds: {
      minX: Math.min(...xPoints) - 1,
      maxX: Math.max(...xPoints) + 1,
      minY: Math.min(...yPoints) - 1,
      maxY: Math.max(...yPoints) + 1,
    },
    frames,
    trail: true,
  };
}

function momentsOf(
  t: StudyTranslate,
  takeoff: number,
  initialStep: number,
  apex: number,
  last: JumpPointState,
  states: readonly JumpPointState[],
): MotionStudyModel['moments'] {
  return [
    { label: t('studyAifg.jump-points.model.moments.labels.runUpBegins'), step: 0 },
    {
      label:
        takeoff >= 0
          ? t('studyAifg.jump-points.model.moments.labels.markerAccepted')
          : t('studyAifg.jump-points.model.moments.labels.markerDecisionHorizon'),
      step: initialStep,
    },
    { label: t('studyAifg.jump-points.model.moments.labels.highestSampledPoint'), step: apex },
    {
      label:
        last.phase === 'landed'
          ? t('studyAifg.jump-points.model.moments.labels.landingContact')
          : t('studyAifg.jump-points.model.moments.labels.finalDecision'),
      step: states.length - 1,
    },
  ];
}

function legendOf(t: StudyTranslate): MotionStudyModel['legend'] {
  return [
    { tone: 'subject', label: t('studyAifg.jump-points.model.legend.labels.arrowheadFinch') },
    {
      tone: 'target',
      label: t('studyAifg.jump-points.model.legend.labels.takeOffMarkerReceiving'),
    },
    { tone: 'actual', label: t('studyAifg.jump-points.model.legend.labels.actualVelocity') },
    {
      tone: 'desired',
      label: t('studyAifg.jump-points.model.legend.labels.requiredLaunchVelocityPlanned'),
    },
  ];
}

function inputsOf(t: StudyTranslate): MotionStudyModel['inputs'] {
  return [
    {
      name: 'startX',
      label: t('studyAifg.jump-points.model.inputs.labels.runUpStart'),
      unit: t('studyAifg.jump-points.model.inputs.units.metres'),
      min: 0,
      max: 6,
      step: 0.5,
    },
    {
      name: 'maxAcceleration',
      label: t('studyAifg.jump-points.model.inputs.labels.runUpAccelerationLimit'),
      unit: t('studyAifg.jump-points.model.inputs.units.metresPerSecondSquared'),
      min: 2,
      max: 8,
      step: 1,
    },
  ];
}

export function presentStudy(example: JumpPointsParameters, t: StudyTranslate): MotionStudyModel {
  const samples = jumpPointSamples(example);
  const planned = plannedJump(example);
  const states = samples.map(({ state }) => state);
  const late = jumpPointFrames(example, example.lateStartX);
  const frames = states.map((state, step) =>
    frameOf(state, example, t, samples[step].runUp, planned),
  );
  const seconds = frames.map(({ seconds }) => seconds);
  const takeoff = states.findIndex(({ phase }) => phase === 'airborne');
  const initialStep = takeoff >= 0 ? takeoff : states.length - 1;
  const apex = states.reduce(
    (best, state, index) => (state.height > states[best].height ? index : best),
    0,
  );
  const last = states[states.length - 1];
  const xPoints = frames.flatMap(({ bodies, vectors = [], links = [] }) => [
    ...bodies.map(({ x }) => x),
    ...vectors.flatMap(({ x, dx }) => [x, x + dx]),
    ...links.flatMap(({ from, to }) => [from.x, to.x]),
  ]);
  const yPoints = frames.flatMap(({ bodies, vectors = [], links = [] }) => [
    ...bodies.map(({ y }) => y),
    ...vectors.flatMap(({ y, dy }) => [y, y + dy]),
    ...links.flatMap(({ from, to }) => [from.y, to.y]),
  ]);
  return {
    family: 'motion',
    motion: motionOf(xPoints, yPoints, frames),
    timeline: timelineOf(t, seconds, example, states),
    initialStep,
    moments: momentsOf(t, takeoff, initialStep, apex, last, states),
    legend: legendOf(t),
    caption: t('studyAifg.jump-points.model.caption', {
      arrowSeconds: fixed(example.arrowSeconds),
    }),
    comparison: comparisonOf(t, example, seconds, states, late),
    inputs: inputsOf(t),
  };
}

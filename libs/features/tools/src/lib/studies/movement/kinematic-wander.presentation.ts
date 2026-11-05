import { length, scale, type Vec2 } from '@dotln-angular/scene-engine';

import type { MotionFrame, MotionStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import {
  changesOf,
  facing,
  kinematicReversals,
  type KinematicWanderParameters,
  kinematicWanderSamples,
  type KinematicWanderState,
  kinematicWanderStep,
} from './kinematic-wander.simulation';
import { decimal } from './presentation';

function frameWorkedStep(
  update: {
    first: number;
    second: number;
    sample: number;
    next: {
      seed: number;
      position: Vec2;
      heading: number;
    };
    velocity: Vec2;
    turnRate: number;
    headingChange: number;
  } | null,
  t: StudyTranslate,
  seconds: number,
  example: KinematicWanderParameters,
  state: KinematicWanderState,
  velocity: Vec2,
  nextHeading: number,
): MotionFrame['worked'] {
  return update
    ? {
        title: t('studyAifg.kinematic-wander.model.frame.worked.titles.mossSeconds', {
          seconds: decimal(seconds, 4),
          secondsTimeStep: decimal(seconds + example.timeStep, 4),
        }),
        lines: [
          t('studyAifg.kinematic-wander.model.frame.worked.steps.facingGivesVelocitySpeed', {
            heading: decimal(state.heading, 4),
            velocity: decimal(velocity.x, 4),
            velocity2: decimal(velocity.y, 4),
            speed: decimal(example.speed, 4),
          }),
          t('studyAifg.kinematic-wander.model.frame.worked.steps.subtractSeededDraws', {
            updateFirst: decimal(update.first, 4),
            updateSecond: decimal(update.second, 4),
            updateSample: decimal(update.sample, 4),
          }),
          t('studyAifg.kinematic-wander.model.frame.worked.steps.turnRate', {
            updateSample: decimal(update.sample, 4),
            maxRotation: decimal(example.maxRotation, 4),
            updateTurnRate: decimal(update.turnRate, 4),
          }),
          t('studyAifg.kinematic-wander.model.frame.worked.steps.positionPosition', {
            position: decimal(state.position.x, 4),
            position2: decimal(state.position.y, 4),
            velocity: decimal(velocity.x, 4),
            velocity2: decimal(velocity.y, 4),
            timeStep: decimal(example.timeStep, 4),
            updateNextPosition: decimal(update.next.position.x, 4),
            updateNextPosition2: decimal(update.next.position.y, 4),
          }),
          t('studyAifg.kinematic-wander.model.frame.worked.steps.nextFacing', {
            heading: decimal(state.heading, 4),
            updateTurnRate: decimal(update.turnRate, 4),
            timeStep: decimal(example.timeStep, 4),
            nextHeading: decimal(nextHeading, 4),
          }),
        ],
        note: t('studyAifg.kinematic-wander.model.frame.worked.notes.currentDisplacementUsesOld'),
      }
    : {
        title: t('studyAifg.kinematic-wander.model.frame.worked.titles.samplingEnds', {
          seconds: decimal(seconds, 4),
        }),
        lines: [],
        note: t('studyAifg.kinematic-wander.model.frame.worked.notes.mossStillHasSpeed', {
          speed: decimal(example.speed, 4),
        }),
      };
}

function frameValues(
  example: KinematicWanderParameters,
  seconds: number,
  state: KinematicWanderState,
  velocity: Vec2,
  update: {
    first: number;
    second: number;
    sample: number;
    next: {
      seed: number;
      position: Vec2;
      heading: number;
    };
    velocity: Vec2;
    turnRate: number;
    headingChange: number;
  } | null,
  nextHeading: number,
  t: StudyTranslate,
): MotionFrame['values'] {
  return {
    ...Object.fromEntries(Object.entries(example).map(([key, value]) => [key, String(value)])),
    duration: decimal(example.steps * example.timeStep, 4),
    seconds: decimal(seconds, 4),
    x: decimal(state.position.x, 4),
    y: decimal(state.position.y, 4),
    heading: decimal(state.heading, 4),
    currentSpeed: decimal(length(velocity), 4),
    velocityX: decimal(velocity.x, 4),
    velocityY: decimal(velocity.y, 4),
    turnRate: decimal(update?.turnRate ?? 0, 4),
    nextHeading: decimal(nextHeading, 4),
    turnDescription: update
      ? t('studyAifg.kinematic-wander.model.frame.values.turnDescriptionCases.sampledTurnRate', {
          updateTurnRate: decimal(update.turnRate, 4),
        })
      : t('studyAifg.kinematic-wander.model.frame.values.turnDescriptionCases.sampledRunHasEnded'),
  };
}

function frameDrawing(
  state: KinematicWanderState,
  t: StudyTranslate,
  velocity: Vec2,
  nextVelocity: Vec2,
  example: KinematicWanderParameters,
): Pick<MotionFrame, 'bodies' | 'vectors' | 'marks'> {
  return {
    bodies: [
      {
        id: 'moss',
        ...state.position,
        heading: state.heading,
        label: t('studyAifg.kinematic-wander.model.frame.bodies.labels.moss'),
      },
    ],
    vectors: [
      { ...state.position, dx: velocity.x, dy: velocity.y, tone: 'actual' },
      { ...state.position, dx: nextVelocity.x, dy: nextVelocity.y, tone: 'desired' },
    ],
    marks: [{ x: example.startX, y: example.startY, shape: 'ring', tone: 'muted' }],
  };
}

function frameOf(
  state: KinematicWanderState,
  step: number,
  example: KinematicWanderParameters,
  t: StudyTranslate,
  calculation: ReturnType<typeof kinematicWanderStep>,
): MotionFrame {
  const seconds = step * example.timeStep;
  const ended = step === example.steps;
  const update = ended ? null : calculation;
  const velocity = scale(facing(state.heading), example.speed);
  const nextHeading = update?.next.heading ?? state.heading;
  const nextVelocity = scale(facing(nextHeading), example.speed);
  return {
    seconds,
    ...frameDrawing(state, t, velocity, nextVelocity, example),
    values: frameValues(example, seconds, state, velocity, update, nextHeading, t),
    note: ended
      ? t('studyAifg.kinematic-wander.model.frame.notes.samplingHorizonNotStopping')
      : t('studyAifg.kinematic-wander.model.frame.notes.greenMovesMossDuring'),
    worked: frameWorkedStep(update, t, seconds, example, state, velocity, nextHeading),
  };
}

function comparisonTimeline(
  t: StudyTranslate,
  seconds: number[],
  normalPeak: number,
  abruptPeak: number,
  example: KinematicWanderParameters,
  normalChanges: number[],
  abruptChanges: number[],
): NonNullable<MotionStudyModel['comparison']>['timeline'] {
  return {
    title: t('studyAifg.kinematic-wander.model.comparison.timeline.title'),
    xLabel: t('studyAifg.kinematic-wander.model.comparison.timeline.xLabel'),
    yLabel: t('studyAifg.kinematic-wander.model.comparison.timeline.yLabel'),
    seconds,
    yRange: [0, Math.max(normalPeak, abruptPeak, 0.01) * 1.05],
    series: [
      {
        id: 'normal',
        label: t('studyAifg.kinematic-wander.model.comparison.timeline.series.labels.greenBound', {
          maxRotation: example.maxRotation,
        }),
        tone: 'actual',
        values: normalChanges,
      },
      {
        id: 'abrupt',
        label: t('studyAifg.kinematic-wander.model.comparison.timeline.series.labels.amberBound', {
          failureRotation: example.failureRotation,
        }),
        tone: 'desired',
        values: abruptChanges,
      },
    ],
  };
}

function comparisonOf(
  t: StudyTranslate,
  example: KinematicWanderParameters,
  seconds: number[],
  normalChanges: number[],
  states: readonly KinematicWanderState[],
  abrupt: readonly KinematicWanderState[],
): NonNullable<MotionStudyModel['comparison']> {
  const abruptChanges = changesOf(abrupt);
  const normalPeak = Math.max(...normalChanges);
  const abruptPeak = Math.max(...abruptChanges);
  return {
    title: t('studyAifg.kinematic-wander.model.comparison.title'),
    intro: t('studyAifg.kinematic-wander.model.comparison.intro', {
      timeStep: example.timeStep,
      maxRotation: example.maxRotation,
      failureRotation: example.failureRotation,
      speed: example.speed,
    }),
    timeline: comparisonTimeline(
      t,
      seconds,
      normalPeak,
      abruptPeak,
      example,
      normalChanges,
      abruptChanges,
    ),
    findings: [
      t('studyAifg.kinematic-wander.model.comparison.findings.largestChangesPerUpdate', {
        normalPeak: decimal(normalPeak, 4),
        abruptPeak: decimal(abruptPeak, 4),
        kinematicReversals: kinematicReversals(states),
        kinematicReversals2: kinematicReversals(abrupt),
      }),
      example.maxRotation === example.failureRotation
        ? t('studyAifg.kinematic-wander.model.comparison.findings.boundsNowMatchSo')
        : t('studyAifg.kinematic-wander.model.comparison.findings.largerBoundChangesDirection'),
    ],
    note: t('studyAifg.kinematic-wander.model.comparison.note'),
  };
}

function timelineOf(
  t: StudyTranslate,
  seconds: number[],
  states: readonly KinematicWanderState[],
): MotionStudyModel['timeline'] {
  return {
    title: t('studyAifg.kinematic-wander.model.timeline.title'),
    xLabel: t('studyAifg.kinematic-wander.model.timeline.xLabel'),
    yLabel: t('studyAifg.kinematic-wander.model.timeline.yLabel'),
    seconds,
    series: [
      {
        id: 'heading',
        label: t('studyAifg.kinematic-wander.model.timeline.series.labels.solidGreenFacing'),
        tone: 'actual',
        values: states.map(({ heading }) => heading),
      },
    ],
  };
}

function motionOf(
  statesSamples: ReturnType<typeof kinematicWanderSamples>,
  padding: number,
  example: KinematicWanderParameters,
  t: StudyTranslate,
): MotionStudyModel['motion'] {
  const states = statesSamples.map(({ state }) => state);
  return {
    bounds: {
      minX: Math.min(...states.map(({ position }) => position.x)) - padding,
      maxX: Math.max(...states.map(({ position }) => position.x)) + padding,
      minY: Math.min(...states.map(({ position }) => position.y)) - padding,
      maxY: Math.max(...states.map(({ position }) => position.y)) + padding,
    },
    frames: states.map((state, step) =>
      frameOf(state, step, example, t, statesSamples[step].calculation),
    ),
    trail: true,
  };
}

function momentsOf(
  t: StudyTranslate,
  initialStep: number,
  example: KinematicWanderParameters,
): MotionStudyModel['moments'] {
  return [
    { label: t('studyAifg.kinematic-wander.model.moments.labels.startFullSpeed'), step: 0 },
    {
      label: t('studyAifg.kinematic-wander.model.moments.labels.largestSampledTurn'),
      step: initialStep,
    },
    {
      label: t('studyAifg.kinematic-wander.model.moments.labels.samplingHorizon'),
      step: example.steps,
    },
  ];
}

function legendOf(t: StudyTranslate): MotionStudyModel['legend'] {
  return [
    {
      tone: 'actual',
      label: t('studyAifg.kinematic-wander.model.legend.labels.greenVelocityUsedNow'),
    },
    {
      tone: 'desired',
      label: t('studyAifg.kinematic-wander.model.legend.labels.amberVelocityNextUpdate'),
    },
    { tone: 'muted', label: t('studyAifg.kinematic-wander.model.legend.labels.ringPatrolStart') },
  ];
}

function inputsOf(t: StudyTranslate): MotionStudyModel['inputs'] {
  return [
    {
      name: 'maxRotation',
      label: t('studyAifg.kinematic-wander.model.inputs.labels.turnRateBound'),
      unit: t('studyAifg.kinematic-wander.model.inputs.units.radiansPerSecond'),
      min: 0.1,
      max: 4,
      step: 0.1,
    },
    {
      name: 'speed',
      label: t('studyAifg.kinematic-wander.model.inputs.labels.walkingSpeed'),
      unit: t('studyAifg.kinematic-wander.model.inputs.units.speed'),
      min: 2,
      max: 10,
      step: 1,
    },
  ];
}

export function presentStudy(
  example: KinematicWanderParameters,
  t: StudyTranslate,
): MotionStudyModel {
  const statesSamples = kinematicWanderSamples(example);
  const states = statesSamples.map(({ state }) => state);
  const abruptSamples = kinematicWanderSamples(example, example.failureRotation);
  const abrupt = abruptSamples.map(({ state }) => state);
  const seconds = states.map((_state, step) => step * example.timeStep);
  const normalChanges = changesOf(states);
  const padding = Math.max(example.speed * 2, 1);
  const initialStep = normalChanges.reduce(
    (best, change, step) => (change > normalChanges[best] ? step : best),
    0,
  );
  return {
    family: 'motion',
    motion: motionOf(statesSamples, padding, example, t),
    timeline: timelineOf(t, seconds, states),
    initialStep,
    moments: momentsOf(t, initialStep, example),
    legend: legendOf(t),
    caption: t('studyAifg.kinematic-wander.model.caption'),
    comparison: comparisonOf(t, example, seconds, normalChanges, states, abrupt),
    inputs: inputsOf(t),
  };
}

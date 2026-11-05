import { length, type Vec2 } from '@dotln-angular/scene-engine';

import type { MotionFrame, MotionLink, MotionStudyModel, StudyPoint } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { boundsOfPoints, decimal } from './presentation';
import {
  calculateCourierStep,
  concourseHeight,
  courierSamples,
  type CourierState,
  degrees,
  type HalfDimensionsParameters,
  targetOf,
} from './two-and-a-half-dimensions.simulation';

// The two views use the same distance scale; only the profile has a vertical offset.
const profileBase = (example: HalfDimensionsParameters) =>
  Math.max(example.startZ, example.targetZ) + example.rise + example.bodyHeight * 4;

function surfaceLinks(example: HalfDimensionsParameters): readonly MotionLink[] {
  const base = profileBase(example);
  const corners = [
    { x: example.startX, y: base - concourseHeight(example.startX, example) },
    { x: example.rampStart, y: base },
    { x: example.rampStart + example.rampRun, y: base - example.rise },
    { x: example.targetX, y: base - concourseHeight(example.targetX, example) },
  ];
  return corners
    .slice(1)
    .map((point, index) => ({ from: corners[index], to: point, tone: 'zone' }));
}

function frameWorkedStep(
  t: StudyTranslate,
  seconds: number,
  state: CourierState,
  example: HalfDimensionsParameters,
  calculation: {
    acceleration: Vec2;
    candidateVelocity: Vec2;
    reached: boolean;
    next: CourierState;
  },
  next: CourierState,
): MotionFrame['worked'] {
  return {
    title: t('studyAifg.two-and-a-half-dimensions.model.frame.worked.title', {
      seconds: decimal(seconds),
    }),
    lines: [
      t('studyAifg.two-and-a-half-dimensions.model.frame.worked.steps.engineSeekReadsPlan', {
        x: decimal(state.x),
        z: decimal(state.z),
        targetX: decimal(example.targetX),
        targetZ: decimal(example.targetZ),
        acceleration: decimal(calculation.acceleration.x),
        acceleration2: decimal(calculation.acceleration.y),
      }),
      t(
        'studyAifg.two-and-a-half-dimensions.model.frame.worked.steps.planVelocityAccelerationCapped',
        {
          timeStep: decimal(example.timeStep),
          maxSpeed: decimal(example.maxSpeed),
          candidateVelocity: decimal(calculation.candidateVelocity.x),
          candidateVelocity2: decimal(calculation.candidateVelocity.y),
        },
      ),
      t('studyAifg.two-and-a-half-dimensions.model.frame.worked.steps.useNextPlanPosition', {
        next: decimal(next.x),
        next2: decimal(next.z),
      }),
      example.rampRun === 0
        ? t('studyAifg.two-and-a-half-dimensions.model.frame.worked.steps.surfaceLedgeXNext', {
            rampStart: decimal(example.rampStart),
            nextHeight: decimal(next.height),
          })
        : t('studyAifg.two-and-a-half-dimensions.model.frame.worked.steps.surfaceHeightClamp', {
            rise: decimal(example.rise),
            next: decimal(next.x),
            rampStart: decimal(example.rampStart),
            rampRun: decimal(example.rampRun),
            nextHeight: decimal(next.height),
          }),
      t('studyAifg.two-and-a-half-dimensions.model.frame.worked.steps.heightRateKeepYaw', {
        nextHeight: decimal(next.height),
        height: decimal(state.height),
        timeStep: decimal(example.timeStep),
        nextVerticalSpeed: decimal(next.verticalSpeed),
        degrees: decimal(degrees(next.yaw)),
        nextPitch: decimal(next.pitch),
        nextRoll: decimal(next.roll),
      }),
    ],
    note: t('studyAifg.two-and-a-half-dimensions.model.frame.worked.note'),
  };
}

function frameValues(
  seconds: number,
  state: CourierState,
  example: HalfDimensionsParameters,
): MotionFrame['values'] {
  return {
    seconds: decimal(seconds),
    x: decimal(state.x),
    height: decimal(state.height),
    z: decimal(state.z),
    targetX: decimal(example.targetX),
    targetZ: decimal(example.targetZ),
    speed: decimal(length(state.velocity)),
    verticalSpeed: decimal(state.verticalSpeed),
    yaw: decimal(degrees(state.yaw)),
    pitch: decimal(state.pitch),
    roll: decimal(state.roll),
    rampStart: decimal(example.rampStart),
    rampRun: decimal(example.rampRun),
    rise: decimal(example.rise),
    maxSpeed: decimal(example.maxSpeed),
    maxAcceleration: decimal(example.maxAcceleration),
    timeStep: decimal(example.timeStep),
    ledgeRun: decimal(example.ledgeRun),
  };
}

function frameDrawing(
  state: CourierState,
  t: StudyTranslate,
  profile: {
    x: number;
    y: number;
  },
  example: HalfDimensionsParameters,
  base: number,
): Pick<MotionFrame, 'bodies' | 'marks' | 'links' | 'vectors'> {
  return {
    bodies: [
      {
        id: 'courier-plan',
        x: state.x,
        y: state.z,
        heading: state.yaw,
        label: t('studyAifg.two-and-a-half-dimensions.model.frame.bodies.labels.planXZ'),
      },
      {
        id: 'courier-profile',
        ...profile,
        tone: 'actual',
        label: t('studyAifg.two-and-a-half-dimensions.model.frame.bodies.labels.profileXHeight'),
      },
    ],
    marks: [
      {
        x: example.targetX,
        y: example.targetZ,
        shape: 'cross',
        label: t('studyAifg.two-and-a-half-dimensions.model.frame.marks.labels.concourseTarget'),
      },
      { x: example.targetX, y: base - concourseHeight(example.targetX, example), shape: 'cross' },
    ],
    links: [
      { from: { x: example.startX, y: example.startZ }, to: targetOf(example), tone: 'muted' },
      ...surfaceLinks(example),
      { from: profile, to: { x: profile.x, y: profile.y - example.bodyHeight }, tone: 'actual' },
    ],
    vectors: [
      { x: state.x, y: state.z, dx: state.velocity.x, dy: state.velocity.y, tone: 'actual' },
    ],
  };
}

function frameOf(
  state: CourierState,
  step: number,
  example: HalfDimensionsParameters,
  t: StudyTranslate,
  calculation: ReturnType<typeof calculateCourierStep>,
): MotionFrame {
  const next = calculation.next;
  const base = profileBase(example);
  const seconds = step * example.timeStep;
  const profile = { x: state.x, y: base - state.height };
  return {
    seconds,
    ...frameDrawing(state, t, profile, example, base),
    values: frameValues(seconds, state, example),
    note:
      state.height > 0 && state.height < example.rise
        ? t('studyAifg.two-and-a-half-dimensions.model.frame.notes.profileClimbsWhilePlan')
        : calculation.reached
          ? t('studyAifg.two-and-a-half-dimensions.model.frame.notes.nextPlanStepClamped')
          : t('studyAifg.two-and-a-half-dimensions.model.frame.notes.planSteeringChoosesX'),
    worked: frameWorkedStep(t, seconds, state, example, calculation, next),
  };
}

function comparisonTimeline(
  t: StudyTranslate,
  seconds: number[],
  example: HalfDimensionsParameters,
  states: readonly CourierState[],
  ledge: readonly CourierState[],
): NonNullable<MotionStudyModel['comparison']>['timeline'] {
  return {
    title: t('studyAifg.two-and-a-half-dimensions.model.comparison.timeline.title'),
    xLabel: t('studyAifg.two-and-a-half-dimensions.model.comparison.timeline.xLabel'),
    yLabel: t('studyAifg.two-and-a-half-dimensions.model.comparison.timeline.yLabel'),
    seconds,
    reference: 0,
    series: [
      {
        id: 'ramp',
        label: t(
          'studyAifg.two-and-a-half-dimensions.model.comparison.timeline.series.labels.rampRun',
          {
            rampRun: decimal(example.rampRun),
          },
        ),
        tone: 'actual',
        values: states.map(({ verticalSpeed }) => verticalSpeed),
      },
      {
        id: 'ledge',
        label: t(
          'studyAifg.two-and-a-half-dimensions.model.comparison.timeline.series.labels.rampRun2',
          { ledgeRun: decimal(example.ledgeRun) },
        ),
        tone: 'desired',
        values: ledge.map(({ verticalSpeed }) => verticalSpeed),
      },
    ],
  };
}

function comparisonOf(
  t: StudyTranslate,
  example: HalfDimensionsParameters,
  seconds: number[],
  states: readonly CourierState[],
  ledge: readonly CourierState[],
  peak: (run: readonly CourierState[]) => number,
): NonNullable<MotionStudyModel['comparison']> {
  return {
    title: t('studyAifg.two-and-a-half-dimensions.model.comparison.title'),
    intro: t('studyAifg.two-and-a-half-dimensions.model.comparison.intro', {
      rampRun: decimal(example.rampRun),
      ledgeRun: decimal(example.ledgeRun),
    }),
    timeline: comparisonTimeline(t, seconds, example, states, ledge),
    findings: [
      t('studyAifg.two-and-a-half-dimensions.model.comparison.findings.rampRunProducesPeak', {
        peak: decimal(peak(states)),
        peak2: decimal(peak(ledge)),
      }),
      example.rise === 0
        ? t('studyAifg.two-and-a-half-dimensions.model.comparison.findings.noRiseBothRuns')
        : t('studyAifg.two-and-a-half-dimensions.model.comparison.findings.bothRunsUseIdentical'),
    ],
    note: t('studyAifg.two-and-a-half-dimensions.model.comparison.note'),
  };
}

function timelineOf(
  t: StudyTranslate,
  seconds: number[],
  example: HalfDimensionsParameters,
  states: readonly CourierState[],
): MotionStudyModel['timeline'] {
  return {
    title: t('studyAifg.two-and-a-half-dimensions.model.timeline.title'),
    xLabel: t('studyAifg.two-and-a-half-dimensions.model.timeline.xLabel'),
    yLabel: t('studyAifg.two-and-a-half-dimensions.model.timeline.yLabel'),
    seconds,
    reference: example.rise,
    series: [
      {
        id: 'height',
        label: t(
          'studyAifg.two-and-a-half-dimensions.model.timeline.series.labels.sampledSurfaceHeight',
        ),
        tone: 'actual',
        values: states.map(({ height }) => height),
      },
    ],
  };
}

function motionOf(
  points: StudyPoint[],
  example: HalfDimensionsParameters,
  frames: MotionFrame[],
): MotionStudyModel['motion'] {
  return {
    bounds: boundsOfPoints(points, example.bodyHeight * 2),
    frames,
    trail: false,
  };
}

function momentsOf(
  t: StudyTranslate,
  initialStep: number,
  example: HalfDimensionsParameters,
): MotionStudyModel['moments'] {
  return [
    { label: t('studyAifg.two-and-a-half-dimensions.model.moments.labels.lowerLevel'), step: 0 },
    {
      label: t('studyAifg.two-and-a-half-dimensions.model.moments.labels.firstStepRamp'),
      step: initialStep,
    },
    {
      label: t('studyAifg.two-and-a-half-dimensions.model.moments.labels.crossingRamp'),
      step: Math.min(initialStep + 2, example.steps),
    },
    {
      label: t('studyAifg.two-and-a-half-dimensions.model.moments.labels.concourse'),
      step: example.steps,
    },
  ];
}

function legendOf(t: StudyTranslate): MotionStudyModel['legend'] {
  return [
    {
      tone: 'subject',
      label: t('studyAifg.two-and-a-half-dimensions.model.legend.labels.courierSeenPlan'),
    },
    {
      tone: 'actual',
      label: t('studyAifg.two-and-a-half-dimensions.model.legend.labels.velocityPlanUprightBody'),
    },
    {
      tone: 'zone',
      label: t('studyAifg.two-and-a-half-dimensions.model.legend.labels.surfaceProfile'),
    },
    {
      tone: 'target',
      label: t('studyAifg.two-and-a-half-dimensions.model.legend.labels.sameTargetBothViews'),
    },
  ];
}

function inputsOf(t: StudyTranslate): MotionStudyModel['inputs'] {
  return [
    {
      name: 'rise',
      label: t('studyAifg.two-and-a-half-dimensions.model.inputs.labels.concourseRise'),
      unit: t('studyAifg.two-and-a-half-dimensions.model.inputs.units.distance'),
      min: 0,
      max: 6,
      step: 1,
    },
    {
      name: 'rampRun',
      label: t('studyAifg.two-and-a-half-dimensions.model.inputs.labels.rampRun'),
      unit: t('studyAifg.two-and-a-half-dimensions.model.inputs.units.distance'),
      min: 0,
      max: 8,
      step: 1,
    },
  ];
}

export function presentStudy(
  example: HalfDimensionsParameters,
  t: StudyTranslate,
): MotionStudyModel {
  const statesSamples = courierSamples(example);
  const states = statesSamples.map(({ state }) => state);
  const ledgeSamples = courierSamples(example, example.ledgeRun);
  const ledge = ledgeSamples.map(({ state }) => state);
  const frames = states.map((state, step) =>
    frameOf(state, step, example, t, statesSamples[step].calculation),
  );
  const seconds = frames.map(({ seconds }) => seconds);
  const points = frames.flatMap((frame) => [
    ...frame.bodies,
    ...(frame.marks ?? []),
    ...(frame.links ?? []).flatMap(({ from, to }) => [from, to]),
    ...(frame.vectors ?? []).map(({ x, y, dx, dy }) => ({ x: x + dx, y: y + dy })),
  ]);
  const peak = (run: readonly CourierState[]) =>
    Math.max(...run.map(({ verticalSpeed }) => Math.abs(verticalSpeed)));
  const climbing = states.findIndex((state) => state.height > 0 && state.height < example.rise);
  const initialStep = climbing < 0 ? 0 : climbing;
  return {
    family: 'motion',
    motion: motionOf(points, example, frames),
    timeline: timelineOf(t, seconds, example, states),
    initialStep,
    moments: momentsOf(t, initialStep, example),
    legend: legendOf(t),
    caption: t('studyAifg.two-and-a-half-dimensions.model.caption'),
    comparison: comparisonOf(t, example, seconds, states, ledge, peak),
    inputs: inputsOf(t),
  };
}

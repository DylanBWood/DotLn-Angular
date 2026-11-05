import type { MotionFrame, MotionStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import {
  type ActuatorParameters,
  actuatorSamples,
  type ActuatorState,
  type ActuatorStep,
  actuatorStep,
} from './actuator.simulation';
import { decimal } from './presentation';

function frameWorkedStep(
  t: StudyTranslate,
  seconds: number,
  example: ActuatorParameters,
  calculation: ActuatorStep,
  state: ActuatorState,
): MotionFrame['worked'] {
  return {
    title: t('studyAifg.actuator.model.frame.worked.title', {
      seconds: decimal(seconds),
      secondsTimeStep: decimal(seconds + example.timeStep),
    }),
    lines: [
      t('studyAifg.actuator.model.frame.worked.steps.readAgreedVelocityChannel', {
        agreed: decimal(calculation.agreed),
      }),
      t('studyAifg.actuator.model.frame.worked.steps.clipMagnitudeCapabilityFeasible', {
        maxSpeed: decimal(example.maxSpeed),
        feasible: decimal(calculation.feasible),
      }),
      t('studyAifg.actuator.model.frame.worked.steps.requestFeasible', {
        feasible: decimal(calculation.feasible),
        velocity: decimal(state.velocity),
        responseTime: decimal(example.responseTime),
        rawAcceleration: decimal(calculation.rawAcceleration),
      }),
      t('studyAifg.actuator.model.frame.worked.steps.engineMatchVelocityLimitsAcceleration', {
        maxAcceleration: decimal(example.maxAcceleration),
        acceleration: decimal(calculation.acceleration),
      }),
      t('studyAifg.actuator.model.frame.worked.steps.localHarnessUpdatesVelocity', {
        maxSpeed: decimal(example.maxSpeed),
        velocity: decimal(state.velocity),
        acceleration: decimal(calculation.acceleration),
        timeStep: decimal(example.timeStep),
        nextVelocity: decimal(calculation.next.velocity),
      }),
      t('studyAifg.actuator.model.frame.worked.steps.useNewVelocityPosition', {
        position: decimal(state.position),
        nextVelocity: decimal(calculation.next.velocity),
        timeStep: decimal(example.timeStep),
        nextPosition: decimal(calculation.next.position),
      }),
    ],
    note: t('studyAifg.actuator.model.frame.worked.note'),
  };
}

function frameValues(
  seconds: number,
  example: ActuatorParameters,
  state: ActuatorState,
  markerPosition: number,
  calculation: ActuatorStep,
  speedGap: number,
): MotionFrame['values'] {
  return {
    elapsed: decimal(seconds),
    duration: decimal(example.steps * example.timeStep),
    position: decimal(state.position),
    markerPosition: decimal(markerPosition),
    positionGap: decimal(markerPosition - state.position),
    speed: decimal(state.velocity),
    agreed: decimal(calculation.agreed),
    feasible: decimal(calculation.feasible),
    acceleration: decimal(calculation.acceleration),
    speedGap: decimal(speedGap),
    beltSpeed: String(example.beltSpeed),
    impossibleSpeed: String(example.impossibleSpeed),
    initialSpeed: String(example.initialSpeed),
    maxSpeed: String(example.maxSpeed),
    maxAcceleration: String(example.maxAcceleration),
    responseTime: String(example.responseTime),
    timeStep: String(example.timeStep),
  };
}

function frameDrawing(
  state: ActuatorState,
  t: StudyTranslate,
  markerPosition: number,
  calculation: ActuatorStep,
  left: number,
  right: number,
): Pick<MotionFrame, 'bodies' | 'vectors' | 'links'> {
  return {
    bodies: [
      {
        id: 'courier',
        x: state.position,
        y: 0,
        heading: 0,
        label: t('studyAifg.actuator.model.frame.bodies.labels.courier'),
      },
      {
        id: 'belt-marker',
        x: markerPosition,
        y: -6,
        heading: 0,
        label: t('studyAifg.actuator.model.frame.bodies.labels.beltMarker'),
        tone: 'target',
      },
    ],
    vectors: [
      { x: state.position, y: 4, dx: state.velocity, dy: 0, tone: 'actual' },
      { x: state.position, y: 7, dx: calculation.feasible, dy: 0, tone: 'desired' },
    ],
    links: [
      { from: { x: left, y: 0 }, to: { x: right, y: 0 } },
      { from: { x: left, y: -6 }, to: { x: right, y: -6 } },
      { from: { x: state.position, y: 0 }, to: { x: markerPosition, y: -6 } },
    ],
  };
}

function frameOf(
  state: ActuatorState,
  step: number,
  example: ActuatorParameters,
  left: number,
  right: number,
  t: StudyTranslate,
  calculation: ReturnType<typeof actuatorStep>,
): MotionFrame {
  const seconds = step * example.timeStep;
  const markerPosition = example.beltSpeed * seconds;
  const speedGap = example.beltSpeed - state.velocity;
  return {
    seconds,
    ...frameDrawing(state, t, markerPosition, calculation, left, right),
    values: frameValues(seconds, example, state, markerPosition, calculation, speedGap),
    note:
      example.beltSpeed > example.maxSpeed
        ? t('studyAifg.actuator.model.frame.notes.agreedBeltVelocityExceeds')
        : Math.abs(speedGap) <= 0.01
          ? t('studyAifg.actuator.model.frame.notes.speedGapBelowDisplayed')
          : t('studyAifg.actuator.model.frame.notes.actuatorReadsAgreedVelocity'),
    worked: frameWorkedStep(t, seconds, example, calculation, state),
  };
}

function comparisonTimeline(
  t: StudyTranslate,
  seconds: number[],
  example: ActuatorParameters,
  states: readonly ActuatorState[],
  alternative: readonly ActuatorState[],
): NonNullable<MotionStudyModel['comparison']>['timeline'] {
  return {
    title: t('studyAifg.actuator.model.comparison.timeline.title'),
    xLabel: t('studyAifg.actuator.model.comparison.timeline.xLabel'),
    yLabel: t('studyAifg.actuator.model.comparison.timeline.yLabel'),
    seconds,
    yRange: [
      0,
      Math.max(example.beltSpeed, example.impossibleSpeed, example.maxSpeed, example.initialSpeed) +
        1,
    ],
    reference: example.maxSpeed,
    series: [
      {
        id: 'normal',
        label: t('studyAifg.actuator.model.comparison.timeline.series.labels.courierOriginalGoal'),
        tone: 'actual',
        values: states.map(({ velocity }) => velocity),
      },
      {
        id: 'alternative',
        label: t('studyAifg.actuator.model.comparison.timeline.series.labels.courierChangedGoal'),
        tone: 'other',
        values: alternative.map(({ velocity }) => velocity),
      },
      {
        id: 'normal-goal',
        label: t(
          'studyAifg.actuator.model.comparison.timeline.series.labels.originalAgreedVelocity',
        ),
        tone: 'desired',
        values: states.map(() => example.beltSpeed),
      },
      {
        id: 'alternative-goal',
        label: t(
          'studyAifg.actuator.model.comparison.timeline.series.labels.changedAgreedVelocity',
        ),
        tone: 'target',
        values: states.map(() => example.impossibleSpeed),
      },
    ],
  };
}

function comparisonOf(
  t: StudyTranslate,
  example: ActuatorParameters,
  seconds: number[],
  states: readonly ActuatorState[],
  alternative: readonly ActuatorState[],
): NonNullable<MotionStudyModel['comparison']> {
  const last = states[states.length - 1];
  const otherLast = alternative[alternative.length - 1];
  const alternativeGap = example.impossibleSpeed - otherLast.velocity;
  const alternativeFeasible = Math.abs(example.impossibleSpeed) <= example.maxSpeed;
  return {
    title: t('studyAifg.actuator.model.comparison.title'),
    intro: t('studyAifg.actuator.model.comparison.intro', {
      beltSpeed: decimal(example.beltSpeed),
      impossibleSpeed: decimal(example.impossibleSpeed),
      maxSpeed: decimal(example.maxSpeed),
      maxAcceleration: decimal(example.maxAcceleration),
    }),
    timeline: comparisonTimeline(t, seconds, example, states, alternative),
    findings: [
      t('studyAifg.actuator.model.comparison.findings.originalRunReachesAgreed', {
        stepsTimeStep: decimal(example.steps * example.timeStep),
        lastVelocity: decimal(last.velocity),
        beltSpeedLastVelocity: decimal(example.beltSpeed - last.velocity),
      }),
      t('studyAifg.actuator.model.comparison.findings.changedRunReachesLeaving', {
        otherLastVelocity: decimal(otherLast.velocity),
        alternativeGap: decimal(alternativeGap),
        impossibleSpeed: decimal(example.impossibleSpeed),
      }),
      alternativeFeasible
        ? t('studyAifg.actuator.model.comparison.findings.changedGoalNowFits')
        : t('studyAifg.actuator.model.comparison.findings.actuatorKeepsOutputFeasible'),
    ],
    note:
      example.beltSpeed === example.impossibleSpeed
        ? t('studyAifg.actuator.model.comparison.notes.goalsEqualSoThese')
        : t('studyAifg.actuator.model.comparison.notes.horizontalReferenceSpeedCapability'),
  };
}

function timelineOf(
  t: StudyTranslate,
  seconds: number[],
  example: ActuatorParameters,
  states: readonly ActuatorState[],
  calculations: ActuatorStep[],
): MotionStudyModel['timeline'] {
  return {
    title: t('studyAifg.actuator.model.timeline.title'),
    xLabel: t('studyAifg.actuator.model.timeline.xLabel'),
    yLabel: t('studyAifg.actuator.model.timeline.yLabel'),
    seconds,
    yRange: [0, Math.max(example.beltSpeed, example.maxSpeed, example.initialSpeed) + 1],
    series: [
      {
        id: 'agreed',
        label: t('studyAifg.actuator.model.timeline.series.labels.agreedBeltVelocity'),
        tone: 'target',
        values: states.map(() => example.beltSpeed),
      },
      {
        id: 'feasible',
        label: t('studyAifg.actuator.model.timeline.series.labels.feasibleVelocity'),
        tone: 'desired',
        values: calculations.map(({ feasible }) => feasible),
      },
      {
        id: 'actual',
        label: t('studyAifg.actuator.model.timeline.series.labels.courierVelocity'),
        tone: 'actual',
        values: states.map(({ velocity }) => velocity),
      },
    ],
  };
}

function motionOf(
  left: -2,
  right: number,
  statesSamples: ReturnType<typeof actuatorSamples>,
  example: ActuatorParameters,
  t: StudyTranslate,
): MotionStudyModel['motion'] {
  const states = statesSamples.map(({ state }) => state);
  return {
    bounds: { minX: left - 8, maxX: right + 8, minY: -11, maxY: 11 },
    frames: states.map((state, step) =>
      frameOf(state, step, example, left, right, t, statesSamples[step].calculation),
    ),
    trail: true,
  };
}

function momentsOf(
  t: StudyTranslate,
  transition: number,
  example: ActuatorParameters,
): MotionStudyModel['moments'] {
  return [
    { label: t('studyAifg.actuator.model.moments.labels.readGoal'), step: 0 },
    { label: t('studyAifg.actuator.model.moments.labels.firstBoundedOutput'), step: 1 },
    {
      label: t('studyAifg.actuator.model.moments.labels.velocityGapControlsOutput'),
      step: transition,
    },
    { label: t('studyAifg.actuator.model.moments.labels.endRun'), step: example.steps },
  ];
}

function legendOf(t: StudyTranslate): MotionStudyModel['legend'] {
  return [
    { tone: 'subject', label: t('studyAifg.actuator.model.legend.labels.courierPlatform') },
    { tone: 'target', label: t('studyAifg.actuator.model.legend.labels.beltMarkerAgreedVelocity') },
    {
      tone: 'desired',
      label: t('studyAifg.actuator.model.legend.labels.velocityWithinCapability'),
    },
    { tone: 'actual', label: t('studyAifg.actuator.model.legend.labels.courierVelocity') },
  ];
}

function inputsOf(t: StudyTranslate): MotionStudyModel['inputs'] {
  return [
    {
      name: 'beltSpeed',
      label: t('studyAifg.actuator.model.inputs.labels.agreedBeltVelocity'),
      unit: t('studyAifg.actuator.model.inputs.units.speed'),
      min: 2,
      max: 12,
      step: 1,
    },
    {
      name: 'maxSpeed',
      label: t('studyAifg.actuator.model.inputs.labels.courierSpeedCapability'),
      unit: t('studyAifg.actuator.model.inputs.units.speed'),
      min: 4,
      max: 14,
      step: 1,
    },
  ];
}

export function presentStudy(example: ActuatorParameters, t: StudyTranslate): MotionStudyModel {
  const statesSamples = actuatorSamples(example);
  const states = statesSamples.map(({ state }) => state);
  const alternativeSamples = actuatorSamples(example, example.impossibleSpeed);
  const alternative = alternativeSamples.map(({ state }) => state);
  const seconds = states.map((_state, step) => step * example.timeStep);
  const calculations = statesSamples.map(({ calculation }) => calculation);
  const left = -2;
  const right =
    Math.max(
      0,
      example.beltSpeed * example.steps * example.timeStep,
      ...states.map(({ position }) => position + example.maxSpeed),
    ) + 2;
  const uncapped = calculations.findIndex(
    ({ rawAcceleration }) => Math.abs(rawAcceleration) < example.maxAcceleration,
  );
  const transition = uncapped < 0 ? example.steps : uncapped;
  return {
    family: 'motion',
    motion: motionOf(left, right, statesSamples, example, t),
    timeline: timelineOf(t, seconds, example, states, calculations),
    initialStep: 0,
    moments: momentsOf(t, transition, example),
    legend: legendOf(t),
    caption: t('studyAifg.actuator.model.caption'),
    comparison: comparisonOf(t, example, seconds, states, alternative),
    inputs: inputsOf(t),
  };
}

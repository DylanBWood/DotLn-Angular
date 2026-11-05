import type { MotionFrame, MotionStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import {
  type MotorControlParameters,
  motorControlSamples,
  type MotorControlState,
  type MotorControlStep,
  motorControlStep,
} from './motor-control.simulation';
import { decimal } from './presentation';

function frameWorkedStep(
  t: StudyTranslate,
  seconds: number,
  example: MotorControlParameters,
  state: MotorControlState,
  calculation: MotorControlStep,
): MotionFrame['worked'] {
  return {
    title: t('studyAifg.motor-control.model.frame.worked.title', {
      seconds: decimal(seconds),
      secondsTimeStep: decimal(seconds + example.timeStep),
    }),
    lines: [
      t('studyAifg.motor-control.model.frame.worked.steps.askZeroVelocity', {
        velocity: decimal(state.velocity),
        responseTime: decimal(example.responseTime),
        rawRequest: decimal(calculation.rawRequest),
      }),
      t('studyAifg.motor-control.model.frame.worked.steps.engineMatchVelocityClipsRequest', {
        steeringLimit: decimal(example.steeringLimit),
        requested: decimal(calculation.requested),
      }),
      t('studyAifg.motor-control.model.frame.worked.steps.localMotorAppliesMax', {
        motorBrake: decimal(example.motorBrake),
        requested: decimal(calculation.requested),
        applied: decimal(calculation.applied),
      }),
      t('studyAifg.motor-control.model.frame.worked.steps.brakeWithoutReversingMax', {
        velocity: decimal(state.velocity),
        applied: decimal(calculation.applied),
        timeStep: decimal(example.timeStep),
        nextVelocity: decimal(calculation.next.velocity),
      }),
      t('studyAifg.motor-control.model.frame.worked.steps.moveUpdatedVelocity', {
        position: decimal(state.position),
        nextVelocity: decimal(calculation.next.velocity),
        timeStep: decimal(example.timeStep),
        nextPosition: decimal(calculation.next.position),
      }),
    ],
    note: t('studyAifg.motor-control.model.frame.worked.note'),
  };
}

function frameValues(
  state: MotorControlState,
  calculation: MotorControlStep,
  example: MotorControlParameters,
  seconds: number,
): MotionFrame['values'] {
  return {
    position: decimal(state.position),
    speed: decimal(state.velocity),
    requested: decimal(calculation.requested),
    applied: decimal(calculation.applied),
    remaining: decimal(example.stopLine - state.position),
    elapsed: decimal(seconds),
    duration: decimal(example.steps * example.timeStep),
    initialSpeed: String(example.initialSpeed),
    steeringLimit: String(example.steeringLimit),
    motorBrake: String(example.motorBrake),
    weakBrake: String(example.weakBrake),
    responseTime: String(example.responseTime),
    timeStep: String(example.timeStep),
    stopLine: String(example.stopLine),
  };
}

function frameDrawing(
  state: MotorControlState,
  t: StudyTranslate,
  calculation: MotorControlStep,
  example: MotorControlParameters,
  left: number,
  right: number,
): Pick<MotionFrame, 'bodies' | 'vectors' | 'marks' | 'links'> {
  return {
    bodies: [
      {
        id: 'rail-cart',
        x: state.position,
        y: 0,
        heading: 0,
        label: t('studyAifg.motor-control.model.frame.bodies.labels.cart'),
      },
    ],
    vectors: [
      { x: state.position, y: -3, dx: calculation.requested, dy: 0, tone: 'desired' },
      { x: state.position, y: 3, dx: calculation.applied, dy: 0, tone: 'actual' },
    ],
    marks: [
      {
        x: example.stopLine,
        y: 0,
        shape: 'cross',
        label: t('studyAifg.motor-control.model.frame.marks.labels.safetyLine'),
      },
    ],
    links: [
      { from: { x: left, y: 0 }, to: { x: right, y: 0 } },
      {
        from: { x: example.stopLine, y: -5 },
        to: { x: example.stopLine, y: 5 },
        tone: 'target',
      },
    ],
  };
}

function frameOf(
  state: MotorControlState,
  step: number,
  example: MotorControlParameters,
  left: number,
  right: number,
  t: StudyTranslate,
  calculation: ReturnType<typeof motorControlStep>,
): MotionFrame {
  const seconds = step * example.timeStep;
  const limited = Math.abs(calculation.requested) > example.motorBrake;
  return {
    seconds,
    ...frameDrawing(state, t, calculation, example, left, right),
    values: frameValues(state, calculation, example, seconds),
    note:
      state.position > example.stopLine
        ? t('studyAifg.motor-control.model.frame.notes.cartHasCrossedSafety')
        : limited
          ? t('studyAifg.motor-control.model.frame.notes.steeringRequestExceedsBrake')
          : state.velocity > 0.01
            ? t('studyAifg.motor-control.model.frame.notes.requestedBrakingNowFits')
            : t('studyAifg.motor-control.model.frame.notes.speedBelowDisplayedPrecision'),
    worked: frameWorkedStep(t, seconds, example, state, calculation),
  };
}

const positionFinding = (
  states: readonly MotorControlState[],
  brake: number,
  example: MotorControlParameters,
  t: StudyTranslate,
) => {
  const last = states[states.length - 1];
  const clearance = example.stopLine - last.position;
  const crossing = states.findIndex(({ position }) => position > example.stopLine);
  return t('studyAifg.motor-control.model.positionFinding.descriptions.brakeCapacityCartEnds', {
    brake: decimal(brake),
    lastPosition: decimal(last.position),
    absClearance: decimal(Math.abs(clearance)),
    clearanceBeforeBeyond:
      clearance >= 0
        ? t('studyAifg.motor-control.model.positionFinding.descriptions.before')
        : t('studyAifg.motor-control.model.positionFinding.descriptions.beyond'),
    crossingStatus:
      crossing < 0
        ? t('studyAifg.motor-control.model.positionFinding.descriptions.neverCrossesLineRun')
        : t('studyAifg.motor-control.model.positionFinding.descriptions.firstCrosses', {
            crossingTimeStep: decimal(crossing * example.timeStep),
          }),
  });
};

function comparisonTimeline(
  t: StudyTranslate,
  seconds: number[],
  highest: number,
  example: MotorControlParameters,
  states: readonly MotorControlState[],
  weak: readonly MotorControlState[],
): NonNullable<MotionStudyModel['comparison']>['timeline'] {
  return {
    title: t('studyAifg.motor-control.model.comparison.timeline.title'),
    xLabel: t('studyAifg.motor-control.model.comparison.timeline.xLabel'),
    yLabel: t('studyAifg.motor-control.model.comparison.timeline.yLabel'),
    seconds,
    yRange: [0, Math.ceil(highest) + 1],
    reference: example.stopLine,
    series: [
      {
        id: 'normal',
        label: t('studyAifg.motor-control.model.comparison.timeline.series.labels.brakeCapacity', {
          motorBrake: decimal(example.motorBrake),
        }),
        tone: 'actual',
        values: states.map(({ position }) => position),
      },
      {
        id: 'weak',
        label: t('studyAifg.motor-control.model.comparison.timeline.series.labels.brakeCapacity2', {
          weakBrake: decimal(example.weakBrake),
        }),
        tone: 'desired',
        values: weak.map(({ position }) => position),
      },
    ],
  };
}

function comparisonOf(
  t: StudyTranslate,
  example: MotorControlParameters,
  seconds: number[],
  highest: number,
  states: readonly MotorControlState[],
  weak: readonly MotorControlState[],
): NonNullable<MotionStudyModel['comparison']> {
  return {
    title: t('studyAifg.motor-control.model.comparison.title'),
    intro: t('studyAifg.motor-control.model.comparison.intro', {
      motorBrake: decimal(example.motorBrake),
      weakBrake: decimal(example.weakBrake),
    }),
    timeline: comparisonTimeline(t, seconds, highest, example, states, weak),
    findings: [
      positionFinding(states, example.motorBrake, example, t),
      positionFinding(weak, example.weakBrake, example, t),
      t('studyAifg.motor-control.model.comparison.findings.motorCanLimitRequest'),
    ],
    note:
      example.motorBrake === example.weakBrake
        ? t('studyAifg.motor-control.model.comparison.notes.capacitiesEqualSoThese')
        : t('studyAifg.motor-control.model.comparison.notes.safetyLineHasNo'),
  };
}

function timelineOf(
  t: StudyTranslate,
  seconds: number[],
  example: MotorControlParameters,
  calculations: MotorControlStep[],
): MotionStudyModel['timeline'] {
  return {
    title: t('studyAifg.motor-control.model.timeline.title'),
    xLabel: t('studyAifg.motor-control.model.timeline.xLabel'),
    yLabel: t('studyAifg.motor-control.model.timeline.yLabel'),
    seconds,
    yRange: [
      Math.min(-example.steeringLimit, ...calculations.map(({ requested }) => requested)),
      0,
    ],
    reference: 0,
    series: [
      {
        id: 'requested',
        label: t('studyAifg.motor-control.model.timeline.series.labels.steeringRequest'),
        tone: 'desired',
        values: calculations.map(({ requested }) => requested),
      },
      {
        id: 'applied',
        label: t('studyAifg.motor-control.model.timeline.series.labels.appliedBraking'),
        tone: 'actual',
        values: calculations.map(({ applied }) => applied),
      },
    ],
  };
}

function motionOf(
  left: number,
  right: number,
  statesSamples: ReturnType<typeof motorControlSamples>,
  example: MotorControlParameters,
  t: StudyTranslate,
): MotionStudyModel['motion'] {
  const states = statesSamples.map(({ state }) => state);
  return {
    bounds: { minX: left - 1, maxX: right + 1, minY: -8, maxY: 8 },
    frames: states.map((state, step) =>
      frameOf(state, step, example, left, right, t, statesSamples[step].calculation),
    ),
    trail: true,
  };
}

function momentsOf(
  t: StudyTranslate,
  transition: number,
  example: MotorControlParameters,
): MotionStudyModel['moments'] {
  return [
    { label: t('studyAifg.motor-control.model.moments.labels.brakeCommand'), step: 0 },
    {
      label: t('studyAifg.motor-control.model.moments.labels.brakingUnderCap'),
      step: Math.floor(transition / 2),
    },
    { label: t('studyAifg.motor-control.model.moments.labels.requestFitsMotor'), step: transition },
    { label: t('studyAifg.motor-control.model.moments.labels.endRun'), step: example.steps },
  ];
}

function legendOf(t: StudyTranslate): MotionStudyModel['legend'] {
  return [
    { tone: 'subject', label: t('studyAifg.motor-control.model.legend.labels.railCart') },
    { tone: 'target', label: t('studyAifg.motor-control.model.legend.labels.safetyLine') },
    {
      tone: 'desired',
      label: t('studyAifg.motor-control.model.legend.labels.steeringAccelerationRequest'),
    },
    {
      tone: 'actual',
      label: t('studyAifg.motor-control.model.legend.labels.accelerationMotorApplies'),
    },
  ];
}

function inputsOf(t: StudyTranslate): MotionStudyModel['inputs'] {
  return [
    {
      name: 'motorBrake',
      label: t('studyAifg.motor-control.model.inputs.labels.motorBrakeCapacity'),
      unit: t('studyAifg.motor-control.model.inputs.units.acceleration'),
      min: 1,
      max: 6,
      step: 0.5,
    },
    {
      name: 'initialSpeed',
      label: t('studyAifg.motor-control.model.inputs.labels.initialSpeed'),
      unit: t('studyAifg.motor-control.model.inputs.units.speed'),
      min: 2,
      max: 10,
      step: 1,
    },
  ];
}

export function presentStudy(example: MotorControlParameters, t: StudyTranslate): MotionStudyModel {
  const statesSamples = motorControlSamples(example);
  const states = statesSamples.map(({ state }) => state);
  const weakSamples = motorControlSamples(example, example.weakBrake);
  const weak = weakSamples.map(({ state }) => state);
  const seconds = states.map((_state, step) => step * example.timeStep);
  const calculations = statesSamples.map(({ calculation }) => calculation);
  const left =
    Math.min(0, ...states.map((state, step) => state.position + calculations[step].requested)) - 2;
  const right = Math.max(example.stopLine, ...states.map(({ position }) => position)) + 2;
  const feasible = calculations.findIndex(
    ({ requested }) => Math.abs(requested) <= example.motorBrake,
  );
  const transition = feasible < 0 ? example.steps : feasible;
  const highest = Math.max(
    example.stopLine,
    ...states.map(({ position }) => position),
    ...weak.map(({ position }) => position),
  );
  return {
    family: 'motion',
    motion: motionOf(left, right, statesSamples, example, t),
    timeline: timelineOf(t, seconds, example, calculations),
    initialStep: 0,
    moments: momentsOf(t, transition, example),
    legend: legendOf(t),
    caption: t('studyAifg.motor-control.model.caption'),
    comparison: comparisonOf(t, example, seconds, highest, states, weak),
    inputs: inputsOf(t),
  };
}

import type { StudyParameters } from '@dotln-angular/models';
import { cosine, sine } from '@dotln-angular/scene-engine';

import type { MotionFrame, MotionStudyModel, StudyWorkedStep } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import {
  alignFrames,
  type AlignParameters,
  alignSamples,
  type AlignStep,
  type AngularState,
  calculateAlignStep,
  fullTurn,
  radians,
  wrapDegrees,
} from './align.simulation';
import { fixed } from './presentation';

function workedLines(
  t: StudyTranslate,
  example: AlignParameters,
  state: AngularState,
  calculation: AlignStep,
): readonly string[] {
  return [
    t('studyAifg.align.model.workedSubtractHeadingsWrapShortest', {
      exampleTargetHeading: fixed(example.targetHeading),
      stateHeading: fixed(state.heading),
      calculationRawError: fixed(calculation.rawError),
      calculationError: fixed(calculation.error),
    }),
    t('studyAifg.align.model.workedStopTestFailsError', {
      calculationError: fixed(Math.abs(calculation.error)),
      stateAngularVelocity: fixed(Math.abs(state.angularVelocity)),
    }),
    Math.abs(calculation.error) <= example.angleTolerance
      ? t('studyAifg.align.model.workedInsideToleranceRequestZero', {
          exampleAngleTolerance: fixed(example.angleTolerance),
        })
      : t('studyAifg.align.model.workedDesiredAngularVelocitySign', {
          calculationError: fixed(calculation.error),
          exampleMaxAngularSpeed: fixed(example.maxAngularSpeed),
          calculationError2: fixed(Math.abs(calculation.error)),
          exampleSlowRadius: fixed(example.slowRadius),
          calculationDesiredVelocity: fixed(calculation.desiredVelocity),
        }),
    t('studyAifg.align.model.workedRequestedAccelerationCapUse', {
      calculationDesiredVelocity: fixed(calculation.desiredVelocity),
      stateAngularVelocity: fixed(state.angularVelocity),
      exampleResponseTime: fixed(example.responseTime),
      calculationRequestedAcceleration: fixed(calculation.requestedAcceleration),
      exampleMaxAngularAcceleration: fixed(example.maxAngularAcceleration),
      calculationAcceleration: fixed(calculation.acceleration),
    }),
    t('studyAifg.align.model.workedAngularVelocityCapped', {
      stateAngularVelocity: fixed(state.angularVelocity),
      calculationAcceleration: fixed(calculation.acceleration),
      exampleTimeStep: fixed(example.timeStep),
      nextAngularVelocity: fixed(calculation.next.angularVelocity),
      exampleMaxAngularSpeed: fixed(example.maxAngularSpeed),
    }),
    t('studyAifg.align.model.workedHeadingPedestalStays', {
      stateHeading: fixed(state.heading),
      nextAngularVelocity: fixed(calculation.next.angularVelocity),
      exampleTimeStep: fixed(example.timeStep),
      nextHeading: fixed(calculation.next.heading),
      exampleCameraX: fixed(example.cameraX),
      exampleCameraY: fixed(example.cameraY),
    }),
  ];
}

function workedStep(
  t: StudyTranslate,
  state: AngularState,
  step: number,
  calculation: AlignStep,
  example: AlignParameters,
): StudyWorkedStep {
  const seconds = step * example.timeStep;
  if (calculation.settled)
    return {
      title: t('studyAifg.align.model.workedSettlingCheck', {
        seconds: fixed(seconds),
      }),
      lines: [
        t('studyAifg.align.model.workedWrappedErrorWithinAngular', {
          calculationError: fixed(calculation.error),
          exampleAngleTolerance: fixed(example.angleTolerance),
          stateAngularVelocity: fixed(state.angularVelocity),
          exampleSpeedTolerance: fixed(example.speedTolerance),
        }),
        t('studyAifg.align.model.workedApplySmallFinalCorrection', {
          stateHeading: fixed(state.heading),
          calculationError: fixed(calculation.error),
          nextHeading: fixed(calculation.next.heading),
          exampleTargetHeading: fixed(example.targetHeading),
        }),
      ],
      note: t('studyAifg.align.model.workedExplicitSettlingRuleSmall'),
    };
  return {
    title: t('studyAifg.align.model.workedWorkedTurn', {
      seconds: fixed(seconds),
      seconds2: fixed(seconds + example.timeStep),
    }),
    lines: workedLines(t, example, state, calculation),
    note:
      calculation.acceleration * state.angularVelocity < 0
        ? t('studyAifg.align.model.workedCameraTurningTowardsCommand')
        : t('studyAifg.align.model.workedRequestedAngularVelocityGoal'),
  };
}

function phaseOf(
  t: StudyTranslate,
  state: AngularState,
  step: number,
  calculation: AlignStep,
  example: AlignParameters,
): string {
  if (calculation.settled)
    return state.angularVelocity === 0 && calculation.error === 0
      ? t('studyAifg.align.model.phaseCameraHoldsCommandBecause')
      : t('studyAifg.align.model.phaseCameraCloseSlowEnough');
  if (step === 0) return t('studyAifg.align.model.phaseCommandLiesJustAcross');
  if (Math.abs(calculation.error) <= example.angleTolerance)
    return t('studyAifg.align.model.phaseCameraNearCommandTurning');
  if (calculation.error * state.angularVelocity < 0)
    return t('studyAifg.align.model.phaseCameraPassedCommandMust');
  if (calculation.error * wrapDegrees(example.targetHeading - example.initialHeading) < 0)
    return t('studyAifg.align.model.phaseCameraTurnsBackTowards');
  if (calculation.acceleration * state.angularVelocity < 0)
    return t('studyAifg.align.model.phaseCameraBrakesGapCloses');
  return calculation.acceleration * state.angularVelocity > 0 || state.angularVelocity === 0
    ? t('studyAifg.align.model.phaseCameraBuildsTurningSpeed')
    : t('studyAifg.align.model.phaseCameraKeepsTurningActual');
}

function frameOf(
  t: StudyTranslate,
  state: AngularState,
  step: number,
  example: AlignParameters,
  parameterValues: Readonly<Record<string, string>>,
  calculation: ReturnType<typeof calculateAlignStep>,
): MotionFrame {
  const commandLength = example.directionLength * 1.5;
  const command = {
    x: cosine(radians(example.targetHeading)) * commandLength,
    y: sine(radians(example.targetHeading)) * commandLength,
  };
  return {
    seconds: step * example.timeStep,
    bodies: [
      {
        id: 'dock-camera',
        label: t('studyAifg.align.model.camera'),
        x: example.cameraX,
        y: example.cameraY,
        heading: radians(state.heading),
      },
    ],
    marks: [
      {
        x: example.cameraX + command.x,
        y: example.cameraY + command.y,
        shape: 'ring',
        tone: 'desired',
        label: t('studyAifg.align.model.command'),
      },
    ],
    vectors: [
      {
        // Keep the facing arrow outside the name above the camera.
        x: example.cameraX + (cosine(radians(state.heading)) * example.directionLength) / 2,
        y: example.cameraY + (sine(radians(state.heading)) * example.directionLength) / 2,
        dx: (cosine(radians(state.heading)) * example.directionLength) / 2,
        dy: (sine(radians(state.heading)) * example.directionLength) / 2,
        tone: 'actual',
      },
      {
        x: example.cameraX,
        y: example.cameraY,
        dx: command.x,
        dy: command.y,
        tone: 'desired',
      },
    ],
    values: {
      ...parameterValues,
      seconds: fixed(step * example.timeStep),
      heading: fixed(wrapDegrees(state.heading)),
      continuousHeading: fixed(state.heading),
      rawError: fixed(calculation.rawError),
      error: fixed(calculation.error),
      alignmentText:
        calculation.error === 0
          ? t('studyAifg.align.model.valueCameraCommandPointSame')
          : t('studyAifg.align.model.valueCommandLiesCamera', {
              calculationError: fixed(Math.abs(calculation.error)),
              value2:
                calculation.error > 0
                  ? t('studyAifg.align.model.valueClockwise')
                  : t('studyAifg.align.model.valueAnticlockwise'),
            }),
      angularSpeed: fixed(state.angularVelocity),
      desiredAngularSpeed: fixed(calculation.desiredVelocity),
      acceleration: fixed(calculation.acceleration),
      nextAngularSpeed: fixed(calculation.next.angularVelocity),
      nextHeading: fixed(calculation.next.heading),
    },
    note: phaseOf(t, state, step, calculation, example),
    worked: workedStep(t, state, step, calculation, example),
  };
}

interface AlignmentSummary {
  readonly overshoot: number;
  readonly peakStep: number;
  readonly finalError: number;
  readonly finalAngularVelocity: number;
  readonly resting: boolean;
}

function summarise(states: readonly AngularState[], example: AlignParameters): AlignmentSummary {
  const turn = wrapDegrees(example.targetHeading - example.initialHeading);
  const direction = Math.sign(turn) || 1;
  const command = example.initialHeading + turn;
  const peakStep = states.reduce(
    (best, state, step) =>
      direction * state.heading >= direction * states[best].heading ? step : best,
    0,
  );
  const last = states[states.length - 1];
  const finalError = wrapDegrees(example.targetHeading - last.heading);
  return {
    overshoot: Math.max(0, direction * (states[peakStep].heading - command)),
    peakStep,
    finalError,
    finalAngularVelocity: last.angularVelocity,
    resting: finalError === 0 && last.angularVelocity === 0,
  };
}

function lateBraking(
  t: StudyTranslate,
  example: AlignParameters,
  current: readonly AngularState[],
): NonNullable<MotionStudyModel['comparison']> {
  const lateSamples = alignSamples(example, example.lateSlowRadius);
  const late = lateSamples.map(({ state }) => state);
  const normal = summarise(current, example);
  const comparison = summarise(late, example);
  const errorOf = (state: AngularState) => wrapDegrees(example.targetHeading - state.heading);
  const seconds = current.map((_state, step) => step * example.timeStep);
  return {
    title: t('studyAifg.align.model.lateBrakingCompareSlowingAnglesSame'),
    intro:
      example.slowRadius === example.lateSlowRadius
        ? t('studyAifg.align.model.lateBrakingRunsUseSlowingAngle', {
            exampleSlowRadius: fixed(example.slowRadius),
          })
        : t('studyAifg.align.model.lateBrakingChangeSlowingAngleCommand', {
            exampleSlowRadius: fixed(example.slowRadius),
            exampleLateSlowRadius: fixed(example.lateSlowRadius),
          }),
    timeline: {
      title: t('studyAifg.align.model.lateBrakingSignedHeadingError'),
      xLabel: t('studyAifg.align.model.lateBrakingTimeSeconds'),
      yLabel: t('studyAifg.align.model.lateBrakingSignedHeadingErrorDegrees'),
      seconds,
      reference: 0,
      series: [
        {
          id: 'normal',
          label: t('studyAifg.align.model.lateBrakingSolidGreenCurrentSlowing', {
            exampleSlowRadius: fixed(example.slowRadius),
          }),
          tone: 'actual',
          values: current.map(errorOf),
        },
        {
          id: 'late',
          label: t('studyAifg.align.model.lateBrakingDashedAmberSlowingAngle', {
            exampleLateSlowRadius: fixed(example.lateSlowRadius),
          }),
          tone: 'desired',
          values: late.map(errorOf),
        },
      ],
      marks: [
        { x: seconds[comparison.peakStep], y: errorOf(late[comparison.peakStep]), tone: 'desired' },
      ],
    },
    findings: [
      comparison.overshoot > 0
        ? t('studyAifg.align.model.lateBrakingRunPassesCommandCurrent', {
            exampleLateSlowRadius: fixed(example.lateSlowRadius),
            comparisonOvershoot: fixed(comparison.overshoot),
            seconds: fixed(seconds[comparison.peakStep]),
            normalOvershoot: fixed(normal.overshoot),
          })
        : t('studyAifg.align.model.lateBrakingRunApproachesWithoutPassing', {
            exampleLateSlowRadius: fixed(example.lateSlowRadius),
            normalOvershoot: fixed(normal.overshoot),
          }),
      t('studyAifg.align.model.lateBrakingCurrentRunSignedError', {
        seconds: fixed(seconds[seconds.length - 1]),
        value2: normal.resting
          ? t('studyAifg.align.model.lateBrakingRest')
          : t('studyAifg.align.model.lateBrakingCorrecting'),
        normalFinalError: fixed(normal.finalError),
        normalFinalAngularVelocity: fixed(normal.finalAngularVelocity),
        value5: comparison.resting
          ? t('studyAifg.align.model.lateBrakingRest')
          : t('studyAifg.align.model.lateBrakingCorrecting'),
        comparisonFinalError: fixed(comparison.finalError),
        comparisonFinalAngularVelocity: fixed(comparison.finalAngularVelocity),
      }),
    ],
    note: t('studyAifg.align.model.lateBrakingHorizontalReferenceExactAlignment'),
  };
}

function runTimeline(
  t: StudyTranslate,
  states: ReturnType<typeof alignFrames>,
  example: AlignParameters,
  calculations: AlignStep[],
): NonNullable<MotionStudyModel['timeline']> {
  return {
    title: t('studyAifg.align.model.angularVelocity'),
    xLabel: t('studyAifg.align.model.lateBrakingTimeSeconds'),
    yLabel: t('studyAifg.align.model.angularVelocityDegrees'),
    seconds: states.map((_state, step) => step * example.timeStep),
    reference: 0,
    series: [
      {
        id: 'actual',
        label: t('studyAifg.align.model.solidGreenActualAngular'),
        tone: 'actual',
        values: states.map(({ angularVelocity }) => angularVelocity),
      },
      {
        id: 'desired',
        label: t('studyAifg.align.model.dashedAmberDesiredAngular'),
        tone: 'desired',
        values: calculations.map(({ desiredVelocity }) => desiredVelocity),
      },
    ],
  };
}

function runMoments(
  t: StudyTranslate,
  braking: number,
  boundary: number,
  inside: number,
  stopped: number,
  last: number,
): MotionStudyModel['moments'] {
  return [
    { label: t('studyAifg.align.model.startAcrossAngleBoundary'), step: 0 },
    ...(braking < 0 ? [] : [{ label: t('studyAifg.align.model.brakingBegins'), step: braking }]),
    ...(boundary < 0
      ? []
      : [
          {
            label: t('studyAifg.align.model.headingCrossesBoundary'),
            step: boundary,
          },
        ]),
    ...(inside < 0
      ? []
      : [{ label: t('studyAifg.align.model.insideAngleTolerance'), step: inside }]),
    {
      label:
        stopped < 0
          ? t('studyAifg.align.model.stillCorrectingMoment')
          : t('studyAifg.align.model.atRestMoment'),
      step: stopped < 0 ? last : stopped,
    },
  ];
}

function runInputs(t: StudyTranslate): MotionStudyModel['inputs'] {
  return [
    {
      name: 'slowRadius',
      label: t('studyAifg.align.model.slowingAngle'),
      unit: t('studyAifg.align.model.degreeUnit'),
      min: 2,
      max: 90,
      step: 2,
    },
    {
      name: 'maxAngularAcceleration',
      label: t('studyAifg.align.model.motorAccelerationLimit'),
      unit: t('studyAifg.align.model.inputsUnitS'),
      min: 30,
      max: 120,
      step: 10,
    },
  ];
}

export const present = (
  example: AlignParameters,
  statesSamples: ReturnType<typeof alignSamples>,
  parameters: StudyParameters,
  t: StudyTranslate,
): MotionStudyModel => {
  const states = statesSamples.map(({ state }) => state);
  const calculations = statesSamples.map(({ calculation }) => calculation);
  const last = states.length - 1;
  const braking = states.findIndex(
    (state, step) => calculations[step].acceleration * state.angularVelocity < 0,
  );
  const initialTurn = Math.floor((example.initialHeading + fullTurn / 2) / fullTurn);
  const boundary = states.findIndex(
    (state) => Math.floor((state.heading + fullTurn / 2) / fullTurn) !== initialTurn,
  );
  const inside = states.findIndex(
    (_state, step) => Math.abs(calculations[step].error) <= example.angleTolerance,
  );
  const stopped = states.findIndex(
    (state, step) => calculations[step].settled && state.angularVelocity === 0,
  );
  const summary = summarise(states, example);
  const duration = example.steps * example.timeStep;
  const parameterValues = {
    ...Object.fromEntries(
      Object.entries(parameters).map(([name, value]) => [
        name,
        typeof value === 'number' ? fixed(value) : value,
      ]),
    ),
    runOutcome: t('studyAifg.align.model.currentRun', {
      value1:
        summary.overshoot > 0
          ? t('studyAifg.align.model.passesCommand', {
              summaryOvershoot: fixed(summary.overshoot),
            })
          : t('studyAifg.align.model.approachesWithoutPassingCommand'),
      value2: summary.resting
        ? t('studyAifg.align.model.rest')
        : t('studyAifg.align.model.correcting'),
      duration: fixed(duration),
    }),
  };
  // Extra space around the fixed command keeps its name beyond every camera-facing ray.
  const extent = example.directionLength * 2;
  return {
    family: 'motion',
    motion: {
      bounds: {
        minX: example.cameraX - extent,
        maxX: example.cameraX + extent,
        minY: example.cameraY - extent,
        maxY: example.cameraY + extent,
      },
      frames: states.map((state, step) =>
        frameOf(t, state, step, example, parameterValues, statesSamples[step].calculation),
      ),
    },
    timeline: runTimeline(t, states, example, calculations),
    initialStep: boundary < 0 ? Math.max(0, braking) : boundary,
    moments: runMoments(t, braking, boundary, inside, stopped, last),
    legend: [
      { tone: 'actual', label: t('studyAifg.align.model.solidGreenActual') },
      { tone: 'desired', label: t('studyAifg.align.model.dashedAmberDesired') },
    ],
    caption: t('studyAifg.align.model.caption'),
    comparison: lateBraking(t, example, states),
    inputs: runInputs(t),
  };
};

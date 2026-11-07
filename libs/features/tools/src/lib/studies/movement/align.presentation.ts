import type { StudyParameters } from '@dotln-angular/models';
import { cosine, sine } from '@dotln-angular/scene-engine';

import { createNumberFormat } from '../number-format';
import type {
  MotionFrame,
  MotionStudyModel,
  StudyComparison,
  StudyInput,
  StudyMoment,
  StudyValues,
  StudyWorkedStep,
  TimelineModel,
} from '../study-model';
import type { StudyTranslate } from '../study-translate';
import {
  type AlignParameters,
  type AlignSample,
  alignSamples,
  type AlignStep,
  type AngularState,
  fullTurn,
  radians,
  wrapDegrees,
} from './align.simulation';

function selectMoments(
  example: AlignParameters,
  samples: readonly AlignSample[],
): AlignmentMoments {
  const states = samples.map(({ state }) => state);
  const calculations = samples.map(({ calculation }) => calculation);
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

  return { braking, boundary, inside, stopped, last };
}

interface AlignFrameDescription {
  readonly example: AlignParameters;
  readonly sample: AlignSample;
  readonly step: number;
  readonly parameterValues: StudyValues;
}
interface AlignmentMoments {
  readonly braking: number;
  readonly boundary: number;
  readonly inside: number;
  readonly stopped: number;
  readonly last: number;
}

const { number: fixed } = createNumberFormat({ normalizeNegativeZero: true });

function workedLines(t: StudyTranslate, frame: AlignFrameDescription): readonly string[] {
  const {
    example,
    sample: { state, calculation },
  } = frame;

  return [
    t('studyAifg.align.model.worked.subtractHeadingsWrapShortest', {
      exampleTargetHeading: fixed(example.targetHeading),
      stateHeading: fixed(state.heading),
      calculationRawError: fixed(calculation.rawError),
      calculationError: fixed(calculation.error),
    }),
    t('studyAifg.align.model.worked.stopTestFailsError', {
      calculationError: fixed(Math.abs(calculation.error)),
      stateAngularVelocity: fixed(Math.abs(state.angularVelocity)),
    }),
    Math.abs(calculation.error) <= example.angleTolerance
      ? t('studyAifg.align.model.worked.insideToleranceRequestZero', {
          exampleAngleTolerance: fixed(example.angleTolerance),
        })
      : t('studyAifg.align.model.worked.desiredAngularVelocitySign', {
          calculationError: fixed(calculation.error),
          exampleMaxAngularSpeed: fixed(example.maxAngularSpeed),
          absoluteError: fixed(Math.abs(calculation.error)),
          exampleSlowRadius: fixed(example.slowRadius),
          calculationDesiredVelocity: fixed(calculation.desiredVelocity),
        }),
    t('studyAifg.align.model.worked.requestedAccelerationCapUse', {
      calculationDesiredVelocity: fixed(calculation.desiredVelocity),
      stateAngularVelocity: fixed(state.angularVelocity),
      exampleResponseTime: fixed(example.responseTime),
      calculationRequestedAcceleration: fixed(calculation.requestedAcceleration),
      exampleMaxAngularAcceleration: fixed(example.maxAngularAcceleration),
      calculationAcceleration: fixed(calculation.acceleration),
    }),
    t('studyAifg.align.model.worked.angularVelocityCapped', {
      stateAngularVelocity: fixed(state.angularVelocity),
      calculationAcceleration: fixed(calculation.acceleration),
      exampleTimeStep: fixed(example.timeStep),
      nextAngularVelocity: fixed(calculation.next.angularVelocity),
      exampleMaxAngularSpeed: fixed(example.maxAngularSpeed),
    }),
    t('studyAifg.align.model.worked.headingPedestalStays', {
      stateHeading: fixed(state.heading),
      nextAngularVelocity: fixed(calculation.next.angularVelocity),
      exampleTimeStep: fixed(example.timeStep),
      nextHeading: fixed(calculation.next.heading),
      exampleCameraX: fixed(example.cameraX),
      exampleCameraY: fixed(example.cameraY),
    }),
  ];
}

function workedStep(t: StudyTranslate, frame: AlignFrameDescription): StudyWorkedStep {
  const {
    example,
    step,
    sample: { state, calculation },
  } = frame;

  const seconds = step * example.timeStep;
  if (calculation.settled)
    return {
      title: t('studyAifg.align.model.worked.settlingCheck', {
        seconds: fixed(seconds),
      }),
      lines: [
        t('studyAifg.align.model.worked.wrappedErrorWithinAngular', {
          calculationError: fixed(calculation.error),
          exampleAngleTolerance: fixed(example.angleTolerance),
          stateAngularVelocity: fixed(state.angularVelocity),
          exampleSpeedTolerance: fixed(example.speedTolerance),
        }),
        t('studyAifg.align.model.worked.applySmallFinalCorrection', {
          stateHeading: fixed(state.heading),
          calculationError: fixed(calculation.error),
          nextHeading: fixed(calculation.next.heading),
          exampleTargetHeading: fixed(example.targetHeading),
        }),
      ],
      note: t('studyAifg.align.model.worked.explicitSettlingRuleSmall'),
    };
  return {
    title: t('studyAifg.align.model.worked.workedTurn', {
      seconds: fixed(seconds),
      nextSeconds: fixed(seconds + example.timeStep),
    }),
    lines: workedLines(t, frame),
    note:
      calculation.acceleration * state.angularVelocity < 0
        ? t('studyAifg.align.model.worked.cameraTurningTowardsCommand')
        : t('studyAifg.align.model.worked.requestedAngularVelocityGoal'),
  };
}

function phaseOf(t: StudyTranslate, frame: AlignFrameDescription): string {
  const {
    example,
    step,
    sample: { state, calculation },
  } = frame;

  if (calculation.settled)
    return state.angularVelocity === 0 && calculation.error === 0
      ? t('studyAifg.align.model.phase.cameraHoldsCommandBecause')
      : t('studyAifg.align.model.phase.cameraCloseSlowEnough');
  if (step === 0) return t('studyAifg.align.model.phase.commandLiesJustAcross');
  if (Math.abs(calculation.error) <= example.angleTolerance)
    return t('studyAifg.align.model.phase.cameraNearCommandTurning');
  if (calculation.error * state.angularVelocity < 0)
    return t('studyAifg.align.model.phase.cameraPassedCommandMust');
  if (calculation.error * wrapDegrees(example.targetHeading - example.initialHeading) < 0)
    return t('studyAifg.align.model.phase.cameraTurnsBackTowards');
  if (calculation.acceleration * state.angularVelocity < 0)
    return t('studyAifg.align.model.phase.cameraBrakesGapCloses');
  return calculation.acceleration * state.angularVelocity > 0 || state.angularVelocity === 0
    ? t('studyAifg.align.model.phase.cameraBuildsTurningSpeed')
    : t('studyAifg.align.model.phase.cameraKeepsTurningActual');
}

function frameOf(t: StudyTranslate, frame: AlignFrameDescription): MotionFrame {
  const {
    example,
    step,
    parameterValues,
    sample: { state, calculation },
  } = frame;

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
        label: t('studyAifg.align.model.labels.camera'),
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
        label: t('studyAifg.align.model.labels.command'),
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
          ? t('studyAifg.align.model.values.cameraCommandPointSame')
          : t('studyAifg.align.model.values.commandLiesCamera', {
              calculationError: fixed(Math.abs(calculation.error)),
              direction:
                calculation.error > 0
                  ? t('studyAifg.align.model.values.clockwise')
                  : t('studyAifg.align.model.values.anticlockwise'),
            }),
      angularSpeed: fixed(state.angularVelocity),
      desiredAngularSpeed: fixed(calculation.desiredVelocity),
      acceleration: fixed(calculation.acceleration),
      nextAngularSpeed: fixed(calculation.next.angularVelocity),
      nextHeading: fixed(calculation.next.heading),
    },
    note: phaseOf(t, frame),
    worked: workedStep(t, frame),
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
): StudyComparison {
  const lateSamples = alignSamples(example, example.lateSlowRadius);
  const late = lateSamples.map(({ state }) => state);
  const normal = summarise(current, example);
  const comparison = summarise(late, example);
  const errorOf = (state: AngularState) => wrapDegrees(example.targetHeading - state.heading);
  const seconds = current.map((_state, step) => step * example.timeStep);
  return {
    title: t('studyAifg.align.model.comparison.compareSlowingAnglesSame'),
    intro:
      example.slowRadius === example.lateSlowRadius
        ? t('studyAifg.align.model.comparison.runsUseSlowingAngle', {
            exampleSlowRadius: fixed(example.slowRadius),
          })
        : t('studyAifg.align.model.comparison.changeSlowingAngleCommand', {
            exampleSlowRadius: fixed(example.slowRadius),
            exampleLateSlowRadius: fixed(example.lateSlowRadius),
          }),
    timeline: {
      title: t('studyAifg.align.model.comparison.signedHeadingError'),
      xLabel: t('studyAifg.align.model.comparison.timeSeconds'),
      yLabel: t('studyAifg.align.model.comparison.signedHeadingErrorDegrees'),
      seconds,
      reference: 0,
      series: [
        {
          id: 'normal',
          label: t('studyAifg.align.model.comparison.solidGreenCurrentSlowing', {
            exampleSlowRadius: fixed(example.slowRadius),
          }),
          tone: 'actual',
          values: current.map(errorOf),
        },
        {
          id: 'late',
          label: t('studyAifg.align.model.comparison.dashedAmberSlowingAngle', {
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
        ? t('studyAifg.align.model.comparison.runPassesCommandCurrent', {
            exampleLateSlowRadius: fixed(example.lateSlowRadius),
            comparisonOvershoot: fixed(comparison.overshoot),
            seconds: fixed(seconds[comparison.peakStep]),
            normalOvershoot: fixed(normal.overshoot),
          })
        : t('studyAifg.align.model.comparison.runApproachesWithoutPassing', {
            exampleLateSlowRadius: fixed(example.lateSlowRadius),
            normalOvershoot: fixed(normal.overshoot),
          }),
      t('studyAifg.align.model.comparison.currentRunSignedError', {
        seconds: fixed(seconds[seconds.length - 1]),
        currentStatus: normal.resting
          ? t('studyAifg.align.model.comparison.rest')
          : t('studyAifg.align.model.comparison.correcting'),
        normalFinalError: fixed(normal.finalError),
        normalFinalAngularVelocity: fixed(normal.finalAngularVelocity),
        comparisonStatus: comparison.resting
          ? t('studyAifg.align.model.comparison.rest')
          : t('studyAifg.align.model.comparison.correcting'),
        comparisonFinalError: fixed(comparison.finalError),
        comparisonFinalAngularVelocity: fixed(comparison.finalAngularVelocity),
      }),
    ],
    note: t('studyAifg.align.model.comparison.horizontalReferenceExactAlignment'),
  };
}

function runTimeline(
  t: StudyTranslate,
  states: readonly AngularState[],
  example: AlignParameters,
  calculations: AlignStep[],
): TimelineModel {
  return {
    title: t('studyAifg.align.model.timeline.angularVelocity'),
    xLabel: t('studyAifg.align.model.comparison.timeSeconds'),
    yLabel: t('studyAifg.align.model.timeline.angularVelocityDegrees'),
    seconds: states.map((_state, step) => step * example.timeStep),
    reference: 0,
    series: [
      {
        id: 'actual',
        label: t('studyAifg.align.model.timeline.solidGreenActualAngular'),
        tone: 'actual',
        values: states.map(({ angularVelocity }) => angularVelocity),
      },
      {
        id: 'desired',
        label: t('studyAifg.align.model.timeline.dashedAmberDesiredAngular'),
        tone: 'desired',
        values: calculations.map(({ desiredVelocity }) => desiredVelocity),
      },
    ],
  };
}

function runMoments(t: StudyTranslate, selection: AlignmentMoments): readonly StudyMoment[] {
  const { braking, boundary, inside, stopped, last } = selection;

  return [
    { label: t('studyAifg.align.model.moments.startAcrossAngleBoundary'), step: 0 },
    ...(braking < 0
      ? []
      : [{ label: t('studyAifg.align.model.moments.brakingBegins'), step: braking }]),
    ...(boundary < 0
      ? []
      : [
          {
            label: t('studyAifg.align.model.moments.headingCrossesBoundary'),
            step: boundary,
          },
        ]),
    ...(inside < 0
      ? []
      : [{ label: t('studyAifg.align.model.moments.insideAngleTolerance'), step: inside }]),
    {
      label:
        stopped < 0
          ? t('studyAifg.align.model.moments.stillCorrectingMoment')
          : t('studyAifg.align.model.moments.atRestMoment'),
      step: stopped < 0 ? last : stopped,
    },
  ];
}

function runInputs(t: StudyTranslate): readonly StudyInput[] {
  return [
    {
      name: 'slowRadius',
      label: t('studyAifg.align.model.inputs.slowingAngle'),
      unit: t('studyAifg.align.model.inputs.degreeUnit'),
      min: 2,
      max: 90,
      step: 2,
    },
    {
      name: 'maxAngularAcceleration',
      label: t('studyAifg.align.model.inputs.motorAccelerationLimit'),
      unit: t('studyAifg.align.model.inputs.unitS'),
      min: 30,
      max: 120,
      step: 10,
    },
  ];
}

export const present = (
  example: AlignParameters,
  statesSamples: readonly AlignSample[],
  parameters: StudyParameters,
  t: StudyTranslate,
): MotionStudyModel => {
  const states = statesSamples.map(({ state }) => state);
  const calculations = statesSamples.map(({ calculation }) => calculation);
  const selection = selectMoments(example, statesSamples);
  const { braking, boundary } = selection;
  const summary = summarise(states, example);
  const duration = example.steps * example.timeStep;
  const parameterValues = {
    ...Object.fromEntries(
      Object.entries(parameters).map(([name, value]) => [
        name,
        typeof value === 'number' ? fixed(value) : value,
      ]),
    ),
    runOutcome: t('studyAifg.align.model.values.currentRun', {
      approach:
        summary.overshoot > 0
          ? t('studyAifg.align.model.values.passesCommand', {
              summaryOvershoot: fixed(summary.overshoot),
            })
          : t('studyAifg.align.model.values.approachesWithoutPassingCommand'),
      status: summary.resting
        ? t('studyAifg.align.model.values.rest')
        : t('studyAifg.align.model.values.correcting'),
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
      frames: statesSamples.map((sample, step) =>
        frameOf(t, { example, sample, step, parameterValues }),
      ),
    },
    timeline: runTimeline(t, states, example, calculations),
    initialStep: boundary < 0 ? Math.max(0, braking) : boundary,
    moments: runMoments(t, selection),
    legend: [
      { tone: 'actual', label: t('studyAifg.align.model.labels.solidGreenActual') },
      { tone: 'desired', label: t('studyAifg.align.model.labels.dashedAmberDesired') },
    ],
    caption: t('studyAifg.align.model.overview.caption'),
    comparison: lateBraking(t, example, states),
    inputs: runInputs(t),
  };
};

import type { MotionFrame, MotionStudyModel, StudyWorkedStep } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { fixed } from './presentation';
import {
  calculateVariableMatchingStep,
  type VariableMatchingParameters,
  variableMatchingSamples,
  type VariableMatchingState,
  type VariableMatchingStep,
} from './variable-matching.simulation';

function workedStep(
  state: VariableMatchingState,
  step: number,
  calculation: VariableMatchingStep,
  example: VariableMatchingParameters,
  t: StudyTranslate,
): StudyWorkedStep {
  return {
    title: t('studyAifg.variable-matching.model.workedStep.title', {
      timeStep: fixed(step * example.timeStep),
    }),
    lines: [
      t('studyAifg.variable-matching.model.workedStep.steps.selectVelocityPilotSora', {
        pilotVelocity: fixed(example.pilotVelocity),
        skiffVelocity: fixed(state.skiffVelocity),
        velocityError: fixed(calculation.velocityError),
      }),
      t('studyAifg.variable-matching.model.workedStep.steps.correctionTarget', {
        skiffVelocity: fixed(state.skiffVelocity),
        correctionDirection: fixed(example.correctionDirection),
        velocityError: fixed(calculation.velocityError),
        correctionTarget: fixed(calculation.correctionTarget),
      }),
      t('studyAifg.variable-matching.model.workedStep.steps.requestEngineMatchVelocityCaps', {
        correctionTarget: fixed(calculation.correctionTarget),
        skiffVelocity: fixed(state.skiffVelocity),
        responseTime: fixed(example.responseTime),
        requestedAcceleration: fixed(calculation.requestedAcceleration),
        acceleration: fixed(calculation.acceleration),
      }),
      t('studyAifg.variable-matching.model.workedStep.steps.trialVelocityLimitGives', {
        skiffVelocity: fixed(state.skiffVelocity),
        acceleration: fixed(calculation.acceleration),
        timeStep: fixed(example.timeStep),
        trialVelocity: fixed(calculation.trialVelocity),
        maxSpeed: fixed(example.maxSpeed),
        nextSkiffVelocity: fixed(calculation.next.skiffVelocity),
      }),
      t('studyAifg.variable-matching.model.workedStep.steps.moveSora', {
        skiffPosition: fixed(state.skiffPosition),
        nextSkiffVelocity: fixed(calculation.next.skiffVelocity),
        timeStep: fixed(example.timeStep),
        nextSkiffPosition: fixed(calculation.next.skiffPosition),
      }),
      t('studyAifg.variable-matching.model.workedStep.steps.movePilotPositionGap', {
        pilotPosition: fixed(state.pilotPosition),
        pilotVelocity: fixed(example.pilotVelocity),
        timeStep: fixed(example.timeStep),
        nextPilotPosition: fixed(calculation.next.pilotPosition),
        nextPositionGap: fixed(calculation.next.pilotPosition - calculation.next.skiffPosition),
      }),
    ],
    note:
      Math.abs(calculation.requestedAcceleration) > example.maxAcceleration ||
      Math.abs(calculation.trialVelocity) > example.maxSpeed
        ? t('studyAifg.variable-matching.model.workedStep.notes.limitClipsUpdateSo')
        : t('studyAifg.variable-matching.model.workedStep.notes.neitherLimitClippingNext', {
            correctionDirection: fixed(example.correctionDirection),
            timeStep: fixed(example.timeStep),
            responseTime: fixed(example.responseTime),
            errorMultiplier: fixed(
              1 - (example.correctionDirection * example.timeStep) / example.responseTime,
            ),
          }),
  };
}

function frameValues(
  step: number,
  example: VariableMatchingParameters,
  state: VariableMatchingState,
  positionGap: number,
  calculation: VariableMatchingStep,
): MotionFrame['values'] {
  return {
    seconds: fixed(step * example.timeStep),
    skiffStart: fixed(example.skiffStart),
    initialVelocity: fixed(example.initialVelocity),
    pilotStart: fixed(example.pilotStart),
    pilotVelocity: fixed(example.pilotVelocity),
    skiffPosition: fixed(state.skiffPosition),
    skiffVelocity: fixed(state.skiffVelocity),
    pilotPosition: fixed(state.pilotPosition),
    positionGap: fixed(positionGap),
    velocityError: fixed(calculation.velocityError),
    correctionDirection: fixed(example.correctionDirection),
    comparisonDirection: fixed(-example.correctionDirection),
    correctionTarget: fixed(calculation.correctionTarget),
    requestedAcceleration: fixed(calculation.requestedAcceleration),
    acceleration: fixed(calculation.acceleration),
    nextVelocity: fixed(calculation.next.skiffVelocity),
    nextPosition: fixed(calculation.next.skiffPosition),
    responseTime: fixed(example.responseTime),
    maxAcceleration: fixed(example.maxAcceleration),
    maxSpeed: fixed(example.maxSpeed),
    timeStep: fixed(example.timeStep),
    errorMultiplier: fixed(
      1 - (example.correctionDirection * example.timeStep) / example.responseTime,
    ),
    arrowSeconds: fixed(example.arrowSeconds),
    matchingTolerance: fixed(example.matchingTolerance),
  };
}

function frameDrawing(
  t: StudyTranslate,
  state: VariableMatchingState,
  example: VariableMatchingParameters,
): Pick<MotionFrame, 'bodies' | 'vectors' | 'links'> {
  return {
    bodies: [
      {
        id: 'sora',
        label: t('studyAifg.variable-matching.model.frame.bodies.labels.sora'),
        x: state.skiffPosition,
        y: 0,
        tone: 'subject',
      },
      {
        id: 'pilot',
        label: t('studyAifg.variable-matching.model.frame.bodies.labels.pilot'),
        x: state.pilotPosition,
        y: 0,
        tone: 'target',
      },
    ],
    vectors: [
      {
        x: state.skiffPosition,
        y: -example.arrowLane,
        dx: state.skiffVelocity * example.arrowSeconds,
        dy: 0,
        tone: 'actual',
      },
      {
        x: state.skiffPosition,
        y: example.arrowLane,
        dx: example.pilotVelocity * example.arrowSeconds,
        dy: 0,
        tone: 'desired',
      },
    ],
    links: [
      {
        from: { x: state.skiffPosition, y: 0 },
        to: { x: state.pilotPosition, y: 0 },
        tone: 'muted',
      },
    ],
  };
}

function frameOf(
  state: VariableMatchingState,
  step: number,
  example: VariableMatchingParameters,
  t: StudyTranslate,
  calculation: ReturnType<typeof calculateVariableMatchingStep>,
): MotionFrame {
  const positionGap = state.pilotPosition - state.skiffPosition;
  const errorMagnitude = Math.abs(calculation.velocityError);
  const nextErrorMagnitude = Math.abs(example.pilotVelocity - calculation.next.skiffVelocity);
  const note =
    errorMagnitude <= example.matchingTolerance
      ? t('studyAifg.variable-matching.model.frame.notes.velocitiesNearlyAgreeBut')
      : nextErrorMagnitude > errorMagnitude
        ? t('studyAifg.variable-matching.model.frame.notes.reversedCorrectionIncreasesVelocity')
        : nextErrorMagnitude < errorMagnitude
          ? t('studyAifg.variable-matching.model.frame.notes.soraClosesVelocityError')
          : t('studyAifg.variable-matching.model.frame.notes.motorCannotChangeVelocity');
  return {
    seconds: step * example.timeStep,
    ...frameDrawing(t, state, example),
    values: frameValues(step, example, state, positionGap, calculation),
    note,
    worked: workedStep(state, step, calculation, example, t),
  };
}

function reversedComparison(
  states: readonly VariableMatchingState[],
  example: VariableMatchingParameters,
  t: StudyTranslate,
): NonNullable<MotionStudyModel['comparison']> {
  const reversedSamples = variableMatchingSamples({
    ...example,
    correctionDirection: -example.correctionDirection,
  });
  const reversed = reversedSamples.map(({ state }) => state);
  const errors = (run: readonly VariableMatchingState[]) =>
    run.map(({ skiffVelocity }) => example.pilotVelocity - skiffVelocity);
  const selectedErrors = errors(states);
  const reversedErrors = errors(reversed);
  const last = states[states.length - 1];
  const reversedLast = reversed[reversed.length - 1];
  return {
    title: t('studyAifg.variable-matching.model.reversedComparison.title'),
    intro: t('studyAifg.variable-matching.model.reversedComparison.intro', {
      correctionDirection: fixed(example.correctionDirection),
      correctionDirection2: fixed(-example.correctionDirection),
    }),
    timeline: {
      title: t('studyAifg.variable-matching.model.reversedComparison.timeline.title'),
      xLabel: t('studyAifg.variable-matching.model.reversedComparison.timeline.xLabel'),
      yLabel: t('studyAifg.variable-matching.model.reversedComparison.timeline.yLabel'),
      seconds: states.map((_state, step) => step * example.timeStep),
      yRange: [
        Math.min(0, ...selectedErrors, ...reversedErrors),
        Math.max(example.matchingTolerance, ...selectedErrors, ...reversedErrors),
      ],
      reference: 0,
      series: [
        {
          id: 'selected',
          label: t(
            'studyAifg.variable-matching.model.reversedComparison.timeline.series.labels.directionCorrectionDirection',
            {
              correctionDirection: example.correctionDirection,
            },
          ),
          tone: 'actual',
          values: selectedErrors,
        },
        {
          id: 'reversed',
          label: t(
            'studyAifg.variable-matching.model.reversedComparison.timeline.series.labels.directionCorrectionDirection',
            { correctionDirection: -example.correctionDirection },
          ),
          tone: 'desired',
          values: reversedErrors,
        },
      ],
    },
    findings: [
      t(
        'studyAifg.variable-matching.model.reversedComparison.findings.selectedDirectionEndsVelocity',
        {
          finalVelocityError: fixed(example.pilotVelocity - last.skiffVelocity),
          finalPositionGap: fixed(last.pilotPosition - last.skiffPosition),
          reversedFinalVelocityError: fixed(example.pilotVelocity - reversedLast.skiffVelocity),
          reversedFinalPositionGap: fixed(reversedLast.pilotPosition - reversedLast.skiffPosition),
        },
      ),
      t('studyAifg.variable-matching.model.reversedComparison.findings.reversalActsVelocityError'),
    ],
    note: t('studyAifg.variable-matching.model.reversedComparison.note'),
  };
}

function timelineOf(
  t: StudyTranslate,
  frames: MotionFrame[],
  errors: number[],
  example: VariableMatchingParameters,
): MotionStudyModel['timeline'] {
  return {
    title: t('studyAifg.variable-matching.model.timeline.title'),
    xLabel: t('studyAifg.variable-matching.model.timeline.xLabel'),
    yLabel: t('studyAifg.variable-matching.model.timeline.yLabel'),
    seconds: frames.map(({ seconds }) => seconds),
    yRange: [Math.min(0, ...errors), Math.max(example.matchingTolerance, ...errors)],
    reference: 0,
    series: [
      {
        id: 'velocity-error',
        label: t('studyAifg.variable-matching.model.timeline.series.labels.velocityError'),
        tone: 'actual',
        values: errors,
      },
    ],
  };
}

function motionOf(
  minX: number,
  maxX: number,
  height: number,
  frames: MotionFrame[],
): MotionStudyModel['motion'] {
  return {
    bounds: { minX, maxX, minY: -height / 2, maxY: height / 2 },
    frames,
    trail: true,
  };
}

function momentsOf(
  t: StudyTranslate,
  initialStep: number,
  nearlyMatched: number,
  example: VariableMatchingParameters,
): MotionStudyModel['moments'] {
  return [
    { label: t('studyAifg.variable-matching.model.moments.labels.selectVelocity'), step: 0 },
    {
      label: t('studyAifg.variable-matching.model.moments.labels.unclippedCorrection'),
      step: initialStep,
    },
    {
      label:
        nearlyMatched >= 0
          ? t('studyAifg.variable-matching.model.moments.labels.nearlySamePace')
          : t('studyAifg.variable-matching.model.moments.labels.errorStillPresent'),
      step: nearlyMatched >= 0 ? nearlyMatched : Math.floor(example.steps / 2),
    },
    {
      label: t('studyAifg.variable-matching.model.moments.labels.inspectPositionGap'),
      step: example.steps,
    },
  ];
}

function legendOf(t: StudyTranslate): MotionStudyModel['legend'] {
  return [
    { tone: 'subject', label: t('studyAifg.variable-matching.model.legend.labels.soraCargoSkiff') },
    { tone: 'target', label: t('studyAifg.variable-matching.model.legend.labels.pilotLaunch') },
    { tone: 'actual', label: t('studyAifg.variable-matching.model.legend.labels.soraVelocity') },
    {
      tone: 'desired',
      label: t('studyAifg.variable-matching.model.legend.labels.pilotVelocityMovedSora'),
    },
    {
      tone: 'muted',
      label: t('studyAifg.variable-matching.model.legend.labels.positionGapUnusedCorrection'),
    },
  ];
}

function inputsOf(t: StudyTranslate): MotionStudyModel['inputs'] {
  return [
    {
      name: 'responseTime',
      label: t('studyAifg.variable-matching.model.inputs.labels.responseTime'),
      unit: t('studyAifg.variable-matching.model.inputs.units.seconds'),
      min: 0.5,
      max: 2,
      step: 0.25,
    },
    {
      name: 'maxAcceleration',
      label: t('studyAifg.variable-matching.model.inputs.labels.accelerationLimit'),
      unit: t('studyAifg.variable-matching.model.inputs.units.acceleration'),
      min: 1,
      max: 6,
      step: 0.5,
    },
  ];
}

export function presentStudy(
  example: VariableMatchingParameters,
  t: StudyTranslate,
): MotionStudyModel {
  const statesSamples = variableMatchingSamples(example);
  const states = statesSamples.map(({ state }) => state);
  const frames = states.map((state, step) =>
    frameOf(state, step, example, t, statesSamples[step].calculation),
  );
  const ends = frames.flatMap((frame) => [
    ...frame.bodies.map(({ x }) => x),
    ...(frame.vectors ?? []).flatMap(({ x, dx }) => [x, x + dx]),
  ]);
  const minX = Math.min(...ends) - example.padding;
  const maxX = Math.max(...ends) + example.padding;
  const height = Math.max((maxX - minX) / 2, 2 * (example.arrowLane + example.padding));
  const firstUnclipped = statesSamples.findIndex(({ calculation }) => {
    return (
      Math.abs(calculation.requestedAcceleration) <= example.maxAcceleration &&
      Math.abs(calculation.trialVelocity) <= example.maxSpeed
    );
  });
  const nearlyMatched = states.findIndex(
    ({ skiffVelocity }) =>
      Math.abs(example.pilotVelocity - skiffVelocity) <= example.matchingTolerance,
  );
  const initialStep = firstUnclipped >= 0 ? firstUnclipped : Math.floor(example.steps / 2);
  const errors = states.map(({ skiffVelocity }) => example.pilotVelocity - skiffVelocity);
  return {
    family: 'motion',
    motion: motionOf(minX, maxX, height, frames),
    timeline: timelineOf(t, frames, errors, example),
    initialStep,
    moments: momentsOf(t, initialStep, nearlyMatched, example),
    legend: legendOf(t),
    caption: t('studyAifg.variable-matching.model.caption', {
      arrowSeconds: fixed(example.arrowSeconds),
    }),
    comparison: reversedComparison(states, example, t),
    inputs: inputsOf(t),
  };
}

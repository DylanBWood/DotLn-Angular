import { scale, type Vec2 } from '@dotln-angular/scene-engine';

import type { MotionBody, MotionFrame, MotionMark, MotionStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { boundsOfPoints, decimal, vectorText } from './presentation';
import {
  outputExperiment,
  type OutputParameters,
  type OutputState,
  type OutputStep,
} from './steering-output.simulation';

function frameWorkedStep(
  step: OutputStep,
  example: OutputParameters,
  t: StudyTranslate,
): MotionFrame['worked'] {
  const { state, output, next } = step;
  const pulsing = step.seconds < example.pulseSeconds;

  return {
    title: t('studyAifg.steering-output.model.frames.worked.title', {
      seconds: decimal(step.seconds),
    }),
    lines: [
      t('studyAifg.steering-output.model.frames.worked.steps.readPositionVelocityHeading', {
        position: vectorText(state.position),
        velocity: vectorText(state.velocity),
        heading: decimal(state.heading),
        rotation: decimal(state.rotation),
      }),
      t('studyAifg.steering-output.model.frames.worked.steps.suppliesLinearAccelerationAngular', {
        pulsingActivePulseEnded: pulsing
          ? t('studyAifg.steering-output.model.frames.worked.steps.activePulse')
          : t('studyAifg.steering-output.model.frames.worked.steps.endedPulse'),
        outputLinear: vectorText(output.linear),
        outputAngular: decimal(output.angular),
      }),
      t('studyAifg.steering-output.model.frames.worked.steps.newVelocity', {
        velocity: vectorText(state.velocity),
        outputLinear: vectorText(output.linear),
        timeStep: decimal(example.timeStep),
        nextVelocity: vectorText(next.velocity),
      }),
      t('studyAifg.steering-output.model.frames.worked.steps.newTurningRate', {
        rotation: decimal(state.rotation),
        outputAngular: decimal(output.angular),
        timeStep: decimal(example.timeStep),
        nextRotation: decimal(next.rotation),
      }),
      t('studyAifg.steering-output.model.frames.worked.steps.newPosition', {
        position: vectorText(state.position),
        nextVelocity: vectorText(next.velocity),
        timeStep: decimal(example.timeStep),
        nextPosition: vectorText(next.position),
      }),
      t('studyAifg.steering-output.model.frames.worked.steps.newHeading', {
        heading: decimal(state.heading),
        nextRotation: decimal(next.rotation),
        timeStep: decimal(example.timeStep),
        nextHeading: decimal(next.heading),
      }),
    ],
    note: t('studyAifg.steering-output.model.frames.worked.note'),
  };
}

function frameValues(
  step: OutputStep,
  ghost: OutputState,
  velocityChange: Vec2,
  example: OutputParameters,
  experiment: ReturnType<typeof outputExperiment>,
): MotionFrame['values'] {
  const { state, output } = step;
  const { inputValues, final, comparisonFinal, run, cutoff, coast } = experiment;

  return {
    ...inputValues,
    seconds: decimal(step.seconds),
    duration: decimal(example.steps * example.timeStep),
    position: vectorText(state.position),
    velocity: vectorText(state.velocity),
    heading: decimal(state.heading),
    rotation: decimal(state.rotation),
    linearOutput: vectorText(output.linear),
    angularOutput: decimal(output.angular),
    velocityChange: vectorText(velocityChange),
    comparisonPosition: vectorText(ghost.position),
    finalY: decimal(final.position.y),
    comparisonFinalY: decimal(comparisonFinal.position.y),
    coastSeconds: decimal(run[cutoff].seconds),
    coastVelocity: vectorText(coast.velocity),
    coastRotation: decimal(coast.rotation),
  };
}

function frameDrawing(
  ghost: OutputState,
  state: OutputState,
  velocityChange: Vec2,
  example: OutputParameters,
): Pick<MotionFrame, 'bodies' | 'vectors' | 'marks'> {
  return {
    bodies: [
      { id: 'comparison', ...ghost.position, heading: ghost.heading, tone: 'other' },
      { id: 'nori', ...state.position, heading: state.heading, tone: 'subject' },
    ],
    vectors: [
      { ...state.position, dx: state.velocity.x, dy: state.velocity.y, tone: 'actual' },
      { ...state.position, dx: velocityChange.x, dy: velocityChange.y, tone: 'desired' },
    ],
    marks: [{ x: example.initialX, y: example.initialY, shape: 'cross', tone: 'muted' }],
  };
}

function frameOf(
  step: OutputStep,
  index: number,
  example: OutputParameters,
  experiment: ReturnType<typeof outputExperiment>,
  t: StudyTranslate,
): MotionFrame {
  const { comparison } = experiment;

  const { state, output } = step;
  const ghost = comparison[index].state;
  const velocityChange = scale(output.linear, example.timeStep);
  const pulsing = step.seconds < example.pulseSeconds;

  return {
    seconds: step.seconds,
    ...frameDrawing(ghost, state, velocityChange, example),
    values: frameValues(step, ghost, velocityChange, example, experiment),
    note: pulsing
      ? t('studyAifg.steering-output.model.frames.notes.pulseChangesLinearVelocity')
      : t('studyAifg.steering-output.model.frames.notes.bothOutputChannelsNow'),
    worked: frameWorkedStep(step, example, t),
  };
}

function comparisonTimeline(
  t: StudyTranslate,
  seconds: number[],
  example: OutputParameters,
  run: readonly OutputStep[],
  comparison: readonly OutputStep[],
): NonNullable<MotionStudyModel['comparison']>['timeline'] {
  return {
    title: t('studyAifg.steering-output.model.comparison.timeline.title'),
    xLabel: t('studyAifg.steering-output.model.comparison.timeline.xLabel'),
    yLabel: t('studyAifg.steering-output.model.comparison.timeline.yLabel'),
    seconds,
    reference: example.initialY,
    series: [
      {
        id: 'chosen',
        label: t(
          'studyAifg.steering-output.model.comparison.timeline.series.labels.worldYAcceleration',
          {
            linearAccelerationY: decimal(example.linearAccelerationY),
          },
        ),
        tone: 'actual',
        values: run.map(({ state }) => state.position.y),
      },
      {
        id: 'comparison',
        label: t(
          'studyAifg.steering-output.model.comparison.timeline.series.labels.worldYAcceleration2',
          {
            comparisonLinearAccelerationY: decimal(example.comparisonLinearAccelerationY),
          },
        ),
        tone: 'other',
        values: comparison.map(({ state }) => state.position.y),
      },
    ],
  };
}

function comparisonOf(
  example: OutputParameters,
  experiment: ReturnType<typeof outputExperiment>,
  t: StudyTranslate,
): NonNullable<MotionStudyModel['comparison']> {
  const { seconds, run, comparison, same, final, comparisonFinal, cutoff, coast } = experiment;

  return {
    title: t('studyAifg.steering-output.model.comparison.title'),
    intro: t('studyAifg.steering-output.model.comparison.intro', {
      linearAccelerationY: decimal(example.linearAccelerationY),
      comparisonLinearAccelerationY: decimal(example.comparisonLinearAccelerationY),
    }),
    timeline: comparisonTimeline(t, seconds, example, run, comparison),
    findings: same
      ? [t('studyAifg.steering-output.model.comparison.findings.bothWorldYAccelerations')]
      : [
          t('studyAifg.steering-output.model.comparison.findings.chosenYComparisonY', {
            secondsSteps: decimal(seconds[example.steps]),
            finalPosition: decimal(final.position.y),
            comparisonFinalPosition: decimal(comparisonFinal.position.y),
          }),
          t('studyAifg.steering-output.model.comparison.findings.angularRequestChangesFacing'),
        ],
    note: t('studyAifg.steering-output.model.comparison.note', {
      runCutoffSeconds: decimal(run[cutoff].seconds),
      coastVelocity: vectorText(coast.velocity),
      coastRotation: decimal(coast.rotation),
    }),
  };
}

function timelineOf(
  t: StudyTranslate,
  seconds: number[],
  run: readonly OutputStep[],
): MotionStudyModel['timeline'] {
  return {
    title: t('studyAifg.steering-output.model.timeline.title'),
    xLabel: t('studyAifg.steering-output.model.timeline.xLabel'),
    yLabel: t('studyAifg.steering-output.model.timeline.yLabel'),
    seconds,
    reference: 0,
    series: [
      {
        id: 'rotation',
        label: t('studyAifg.steering-output.model.timeline.series.labels.turningRate'),
        tone: 'actual',
        values: run.map(({ state }) => state.rotation),
      },
    ],
  };
}

function motionOf(
  frames: readonly MotionFrame[],
  points: (MotionBody | MotionMark | { x: number; y: number })[],
  padding: number,
): MotionStudyModel['motion'] {
  return {
    frames,
    trail: true,
    bounds: boundsOfPoints(points, padding),
  };
}

function momentsOf(
  t: StudyTranslate,
  example: OutputParameters,
  cutoff: number,
): MotionStudyModel['moments'] {
  return [
    { label: t('studyAifg.steering-output.model.moments.labels.beforeFirstUpdate'), step: 0 },
    {
      label: t('studyAifg.steering-output.model.moments.labels.firstRatesApplied'),
      step: Math.min(1, example.steps),
    },
    { label: t('studyAifg.steering-output.model.moments.labels.pulseEnds'), step: cutoff },
    { label: t('studyAifg.steering-output.model.moments.labels.laterDrift'), step: example.steps },
  ];
}

function legendOf(t: StudyTranslate): MotionStudyModel['legend'] {
  return [
    {
      tone: 'subject',
      label: t('studyAifg.steering-output.model.legend.labels.noriChosenLinearPulse'),
    },
    {
      tone: 'other',
      label: t('studyAifg.steering-output.model.legend.labels.comparisonTugChangedWorld'),
    },
    {
      tone: 'actual',
      label: t('studyAifg.steering-output.model.legend.labels.greenArrowCurrentVelocity'),
    },
    {
      tone: 'desired',
      label: t('studyAifg.steering-output.model.legend.labels.amberArrowVelocityChange'),
    },
  ];
}

function inputsOf(t: StudyTranslate): MotionStudyModel['inputs'] {
  return [
    {
      name: 'linearAccelerationY',
      label: t('studyAifg.steering-output.model.inputs.labels.worldYAccelerationDuring'),
      unit: t('studyAifg.steering-output.model.inputs.units.acceleration'),
      min: 0,
      max: 3,
      step: 0.5,
    },
    {
      name: 'pulseSeconds',
      label: t('studyAifg.steering-output.model.inputs.labels.pulseDuration'),
      unit: t('studyAifg.steering-output.model.inputs.units.seconds'),
      min: 0.5,
      max: 2,
      step: 0.25,
    },
  ];
}

export function presentStudy(example: OutputParameters, t: StudyTranslate): MotionStudyModel {
  const experiment = outputExperiment(example);
  const { run, seconds, cutoff } = experiment;
  const frames: readonly MotionFrame[] = run.map((step, index) =>
    frameOf(step, index, example, experiment, t),
  );
  const points = frames.flatMap((frame) => [
    ...frame.bodies,
    ...(frame.marks ?? []),
    ...(frame.vectors ?? []).flatMap(({ x, y, dx, dy }) => [
      { x, y },
      { x: x + dx, y: y + dy },
    ]),
  ]);
  const padding = Math.max(
    1,
    (Math.max(...points.map(({ x }) => x)) - Math.min(...points.map(({ x }) => x))) / 8,
    (Math.max(...points.map(({ y }) => y)) - Math.min(...points.map(({ y }) => y))) / 8,
  );

  return {
    family: 'motion',
    motion: motionOf(frames, points, padding),
    timeline: timelineOf(t, seconds, run),
    initialStep: cutoff,
    moments: momentsOf(t, example, cutoff),
    legend: legendOf(t),
    caption: t('studyAifg.steering-output.model.caption'),
    comparison: comparisonOf(example, experiment, t),
    inputs: inputsOf(t),
  };
}

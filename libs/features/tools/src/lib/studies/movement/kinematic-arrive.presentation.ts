import type { MotionFrame, MotionStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import {
  type KinematicArriveParameters,
  type KinematicArriveSample,
  kinematicArriveSamples,
} from './kinematic-arrive.simulation';
import { decimal } from './presentation';

function frameWorkedStep(
  t: StudyTranslate,
  step: number,
  example: KinematicArriveParameters,
  sample: KinematicArriveSample,
): MotionFrame['worked'] {
  return {
    title: t('studyAifg.kinematic-arrive.model.frame.worked.title', {
      timeStep: decimal(step * example.timeStep, 3),
    }),
    lines: sample.accepted
      ? [
          t('studyAifg.kinematic-arrive.model.frame.worked.steps.distanceTarget', {
            target: decimal(example.target, 3),
            samplePosition: decimal(sample.position, 3),
            sampleDistance: decimal(sample.distance, 3),
          }),
          t('studyAifg.kinematic-arrive.model.frame.worked.steps.acceptPlaceAssignVelocity', {
            sampleDistance: decimal(sample.distance, 3),
            satisfactionRadius: decimal(example.satisfactionRadius, 3),
          }),
          t('studyAifg.kinematic-arrive.model.frame.worked.steps.nextPosition', {
            samplePosition: decimal(sample.position, 3),
            timeStep: decimal(example.timeStep, 3),
            sampleNextPosition: decimal(sample.nextPosition, 3),
          }),
        ]
      : [
          t('studyAifg.kinematic-arrive.model.frame.worked.steps.offsetTarget', {
            target: decimal(example.target, 3),
            samplePosition: decimal(sample.position, 3),
            sampleOffset: decimal(sample.offset, 3),
          }),
          t('studyAifg.kinematic-arrive.model.frame.worked.steps.distanceSatisfactionRadiusKeep', {
            sampleDistance: decimal(sample.distance, 3),
            satisfactionRadius: decimal(example.satisfactionRadius, 3),
          }),
          t('studyAifg.kinematic-arrive.model.frame.worked.steps.requestedVelocity', {
            sampleOffset: decimal(sample.offset, 3),
            timeToTarget: decimal(example.timeToTarget, 3),
            sampleRequestedVelocity: decimal(sample.requestedVelocity, 3),
          }),
          t('studyAifg.kinematic-arrive.model.frame.worked.steps.limitVelocityUse', {
            maxSpeed: decimal(example.maxSpeed, 3),
            sampleVelocity: decimal(sample.velocity, 3),
          }),
          t('studyAifg.kinematic-arrive.model.frame.worked.steps.nextPosition2', {
            samplePosition: decimal(sample.position, 3),
            sampleVelocity: decimal(sample.velocity, 3),
            timeStep: decimal(example.timeStep, 3),
            sampleNextPosition: decimal(sample.nextPosition, 3),
          }),
        ],
    note: t('studyAifg.kinematic-arrive.model.frame.worked.note'),
  };
}

function frameValues(
  example: KinematicArriveParameters,
  sample: KinematicArriveSample,
  displacement: number,
  taperDistance: number,
  t: StudyTranslate,
): MotionFrame['values'] {
  return {
    start: decimal(example.start, 3),
    target: decimal(example.target, 3),
    maxSpeed: decimal(example.maxSpeed, 3),
    timeToTarget: decimal(example.timeToTarget, 3),
    shortTimeToTarget: decimal(example.shortTimeToTarget, 3),
    satisfactionRadius: decimal(example.satisfactionRadius, 3),
    timeStep: decimal(example.timeStep, 3),
    steps: String(example.steps),
    position: decimal(sample.position, 3),
    distance: decimal(sample.distance, 3),
    velocity: decimal(sample.velocity, 3),
    speed: decimal(Math.abs(sample.velocity), 3),
    displacement: decimal(displacement, 3),
    nextPosition: decimal(sample.nextPosition, 3),
    taperDistance: decimal(taperDistance, 3),
    accepted: sample.accepted
      ? t('studyAifg.kinematic-arrive.model.frame.values.acceptedCases.accepted')
      : t('studyAifg.kinematic-arrive.model.frame.values.acceptedCases.outsideAcceptedRegion'),
    errorFactor: decimal(1 - example.timeStep / example.timeToTarget, 3),
  };
}

function frameDrawing(
  sample: KinematicArriveSample,
  displacement: number,
  example: KinematicArriveParameters,
  taperDistance: number,
): Pick<MotionFrame, 'bodies' | 'vectors' | 'zones' | 'marks'> {
  return {
    bodies: [{ id: 'trolley', x: sample.position, y: 0 }],
    vectors: [{ x: sample.position, y: 0, dx: displacement, dy: 0, tone: 'actual' }],
    zones: [
      { x: example.target, y: 0, radius: taperDistance, tone: 'zone' },
      { x: example.target, y: 0, radius: example.satisfactionRadius, tone: 'target' },
    ],
    marks: [{ x: example.target, y: 0, shape: 'cross' }],
  };
}

function frameOf(
  sample: KinematicArriveSample,
  step: number,
  example: KinematicArriveParameters,
  t: StudyTranslate,
): MotionFrame {
  const taperDistance = example.maxSpeed * example.timeToTarget;
  const displacement = sample.nextPosition - sample.position;
  const note = sample.accepted
    ? t('studyAifg.kinematic-arrive.model.frame.notes.trolleyAcceptsCurrentPlace')
    : Math.abs(sample.requestedVelocity) > example.maxSpeed
      ? t('studyAifg.kinematic-arrive.model.frame.notes.requestedVelocityExceedsSpeed')
      : t('studyAifg.kinematic-arrive.model.frame.notes.speedCapInactiveLess');

  return {
    seconds: step * example.timeStep,
    ...frameDrawing(sample, displacement, example, taperDistance),
    values: frameValues(example, sample, displacement, taperDistance, t),
    note,
    worked: frameWorkedStep(t, step, example, sample),
  };
}

function summaryOf(samples: readonly KinematicArriveSample[], t: StudyTranslate) {
  const last = samples[samples.length - 1];
  const crossed = samples
    .slice(1)
    .some((sample, index) => sample.offset * samples[index].offset < 0);

  return last.accepted
    ? t('studyAifg.kinematic-arrive.model.summary.descriptions.stopsRemainingError', {
        lastDistance: decimal(last.distance, 3),
      })
    : crossed
      ? t('studyAifg.kinematic-arrive.model.summary.crossed')
      : t('studyAifg.kinematic-arrive.model.summary.unaccepted');
}

function comparisonTimeline(
  t: StudyTranslate,
  seconds: number[],
  example: KinematicArriveParameters,
  samples: readonly KinematicArriveSample[],
  short: readonly KinematicArriveSample[],
): NonNullable<MotionStudyModel['comparison']>['timeline'] {
  return {
    title: t('studyAifg.kinematic-arrive.model.comparison.timeline.title'),
    xLabel: t('studyAifg.kinematic-arrive.model.comparison.timeline.xLabel'),
    yLabel: t('studyAifg.kinematic-arrive.model.comparison.timeline.yLabel'),
    seconds,
    reference: example.target,
    series: [
      {
        id: 'normal',
        label: t(
          'studyAifg.kinematic-arrive.model.comparison.timeline.series.labels.solidGreenTimeTarget',
          {
            timeToTarget: decimal(example.timeToTarget, 3),
          },
        ),
        tone: 'actual',
        values: samples.map((sample) => sample.position),
      },
      {
        id: 'short',
        label: t(
          'studyAifg.kinematic-arrive.model.comparison.timeline.series.labels.dashedAmberTimeTarget',
          {
            shortTimeToTarget: decimal(example.shortTimeToTarget, 3),
          },
        ),
        tone: 'desired',
        values: short.map((sample) => sample.position),
      },
    ],
  };
}

function comparisonOf(
  t: StudyTranslate,
  example: KinematicArriveParameters,
  seconds: number[],
  samples: readonly KinematicArriveSample[],
  short: readonly KinematicArriveSample[],
  same: boolean,
): NonNullable<MotionStudyModel['comparison']> {
  return {
    title: t('studyAifg.kinematic-arrive.model.comparison.title'),
    intro: t('studyAifg.kinematic-arrive.model.comparison.intro', {
      timeToTarget: decimal(example.timeToTarget, 3),
      shortTimeToTarget: decimal(example.shortTimeToTarget, 3),
      timeStep: decimal(example.timeStep, 3),
    }),
    timeline: comparisonTimeline(t, seconds, example, samples, short),
    findings: same
      ? [t('studyAifg.kinematic-arrive.model.comparison.findings.bothResponseTimesEqual')]
      : [
          t('studyAifg.kinematic-arrive.model.comparison.findings.mainRunChangedRun', {
            summary: summaryOf(samples, t),
            summary2: summaryOf(short, t),
          }),
          t('studyAifg.kinematic-arrive.model.comparison.findings.whereSpeedCapInactive', {
            timeStepShortTimeToTarget: decimal(1 - example.timeStep / example.shortTimeToTarget, 3),
          }),
        ],
    note: t('studyAifg.kinematic-arrive.model.comparison.note'),
  };
}

function timelineOf(
  t: StudyTranslate,
  seconds: number[],
  example: KinematicArriveParameters,
  samples: readonly KinematicArriveSample[],
): MotionStudyModel['timeline'] {
  return {
    title: t('studyAifg.kinematic-arrive.model.timeline.title'),
    xLabel: t('studyAifg.kinematic-arrive.model.timeline.xLabel'),
    yLabel: t('studyAifg.kinematic-arrive.model.timeline.yLabel'),
    seconds,
    yRange: [-example.maxSpeed, example.maxSpeed],
    reference: 0,
    series: [
      {
        id: 'velocity',
        label: t(
          'studyAifg.kinematic-arrive.model.timeline.series.labels.solidGreenAssignedVelocity',
        ),
        tone: 'actual',
        values: samples.map((sample) => sample.velocity),
      },
    ],
  };
}

function motionOf(
  positions: number[],
  example: KinematicArriveParameters,
  reach: number,
  samples: readonly KinematicArriveSample[],
  t: StudyTranslate,
): MotionStudyModel['motion'] {
  return {
    bounds: {
      minX: Math.min(...positions, example.target - reach) - 1,
      maxX: Math.max(...positions, example.target + reach) + 1,
      minY: -reach - 1,
      maxY: reach + 1,
    },
    frames: samples.map((sample, step) => frameOf(sample, step, example, t)),
    trail: true,
  };
}

function momentsOf(
  t: StudyTranslate,
  firstTaper: number,
  selected: number,
  firstAccepted: number,
  example: KinematicArriveParameters,
): MotionStudyModel['moments'] {
  return [
    { label: t('studyAifg.kinematic-arrive.model.moments.labels.start'), step: 0 },
    {
      label:
        firstTaper < 0
          ? t('studyAifg.kinematic-arrive.model.moments.labels.inspectApproach')
          : t('studyAifg.kinematic-arrive.model.moments.labels.velocityTapers'),
      step: selected,
    },
    {
      label:
        firstAccepted < 0
          ? t('studyAifg.kinematic-arrive.model.moments.labels.stillApproaching')
          : t('studyAifg.kinematic-arrive.model.moments.labels.placeAccepted'),
      step: firstAccepted < 0 ? example.steps : firstAccepted,
    },
    {
      label: t('studyAifg.kinematic-arrive.model.moments.labels.runEnd'),
      step: example.steps,
    },
  ];
}

function legendOf(t: StudyTranslate): MotionStudyModel['legend'] {
  return [
    {
      tone: 'actual',
      label: t('studyAifg.kinematic-arrive.model.legend.labels.solidGreenNextDisplacement'),
    },
    {
      tone: 'zone',
      label: t('studyAifg.kinematic-arrive.model.legend.labels.outerCircleSpeedBegins'),
    },
    {
      tone: 'target',
      label: t('studyAifg.kinematic-arrive.model.legend.labels.innerCircleCrossAccepted'),
    },
  ];
}

function inputsOf(t: StudyTranslate): MotionStudyModel['inputs'] {
  return [
    {
      name: 'timeToTarget',
      label: t('studyAifg.kinematic-arrive.model.inputs.labels.timeTarget'),
      unit: t('studyAifg.kinematic-arrive.model.inputs.units.seconds'),
      min: 0.2,
      max: 2,
      step: 0.1,
    },
    {
      name: 'satisfactionRadius',
      label: t('studyAifg.kinematic-arrive.model.inputs.labels.satisfactionRadius'),
      unit: t('studyAifg.kinematic-arrive.model.inputs.units.distance'),
      min: 0,
      max: 1,
      step: 0.05,
    },
  ];
}

export function presentStudy(
  example: KinematicArriveParameters,
  t: StudyTranslate,
): MotionStudyModel {
  const samples = kinematicArriveSamples(example);
  const short = kinematicArriveSamples(example, example.shortTimeToTarget);
  const seconds = samples.map((_sample, step) => step * example.timeStep);
  const taperDistance = example.maxSpeed * example.timeToTarget;
  const positions = samples.flatMap((sample) => [sample.position, sample.nextPosition]);
  const reach = Math.max(taperDistance, example.satisfactionRadius, 1);
  const firstTaper = samples.findIndex(
    (sample) => !sample.accepted && Math.abs(sample.velocity) < example.maxSpeed,
  );
  const firstAccepted = samples.findIndex((sample) => sample.accepted);
  const selected = firstTaper < 0 ? Math.min(1, example.steps) : firstTaper;
  const same = example.timeToTarget === example.shortTimeToTarget;

  return {
    family: 'motion',
    motion: motionOf(positions, example, reach, samples, t),
    timeline: timelineOf(t, seconds, example, samples),
    initialStep: selected,
    moments: momentsOf(t, firstTaper, selected, firstAccepted, example),
    legend: legendOf(t),
    caption: t('studyAifg.kinematic-arrive.model.caption'),
    comparison: comparisonOf(t, example, seconds, samples, short, same),
    inputs: inputsOf(t),
  };
}

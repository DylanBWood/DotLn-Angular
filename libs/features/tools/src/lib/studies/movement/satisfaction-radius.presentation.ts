import type { MotionFrame, MotionStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { decimal } from './presentation';
import {
  type SatisfactionRadiusParameters,
  type SatisfactionRadiusSample,
  satisfactionRadiusSamples,
} from './satisfaction-radius.simulation';

function frameWorkedStep(
  t: StudyTranslate,
  step: number,
  example: SatisfactionRadiusParameters,
  sample: SatisfactionRadiusSample,
): MotionFrame['worked'] {
  return {
    title: t('studyAifg.satisfaction-radius.model.frame.worked.title', {
      timeStep: decimal(step * example.timeStep, 3),
    }),
    lines: [
      t('studyAifg.satisfaction-radius.model.frame.worked.steps.distanceTarget', {
        target: decimal(example.target, 3),
        samplePosition: decimal(sample.position, 3),
        sampleDistance: decimal(sample.distance, 3),
      }),
      t('studyAifg.satisfaction-radius.model.frame.worked.steps.sampleDistance', {
        sampleDistance: decimal(sample.distance, 3),
        satisfactionRadius: decimal(example.satisfactionRadius, 3),
        sampleAcceptedTrueFalse: sample.accepted
          ? t('studyAifg.satisfaction-radius.model.frame.worked.steps.value')
          : t('studyAifg.satisfaction-radius.model.frame.worked.steps.value2'),
      }),
      sample.accepted
        ? t('studyAifg.satisfaction-radius.model.frame.worked.steps.acceptPositionAssignVelocity')
        : t('studyAifg.satisfaction-radius.model.frame.worked.steps.assignVelocitySign', {
            sampleOffset: decimal(sample.offset, 3),
            speed: decimal(example.speed, 3),
            sampleVelocity: decimal(sample.velocity, 3),
          }),
      t('studyAifg.satisfaction-radius.model.frame.worked.steps.nextPosition', {
        samplePosition: decimal(sample.position, 3),
        sampleVelocity: decimal(sample.velocity, 3),
        timeStep: decimal(example.timeStep, 3),
        sampleNextPosition: decimal(sample.nextPosition, 3),
      }),
    ],
    note: t('studyAifg.satisfaction-radius.model.frame.worked.note'),
  };
}

function frameValues(
  example: SatisfactionRadiusParameters,
  sample: SatisfactionRadiusSample,
  t: StudyTranslate,
): MotionFrame['values'] {
  return {
    start: decimal(example.start, 3),
    target: decimal(example.target, 3),
    speed: decimal(example.speed, 3),
    satisfactionRadius: decimal(example.satisfactionRadius, 3),
    comparisonRadius: decimal(example.comparisonRadius, 3),
    timeStep: decimal(example.timeStep, 3),
    steps: String(example.steps),
    position: decimal(sample.position, 3),
    distance: decimal(sample.distance, 3),
    velocity: decimal(sample.velocity, 3),
    nextPosition: decimal(sample.nextPosition, 3),
    stride: decimal(example.speed * example.timeStep, 3),
    accepted: sample.accepted
      ? t('studyAifg.satisfaction-radius.model.frame.values.acceptedCases.accepted')
      : t('studyAifg.satisfaction-radius.model.frame.values.acceptedCases.outsideAcceptedRegion'),
    lowerEdge: decimal(example.target - example.satisfactionRadius, 3),
    upperEdge: decimal(example.target + example.satisfactionRadius, 3),
  };
}

function frameDrawing(
  sample: SatisfactionRadiusSample,
  example: SatisfactionRadiusParameters,
): Pick<MotionFrame, 'bodies' | 'vectors' | 'marks' | 'zones'> {
  return {
    bodies: [{ id: 'shelf-runner', x: sample.position, y: 0 }],
    vectors: [
      {
        x: sample.position,
        y: 0,
        dx: sample.nextPosition - sample.position,
        dy: 0,
        tone: 'actual',
      },
    ],
    marks: [{ x: example.target, y: 0, shape: 'cross' }],
    zones: [{ x: example.target, y: 0, radius: example.satisfactionRadius, tone: 'zone' }],
  };
}

function frameOf(
  sample: SatisfactionRadiusSample,
  step: number,
  example: SatisfactionRadiusParameters,
  t: StudyTranslate,
): MotionFrame {
  return {
    seconds: step * example.timeStep,
    ...frameDrawing(sample, example),
    values: frameValues(example, sample, t),
    note: sample.accepted
      ? t('studyAifg.satisfaction-radius.model.frame.notes.runnerAcceptedRegionIncluding')
      : t('studyAifg.satisfaction-radius.model.frame.notes.runnerOutsideRegionTakes'),
    worked: frameWorkedStep(t, step, example, sample),
  };
}

function summaryOf(samples: readonly SatisfactionRadiusSample[], t: StudyTranslate) {
  const firstAccepted = samples.findIndex((sample) => sample.accepted);
  const last = samples[samples.length - 1];

  return firstAccepted >= 0
    ? t('studyAifg.satisfaction-radius.model.summary.descriptions.acceptsPositionKeepsError', {
        samplesFirstAcceptedPosition: decimal(samples[firstAccepted].position, 3),
        samplesFirstAcceptedDistance: decimal(samples[firstAccepted].distance, 3),
      })
    : t('studyAifg.satisfaction-radius.model.summary.descriptions.neverAcceptsSampledPosition', {
        lastDistance: decimal(last.distance, 3),
      });
}

function comparisonTimeline(
  t: StudyTranslate,
  seconds: number[],
  example: SatisfactionRadiusParameters,
  samples: readonly SatisfactionRadiusSample[],
  compared: readonly SatisfactionRadiusSample[],
): NonNullable<MotionStudyModel['comparison']>['timeline'] {
  return {
    title: t('studyAifg.satisfaction-radius.model.comparison.timeline.title'),
    xLabel: t('studyAifg.satisfaction-radius.model.comparison.timeline.xLabel'),
    yLabel: t('studyAifg.satisfaction-radius.model.comparison.timeline.yLabel'),
    seconds,
    reference: example.target,
    series: [
      {
        id: 'tolerance',
        label: t(
          'studyAifg.satisfaction-radius.model.comparison.timeline.series.labels.solidGreenRadius',
          {
            satisfactionRadius: decimal(example.satisfactionRadius, 3),
          },
        ),
        tone: 'actual',
        values: samples.map((sample) => sample.position),
      },
      {
        id: 'comparison',
        label: t(
          'studyAifg.satisfaction-radius.model.comparison.timeline.series.labels.dashedAmberRadius',
          { comparisonRadius: decimal(example.comparisonRadius, 3) },
        ),
        tone: 'desired',
        values: compared.map((sample) => sample.position),
      },
    ],
  };
}

function comparisonOf(
  t: StudyTranslate,
  example: SatisfactionRadiusParameters,
  seconds: number[],
  samples: readonly SatisfactionRadiusSample[],
  compared: readonly SatisfactionRadiusSample[],
  same: boolean,
): NonNullable<MotionStudyModel['comparison']> {
  return {
    title: t('studyAifg.satisfaction-radius.model.comparison.title'),
    intro: t('studyAifg.satisfaction-radius.model.comparison.intro', {
      satisfactionRadius: decimal(example.satisfactionRadius, 3),
      comparisonRadius: decimal(example.comparisonRadius, 3),
      speedTimeStep: decimal(example.speed * example.timeStep, 3),
    }),
    timeline: comparisonTimeline(t, seconds, example, samples, compared),
    findings: same
      ? [t('studyAifg.satisfaction-radius.model.comparison.findings.bothRadiiEqualSo')]
      : [
          t('studyAifg.satisfaction-radius.model.comparison.findings.mainRunChangedRun', {
            summary: summaryOf(samples, t),
            summary2: summaryOf(compared, t),
          }),
          t('studyAifg.satisfaction-radius.model.comparison.findings.decisionMadeOnlySampled'),
        ],
    note: t('studyAifg.satisfaction-radius.model.comparison.note'),
  };
}

function timelineOf(
  t: StudyTranslate,
  seconds: number[],
  example: SatisfactionRadiusParameters,
  samples: readonly SatisfactionRadiusSample[],
): MotionStudyModel['timeline'] {
  return {
    title: t('studyAifg.satisfaction-radius.model.timeline.title'),
    xLabel: t('studyAifg.satisfaction-radius.model.timeline.xLabel'),
    yLabel: t('studyAifg.satisfaction-radius.model.timeline.yLabel'),
    seconds,
    reference: example.satisfactionRadius,
    yRange: [
      0,
      Math.max(example.satisfactionRadius, ...samples.map((sample) => sample.distance), 1),
    ],
    series: [
      {
        id: 'distance',
        label: t(
          'studyAifg.satisfaction-radius.model.timeline.series.labels.solidGreenRemainingDistance',
        ),
        tone: 'actual',
        values: samples.map((sample) => sample.distance),
      },
      {
        id: 'radius',
        label: t(
          'studyAifg.satisfaction-radius.model.timeline.series.labels.dashedAmberSatisfactionRadius',
        ),
        tone: 'desired',
        values: samples.map(() => example.satisfactionRadius),
      },
    ],
  };
}

function motionOf(
  positions: number[],
  example: SatisfactionRadiusParameters,
  reach: number,
  samples: readonly SatisfactionRadiusSample[],
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
  selected: number,
  firstAccepted: number,
  example: SatisfactionRadiusParameters,
): MotionStudyModel['moments'] {
  return [
    { label: t('studyAifg.satisfaction-radius.model.moments.labels.start'), step: 0 },
    {
      label: t('studyAifg.satisfaction-radius.model.moments.labels.beforeDecision'),
      step: Math.max(0, selected - 1),
    },
    {
      label:
        firstAccepted < 0
          ? t('studyAifg.satisfaction-radius.model.moments.labels.stillOutside')
          : t('studyAifg.satisfaction-radius.model.moments.labels.placeAccepted'),
      step: selected,
    },
    {
      label: t('studyAifg.satisfaction-radius.model.moments.labels.runEnd'),
      step: example.steps,
    },
  ];
}

function legendOf(t: StudyTranslate): MotionStudyModel['legend'] {
  return [
    {
      tone: 'subject',
      label: t('studyAifg.satisfaction-radius.model.legend.labels.dotShelfRunner'),
    },
    {
      tone: 'actual',
      label: t('studyAifg.satisfaction-radius.model.legend.labels.solidGreenNextDisplacement'),
    },
    {
      tone: 'zone',
      label: t('studyAifg.satisfaction-radius.model.legend.labels.circleAcceptedRegion'),
    },
    {
      tone: 'target',
      label: t('studyAifg.satisfaction-radius.model.legend.labels.crossPickupMarker'),
    },
  ];
}

function inputsOf(t: StudyTranslate): MotionStudyModel['inputs'] {
  return [
    {
      name: 'satisfactionRadius',
      label: t('studyAifg.satisfaction-radius.model.inputs.labels.satisfactionRadius'),
      unit: t('studyAifg.satisfaction-radius.model.inputs.units.distance'),
      min: 0,
      max: 2,
      step: 0.1,
    },
  ];
}

export function presentStudy(
  example: SatisfactionRadiusParameters,
  t: StudyTranslate,
): MotionStudyModel {
  const samples = satisfactionRadiusSamples(example);
  const compared = satisfactionRadiusSamples(example, example.comparisonRadius);
  const seconds = samples.map((_sample, step) => step * example.timeStep);
  const firstAccepted = samples.findIndex((sample) => sample.accepted);
  const selected =
    firstAccepted < 0 ? Math.min(example.steps, Math.floor(example.steps / 2)) : firstAccepted;
  const positions = samples.flatMap((sample) => [sample.position, sample.nextPosition]);
  const reach = Math.max(example.satisfactionRadius, 1);
  const same = example.satisfactionRadius === example.comparisonRadius;

  return {
    family: 'motion',
    motion: motionOf(positions, example, reach, samples, t),
    timeline: timelineOf(t, seconds, example, samples),
    initialStep: selected,
    moments: momentsOf(t, selected, firstAccepted, example),
    legend: legendOf(t),
    caption: t('studyAifg.satisfaction-radius.model.caption'),
    comparison: comparisonOf(t, example, seconds, samples, compared, same),
    inputs: inputsOf(t),
  };
}

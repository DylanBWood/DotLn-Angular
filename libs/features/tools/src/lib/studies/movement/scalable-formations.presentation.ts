import { add, type Vec2 } from '@dotln-angular/scene-engine';

import type {
  MotionBounds,
  MotionFrame,
  MotionStudyModel,
  StudyInput,
  StudyWorkedStep,
} from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { fixed, pair as point } from './presentation';
import {
  anchorOf,
  type ScalableFormationParameters,
  type ScalableFormationSample,
  scalableFormationSamples,
} from './scalable-formations.simulation';

const inputs = (t: StudyTranslate): readonly StudyInput[] => [
  {
    name: 'targetCount',
    label: t('studyAifg.scalable-formations.model.requestedMembers'),
    unit: t('studyAifg.scalable-formations.model.scouts'),
    min: 4,
    max: 7,
    step: 1,
  },
  {
    name: 'spacing',
    label: t('studyAifg.scalable-formations.model.slotSpacing'),
    unit: t('studyAifg.scalable-formations.model.inputsUnitUnits'),
    min: 1.5,
    max: 3,
    step: 0.25,
  },
  {
    name: 'laneWidth',
    label: t('studyAifg.scalable-formations.model.laneWidth'),
    unit: t('studyAifg.scalable-formations.model.inputsUnitUnits'),
    min: 6,
    max: 14,
    step: 0.5,
  },
];

const namedPoints = (t: StudyTranslate, points: readonly Vec2[]) =>
  points
    .map((position, index) =>
      t('studyAifg.scalable-formations.model.slot', {
        index,
        position: point(position),
      }),
    )
    .join('; ');

function workedStep(
  t: StudyTranslate,
  sample: ScalableFormationSample,
  example: ScalableFormationParameters,
): StudyWorkedStep {
  const sum = sample.rawOffsets.reduce(add, { x: 0, y: 0 });
  const tip = sample.offsets[0];
  const upperArm = 2 * Math.floor((sample.count - 1) / 2);
  const lowerArm = 2 * Math.floor((sample.count - 2) / 2) + 1;
  const upper = Math.min(...sample.positions.map(({ y }) => y));
  const lower = Math.max(...sample.positions.map(({ y }) => y));
  return {
    title: t('studyAifg.scalable-formations.model.workedScoutProposalSeconds', {
      sampleCount: sample.count,
      sampleSeconds: fixed(sample.seconds),
    }),
    lines: [
      t('studyAifg.scalable-formations.model.workedMembershipScheduleScoutsEngine', {
        sampleCount: sample.count,
        exampleSpacing: fixed(example.spacing),
      }),
      t('studyAifg.scalable-formations.model.workedBeforeCentringTipRelative', {
        value1: namedPoints(t, sample.rawOffsets),
      }),
      t('studyAifg.scalable-formations.model.workedRawMean', {
        sumX: fixed(sum.x),
        sampleCount: sample.count,
        sumY: fixed(sum.y),
        sampleRawCentre: point(sample.rawCentre),
      }),
      t('studyAifg.scalable-formations.model.workedCentreTipAddAnchor', {
        rawCentreX: fixed(sample.rawCentre.x),
        rawCentreY: fixed(sample.rawCentre.y),
        tip: point(tip),
        value4: point(anchorOf(example)),
        value5: point(sample.positions[0]),
      }),
      t('studyAifg.scalable-formations.model.workedUpperArmEndsSlot', {
        upperArm,
        value2: point(sample.positions[upperArm]),
        lowerArm,
        value4: point(sample.positions[lowerArm]),
      }),
      t('studyAifg.scalable-formations.model.workedTransverseCentreSpanFull', {
        lower: fixed(lower),
        upper: fixed(upper),
        sampleCentreSpan: fixed(sample.centreSpan),
        exampleMemberRadius: fixed(example.memberRadius),
        sampleWidth: fixed(sample.width),
      }),
      t('studyAifg.scalable-formations.model.workedCompareLaneWidthSmallest', {
        exampleLaneWidth: fixed(example.laneWidth),
        sampleClearance: fixed(sample.clearance),
        sampleRetainedShift: fixed(sample.retainedShift),
      }),
    ],
    note: t('studyAifg.scalable-formations.model.workedLocalXRunsAlong'),
  };
}

function boundsOf(
  samples: readonly ScalableFormationSample[],
  example: ScalableFormationParameters,
): MotionBounds {
  const positions = samples.flatMap((sample) => sample.positions);
  const halfLength =
    Math.max(
      example.laneWidth / 2,
      ...positions.map(({ x }) => Math.abs(x - example.anchorX) + example.memberRadius),
    ) + example.spacing;
  return {
    minX: example.anchorX - halfLength,
    maxX: example.anchorX + halfLength,
    minY:
      Math.min(
        example.anchorY - example.laneWidth / 2,
        ...positions.map(({ y }) => y - example.memberRadius),
      ) - example.spacing,
    maxY:
      Math.max(
        example.anchorY + example.laneWidth / 2,
        ...positions.map(({ y }) => y + example.memberRadius),
      ) + example.spacing,
  };
}

function frameNote(
  t: StudyTranslate,
  sample: ScalableFormationSample,
  example: ScalableFormationParameters,
): string {
  if (sample.clearance < 0)
    return sample.retainedShift > 0
      ? t('studyAifg.scalable-formations.model.phaseScoutJoinsWiderWedge')
      : t('studyAifg.scalable-formations.model.phaseWedgeCrossesLaneEdges');
  if (sample.step === 0) return t('studyAifg.scalable-formations.model.phaseInitialWedgeFitsLane');
  if (sample.retainedShift > 0)
    return t('studyAifg.scalable-formations.model.phaseScoutJoinsWedgeRecentres');
  return sample.count === example.targetCount
    ? t('studyAifg.scalable-formations.model.phaseCompletedPatrolHoldsWedge')
    : t('studyAifg.scalable-formations.model.phasePatrolHoldsWedgeInside');
}

function frameValues(
  t: StudyTranslate,
  sample: ScalableFormationSample,
  example: ScalableFormationParameters,
  finalSample: ScalableFormationSample,
  anchor: ReturnType<typeof anchorOf>,
  upperEdge: number,
  lowerEdge: number,
): Readonly<Record<string, string>> {
  return {
    seconds: fixed(sample.seconds),
    count: String(sample.count),
    targetCount: String(example.targetCount),
    initialCount: String(example.initialCount),
    finalWidth: fixed(finalSample.width),
    finalFitStatus:
      finalSample.clearance >= 0
        ? t('studyAifg.scalable-formations.model.valueFitsLane')
        : t('studyAifg.scalable-formations.model.valueDoesNotFitLane'),
    spacing: fixed(example.spacing),
    anchor: point(anchor),
    rawCentre: point(sample.rawCentre),
    offsets: namedPoints(t, sample.offsets),
    positions: namedPoints(t, sample.positions),
    retainedShift: fixed(sample.retainedShift),
    centreSpan: fixed(sample.centreSpan),
    memberRadius: fixed(example.memberRadius),
    width: fixed(sample.width),
    laneWidth: fixed(example.laneWidth),
    upperEdge: fixed(upperEdge),
    lowerEdge: fixed(lowerEdge),
    clearance: fixed(sample.clearance),
    fitStatus:
      sample.clearance >= 0
        ? t('studyAifg.scalable-formations.model.valueFitsLane')
        : t('studyAifg.scalable-formations.model.valueDoesNotFitLane'),
  };
}

function frameOf(
  t: StudyTranslate,
  sample: ScalableFormationSample,
  example: ScalableFormationParameters,
  bounds: MotionBounds,
  finalSample: ScalableFormationSample,
): MotionFrame {
  const anchor = anchorOf(example);
  const upperEdge = anchor.y - example.laneWidth / 2;
  const lowerEdge = anchor.y + example.laneWidth / 2;
  const wallInset = Math.max(example.spacing, (bounds.maxX - bounds.minX) / 8);
  return {
    seconds: sample.seconds,
    bodies: sample.positions.map((position, index) => ({
      id: `proposal-slot-${index}`,
      label:
        index === 0
          ? t('studyAifg.scalable-formations.model.tip')
          : index >= sample.count - 2
            ? index % 2 === 0
              ? t('studyAifg.scalable-formations.model.upperArm')
              : t('studyAifg.scalable-formations.model.lowerArm')
            : undefined,
      ...position,
    })),
    marks: [
      ...sample.positions.map((position) => ({ ...position, shape: 'ring' as const })),
      {
        ...anchor,
        shape: 'cross',
        tone: 'other',
        label: t('studyAifg.scalable-formations.model.anchor'),
      },
      {
        x: bounds.minX + wallInset,
        y: upperEdge,
        shape: 'dot',
        tone: 'actual',
        label: t('studyAifg.scalable-formations.model.upperEdge'),
      },
      {
        x: bounds.minX + wallInset,
        y: lowerEdge,
        shape: 'dot',
        tone: 'actual',
        label: t('studyAifg.scalable-formations.model.lowerEdge'),
      },
    ],
    zones: sample.positions.map((position) => ({ ...position, radius: example.memberRadius })),
    links: [
      ...sample.positions.slice(1).map((position, index) => ({
        from: sample.positions[Math.max(0, index - 1)],
        to: position,
      })),
      ...[upperEdge, lowerEdge].map((y) => ({
        from: { x: bounds.minX + wallInset, y },
        to: { x: bounds.maxX - wallInset, y },
        tone: 'actual' as const,
      })),
    ],
    values: frameValues(t, sample, example, finalSample, anchor, upperEdge, lowerEdge),
    note: frameNote(t, sample, example),
    worked: workedStep(t, sample, example),
  };
}

function comparisonTimeline(
  t: StudyTranslate,
  normal: readonly ScalableFormationSample[],
  example: ScalableFormationParameters,
  reference: ReturnType<typeof scalableFormationSamples>,
  normalLast: ScalableFormationSample,
  referenceLast: ScalableFormationSample,
  referenceCount: number,
  failed: ScalableFormationSample | undefined,
  referenceFailure: ScalableFormationSample | undefined,
): NonNullable<MotionStudyModel['timeline']> {
  return {
    title: t('studyAifg.scalable-formations.model.comparisonTransverseFootprintIncludingBody'),
    xLabel: t('studyAifg.scalable-formations.model.comparisonTimeSeconds'),
    yLabel: t('studyAifg.scalable-formations.model.comparisonFullWidth'),
    seconds: normal.map(({ seconds }) => seconds),
    yRange: [
      0,
      Math.max(
        example.laneWidth,
        ...reference.map(({ width }) => width),
        ...normal.map(({ width }) => width),
      ) +
        2 * example.memberRadius,
    ],
    yTicks: [...new Set([0, normalLast.width, example.laneWidth, referenceLast.width])],
    reference: example.laneWidth,
    series: [
      {
        id: 'normal',
        label: t('studyAifg.scalable-formations.model.comparisonSolidGreenRequestScouts', {
          exampleTargetCount: example.targetCount,
        }),
        tone: 'actual',
        values: normal.map(({ width }) => width),
      },
      {
        id: 'reference',
        label: t('studyAifg.scalable-formations.model.comparisonDashedAmberRequestScouts', {
          referenceCount,
        }),
        tone: 'desired',
        values: reference.map(({ width }) => width),
      },
    ],
    marks: failed
      ? [{ x: failed.seconds, y: failed.width, tone: referenceFailure ? 'desired' : 'actual' }]
      : [],
  };
}

function comparison(
  t: StudyTranslate,
  normal: readonly ScalableFormationSample[],
  example: ScalableFormationParameters,
): NonNullable<MotionStudyModel['comparison']> {
  // Always compare different memberships, including when the reader requests the reference count.
  const referenceCount =
    example.targetCount === example.comparisonCount
      ? example.initialCount
      : example.comparisonCount;
  const reference = scalableFormationSamples(example, referenceCount);
  const normalLast = normal[normal.length - 1];
  const referenceLast = reference[reference.length - 1];
  const referenceFailure = reference.find(({ clearance }) => clearance < 0);
  const failed = referenceFailure ?? normal.find(({ clearance }) => clearance < 0);
  const failedRun = referenceFailure
    ? t('studyAifg.scalable-formations.model.comparisonReferenceMuster')
    : t('studyAifg.scalable-formations.model.comparisonChosenMuster');
  return {
    title: t('studyAifg.scalable-formations.model.comparisonMembershipChangesFootprintNot'),
    intro: t('studyAifg.scalable-formations.model.comparisonChangeTargetCountMustersStart', {
      exampleTargetCount: example.targetCount,
      referenceCount,
      exampleInitialCount: example.initialCount,
      exampleSpacing: fixed(example.spacing),
      exampleMemberRadius: fixed(example.memberRadius),
      exampleLaneWidth: fixed(example.laneWidth),
    }),
    timeline: comparisonTimeline(
      t,
      normal,
      example,
      reference,
      normalLast,
      referenceLast,
      referenceCount,
      failed,
      referenceFailure,
    ),
    findings: [
      t('studyAifg.scalable-formations.model.comparisonChosenMusterEndsScouts', {
        normalLastCount: normalLast.count,
        normalLastWidth: fixed(normalLast.width),
        normalLastClearance: fixed(normalLast.clearance),
        referenceLastCount: referenceLast.count,
        referenceLastWidth: fixed(referenceLast.width),
        referenceLastClearance: fixed(referenceLast.clearance),
      }),
      failed
        ? t('studyAifg.scalable-formations.model.comparisonFirstFailedProposalScouts', {
            failedSeconds: fixed(failed.seconds),
            failedCount: failed.count,
            failedRun,
            failedCentreSpan: fixed(failed.centreSpan),
            exampleMemberRadius: fixed(example.memberRadius),
            failedWidth: fixed(failed.width),
            failedWidth2: fixed(failed.width - example.laneWidth),
          })
        : t('studyAifg.scalable-formations.model.comparisonEveryProposedLayoutMusters'),
      t('studyAifg.scalable-formations.model.comparisonEngineGeneratesLayoutsChoosing'),
    ],
    note: t('studyAifg.scalable-formations.model.comparisonHorizontalReferenceLaneWidth'),
  };
}

function motionLegend(t: StudyTranslate): MotionStudyModel['legend'] {
  return [
    {
      tone: 'subject',
      label: t('studyAifg.scalable-formations.model.dotsProposedMemberCentres'),
    },
    {
      tone: 'target',
      label: t('studyAifg.scalable-formations.model.ringsGeneratedDestinations'),
    },
    {
      tone: 'zone',
      label: t('studyAifg.scalable-formations.model.circlesPhysicalMemberRadius'),
    },
    {
      tone: 'other',
      label: t('studyAifg.scalable-formations.model.crossStationaryAnchor'),
    },
    {
      tone: 'actual',
      label: t('studyAifg.scalable-formations.model.greenEdgesLaneLimits'),
    },
    {
      tone: 'muted',
      label: t('studyAifg.scalable-formations.model.linksSuccessiveSlotsEach'),
    },
  ];
}

export const present = (
  example: ScalableFormationParameters,
  samples: ReturnType<typeof scalableFormationSamples>,
  t: StudyTranslate,
): MotionStudyModel => {
  const bounds = boundsOf(samples, example);
  const fullStep =
    example.joinStart + (example.targetCount - example.initialCount - 1) * example.joinInterval;
  return {
    family: 'motion',
    motion: {
      bounds,
      frames: samples.map((sample) =>
        frameOf(t, sample, example, bounds, samples[samples.length - 1]),
      ),
    },
    timeline: {
      title: t('studyAifg.scalable-formations.model.musterFullWidthScouts'),
      xLabel: t('studyAifg.scalable-formations.model.comparisonTimeSeconds'),
      yLabel: t('studyAifg.scalable-formations.model.comparisonFullWidth'),
      seconds: samples.map(({ seconds }) => seconds),
      yRange: [
        0,
        Math.max(example.laneWidth, ...samples.map(({ width }) => width)) +
          2 * example.memberRadius,
      ],
      yTicks: [
        ...new Set([0, samples[0].width, samples[samples.length - 1].width, example.laneWidth]),
      ],
      reference: example.laneWidth,
      series: [
        {
          id: 'width',
          label: t('studyAifg.scalable-formations.model.solidGreenFullProposed'),
          tone: 'actual',
          values: samples.map(({ width }) => width),
        },
      ],
    },
    initialStep: fullStep,
    moments: [
      { label: t('studyAifg.scalable-formations.model.initialPatrol'), step: 0 },
      {
        label: t('studyAifg.scalable-formations.model.incompleteNewRow'),
        step: example.joinStart,
      },
      {
        label: t('studyAifg.scalable-formations.model.requestedPatrolComplete'),
        step: fullStep,
      },
      {
        label: t('studyAifg.scalable-formations.model.musterAssessed'),
        step: example.steps,
      },
    ].filter(
      (moment, index, moments) => moments.findIndex(({ step }) => step === moment.step) === index,
    ),
    legend: motionLegend(t),
    caption: t('studyAifg.scalable-formations.model.caption'),
    comparison: comparison(t, samples, example),
    inputs: inputs(t),
  };
};

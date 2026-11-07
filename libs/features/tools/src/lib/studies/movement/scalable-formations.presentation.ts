import { add, type Vec2 } from '@dotln-angular/scene-engine';

import { createNumberFormat } from '../number-format';
import type {
  MotionBounds,
  MotionFrame,
  MotionStudyModel,
  StudyComparison,
  StudyInput,
  StudyLegendEntry,
  StudyPoint,
  StudyValues,
  StudyWorkedStep,
  TimelineModel,
} from '../study-model';
import type { StudyTranslate } from '../study-translate';
import {
  anchorOf,
  type ScalableFormationParameters,
  type ScalableFormationSample,
  scalableFormationSamples,
} from './scalable-formations.simulation';

const { number: fixed, vector: point } = createNumberFormat({ normalizeNegativeZero: true });

interface ScalableFormationDescription {
  readonly example: ScalableFormationParameters;
  readonly samples: readonly ScalableFormationSample[];
  readonly bounds: MotionBounds;
  readonly finalSample: ScalableFormationSample;
  readonly fullStep: number;
  readonly anchor: StudyPoint;
  readonly upperEdge: number;
  readonly lowerEdge: number;
  readonly wallInset: number;
}
interface MembershipComparison {
  readonly example: ScalableFormationParameters;
  readonly normal: readonly ScalableFormationSample[];
  readonly reference: readonly ScalableFormationSample[];
  readonly normalLast: ScalableFormationSample;
  readonly referenceLast: ScalableFormationSample;
  readonly referenceCount: number;
  readonly failed: ScalableFormationSample | undefined;
  readonly referenceFailure: ScalableFormationSample | undefined;
}
function describeRun(
  example: ScalableFormationParameters,
  samples: readonly ScalableFormationSample[],
): ScalableFormationDescription {
  const bounds = boundsOf(samples, example);
  const anchor = anchorOf(example);
  return {
    example,
    samples,
    bounds,
    anchor,
    finalSample: samples[samples.length - 1],
    fullStep:
      example.joinStart + (example.targetCount - example.initialCount - 1) * example.joinInterval,
    upperEdge: anchor.y - example.laneWidth / 2,
    lowerEdge: anchor.y + example.laneWidth / 2,
    wallInset: Math.max(example.spacing, (bounds.maxX - bounds.minX) / 8),
  };
}

const inputs = (t: StudyTranslate): readonly StudyInput[] => [
  {
    name: 'targetCount',
    label: t('studyAifg.scalable-formations.model.labels.requestedMembers'),
    unit: t('studyAifg.scalable-formations.model.labels.scouts'),
    min: 4,
    max: 7,
    step: 1,
  },
  {
    name: 'spacing',
    label: t('studyAifg.scalable-formations.model.labels.slotSpacing'),
    unit: t('studyAifg.scalable-formations.model.inputs.unitUnits'),
    min: 1.5,
    max: 3,
    step: 0.25,
  },
  {
    name: 'laneWidth',
    label: t('studyAifg.scalable-formations.model.labels.laneWidth'),
    unit: t('studyAifg.scalable-formations.model.inputs.unitUnits'),
    min: 6,
    max: 14,
    step: 0.5,
  },
];

const namedPoints = (t: StudyTranslate, points: readonly Vec2[]) =>
  points
    .map((position, index) =>
      t('studyAifg.scalable-formations.model.labels.slot', {
        index,
        position: point(position),
      }),
    )
    .join('; ');

function workedStep(
  t: StudyTranslate,
  run: ScalableFormationDescription,
  sample: ScalableFormationSample,
): StudyWorkedStep {
  const { example } = run;

  const sum = sample.rawOffsets.reduce(add, { x: 0, y: 0 });
  const tip = sample.offsets[0];
  const upperArm = 2 * Math.floor((sample.count - 1) / 2);
  const lowerArm = 2 * Math.floor((sample.count - 2) / 2) + 1;
  const upper = Math.min(...sample.positions.map(({ y }) => y));
  const lower = Math.max(...sample.positions.map(({ y }) => y));
  return {
    title: t('studyAifg.scalable-formations.model.worked.scoutProposalSeconds', {
      sampleCount: sample.count,
      sampleSeconds: fixed(sample.seconds),
    }),
    lines: [
      t('studyAifg.scalable-formations.model.worked.membershipScheduleScoutsEngine', {
        sampleCount: sample.count,
        exampleSpacing: fixed(example.spacing),
      }),
      t('studyAifg.scalable-formations.model.worked.beforeCentringTipRelative', {
        rawOffsets: namedPoints(t, sample.rawOffsets),
      }),
      t('studyAifg.scalable-formations.model.worked.rawMean', {
        sumX: fixed(sum.x),
        sampleCount: sample.count,
        sumY: fixed(sum.y),
        sampleRawCentre: point(sample.rawCentre),
      }),
      t('studyAifg.scalable-formations.model.worked.centreTipAddAnchor', {
        rawCentreX: fixed(sample.rawCentre.x),
        rawCentreY: fixed(sample.rawCentre.y),
        tip: point(tip),
        anchor: point(anchorOf(example)),
        tipPosition: point(sample.positions[0]),
      }),
      t('studyAifg.scalable-formations.model.worked.upperArmEndsSlot', {
        upperArm,
        upperPosition: point(sample.positions[upperArm]),
        lowerArm,
        lowerPosition: point(sample.positions[lowerArm]),
      }),
      t('studyAifg.scalable-formations.model.worked.transverseCentreSpanFull', {
        lower: fixed(lower),
        upper: fixed(upper),
        sampleCentreSpan: fixed(sample.centreSpan),
        exampleMemberRadius: fixed(example.memberRadius),
        sampleWidth: fixed(sample.width),
      }),
      t('studyAifg.scalable-formations.model.worked.compareLaneWidthSmallest', {
        exampleLaneWidth: fixed(example.laneWidth),
        sampleClearance: fixed(sample.clearance),
        sampleRetainedShift: fixed(sample.retainedShift),
      }),
    ],
    note: t('studyAifg.scalable-formations.model.worked.localXRunsAlong'),
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
  run: ScalableFormationDescription,
  sample: ScalableFormationSample,
): string {
  const { example } = run;

  if (sample.clearance < 0)
    return sample.retainedShift > 0
      ? t('studyAifg.scalable-formations.model.phase.scoutJoinsWiderWedge')
      : t('studyAifg.scalable-formations.model.phase.wedgeCrossesLaneEdges');
  if (sample.step === 0) return t('studyAifg.scalable-formations.model.phase.initialWedgeFitsLane');
  if (sample.retainedShift > 0)
    return t('studyAifg.scalable-formations.model.phase.scoutJoinsWedgeRecentres');
  return sample.count === example.targetCount
    ? t('studyAifg.scalable-formations.model.phase.completedPatrolHoldsWedge')
    : t('studyAifg.scalable-formations.model.phase.patrolHoldsWedgeInside');
}

function frameValues(
  t: StudyTranslate,
  run: ScalableFormationDescription,
  sample: ScalableFormationSample,
): StudyValues {
  const { example, finalSample, anchor, upperEdge, lowerEdge } = run;

  return {
    seconds: fixed(sample.seconds),
    count: String(sample.count),
    targetCount: String(example.targetCount),
    initialCount: String(example.initialCount),
    finalWidth: fixed(finalSample.width),
    finalFitStatus:
      finalSample.clearance >= 0
        ? t('studyAifg.scalable-formations.model.values.fitsLane')
        : t('studyAifg.scalable-formations.model.values.doesNotFitLane'),
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
        ? t('studyAifg.scalable-formations.model.values.fitsLane')
        : t('studyAifg.scalable-formations.model.values.doesNotFitLane'),
  };
}

function frameOf(
  t: StudyTranslate,
  run: ScalableFormationDescription,
  sample: ScalableFormationSample,
): MotionFrame {
  const { example, bounds, anchor, upperEdge, lowerEdge, wallInset } = run;
  return {
    seconds: sample.seconds,
    bodies: sample.positions.map((position, index) => ({
      id: `proposal-slot-${index}`,
      label:
        index === 0
          ? t('studyAifg.scalable-formations.model.labels.tip')
          : index >= sample.count - 2
            ? index % 2 === 0
              ? t('studyAifg.scalable-formations.model.labels.upperArm')
              : t('studyAifg.scalable-formations.model.labels.lowerArm')
            : undefined,
      ...position,
    })),
    marks: [
      ...sample.positions.map((position) => ({ ...position, shape: 'ring' as const })),
      {
        ...anchor,
        shape: 'cross',
        tone: 'other',
        label: t('studyAifg.scalable-formations.model.labels.anchor'),
      },
      {
        x: bounds.minX + wallInset,
        y: upperEdge,
        shape: 'dot',
        tone: 'actual',
        label: t('studyAifg.scalable-formations.model.labels.upperEdge'),
      },
      {
        x: bounds.minX + wallInset,
        y: lowerEdge,
        shape: 'dot',
        tone: 'actual',
        label: t('studyAifg.scalable-formations.model.labels.lowerEdge'),
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
    values: frameValues(t, run, sample),
    note: frameNote(t, run, sample),
    worked: workedStep(t, run, sample),
  };
}

function comparisonTimeline(t: StudyTranslate, comparison: MembershipComparison): TimelineModel {
  const {
    example,
    normal,
    reference,
    normalLast,
    referenceLast,
    failed,
    referenceFailure,
    referenceCount,
  } = comparison;

  return {
    title: t('studyAifg.scalable-formations.model.comparison.transverseFootprintIncludingBody'),
    xLabel: t('studyAifg.scalable-formations.model.comparison.timeSeconds'),
    yLabel: t('studyAifg.scalable-formations.model.comparison.fullWidth'),
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
        label: t('studyAifg.scalable-formations.model.comparison.solidGreenRequestScouts', {
          exampleTargetCount: example.targetCount,
        }),
        tone: 'actual',
        values: normal.map(({ width }) => width),
      },
      {
        id: 'reference',
        label: t('studyAifg.scalable-formations.model.comparison.dashedAmberRequestScouts', {
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

function comparison(t: StudyTranslate, run: ScalableFormationDescription): StudyComparison {
  const { example, samples: normal } = run;

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
    ? t('studyAifg.scalable-formations.model.comparison.referenceMuster')
    : t('studyAifg.scalable-formations.model.comparison.chosenMuster');
  return {
    title: t('studyAifg.scalable-formations.model.comparison.membershipChangesFootprintNot'),
    intro: t('studyAifg.scalable-formations.model.comparison.changeTargetCountMustersStart', {
      exampleTargetCount: example.targetCount,
      referenceCount,
      exampleInitialCount: example.initialCount,
      exampleSpacing: fixed(example.spacing),
      exampleMemberRadius: fixed(example.memberRadius),
      exampleLaneWidth: fixed(example.laneWidth),
    }),
    timeline: comparisonTimeline(t, {
      example,
      normal,
      reference,
      normalLast,
      referenceLast,
      referenceCount,
      failed,
      referenceFailure,
    }),
    findings: [
      t('studyAifg.scalable-formations.model.comparison.chosenMusterEndsScouts', {
        normalLastCount: normalLast.count,
        normalLastWidth: fixed(normalLast.width),
        normalLastClearance: fixed(normalLast.clearance),
        referenceLastCount: referenceLast.count,
        referenceLastWidth: fixed(referenceLast.width),
        referenceLastClearance: fixed(referenceLast.clearance),
      }),
      failed
        ? t('studyAifg.scalable-formations.model.comparison.firstFailedProposalScouts', {
            failedSeconds: fixed(failed.seconds),
            failedCount: failed.count,
            failedRun,
            failedCentreSpan: fixed(failed.centreSpan),
            exampleMemberRadius: fixed(example.memberRadius),
            failedWidth: fixed(failed.width),
            excessWidth: fixed(failed.width - example.laneWidth),
          })
        : t('studyAifg.scalable-formations.model.comparison.everyProposedLayoutMusters'),
      t('studyAifg.scalable-formations.model.comparison.engineGeneratesLayoutsChoosing'),
    ],
    note: t('studyAifg.scalable-formations.model.comparison.horizontalReferenceLaneWidth'),
  };
}

function motionLegend(t: StudyTranslate): readonly StudyLegendEntry[] {
  return [
    {
      tone: 'subject',
      label: t('studyAifg.scalable-formations.model.labels.dotsProposedMemberCentres'),
    },
    {
      tone: 'target',
      label: t('studyAifg.scalable-formations.model.labels.ringsGeneratedDestinations'),
    },
    {
      tone: 'zone',
      label: t('studyAifg.scalable-formations.model.labels.circlesPhysicalMemberRadius'),
    },
    {
      tone: 'other',
      label: t('studyAifg.scalable-formations.model.labels.crossStationaryAnchor'),
    },
    {
      tone: 'actual',
      label: t('studyAifg.scalable-formations.model.labels.greenEdgesLaneLimits'),
    },
    {
      tone: 'muted',
      label: t('studyAifg.scalable-formations.model.labels.linksSuccessiveSlotsEach'),
    },
  ];
}

export const present = (
  example: ScalableFormationParameters,
  samples: readonly ScalableFormationSample[],
  t: StudyTranslate,
): MotionStudyModel => {
  const run = describeRun(example, samples);
  const { fullStep, bounds } = run;
  return {
    family: 'motion',
    motion: {
      bounds,
      frames: samples.map((sample) => frameOf(t, run, sample)),
    },
    timeline: {
      title: t('studyAifg.scalable-formations.model.labels.musterFullWidthScouts'),
      xLabel: t('studyAifg.scalable-formations.model.comparison.timeSeconds'),
      yLabel: t('studyAifg.scalable-formations.model.comparison.fullWidth'),
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
          label: t('studyAifg.scalable-formations.model.labels.solidGreenFullProposed'),
          tone: 'actual',
          values: samples.map(({ width }) => width),
        },
      ],
    },
    initialStep: fullStep,
    moments: [
      { label: t('studyAifg.scalable-formations.model.labels.initialPatrol'), step: 0 },
      {
        label: t('studyAifg.scalable-formations.model.labels.incompleteNewRow'),
        step: example.joinStart,
      },
      {
        label: t('studyAifg.scalable-formations.model.labels.requestedPatrolComplete'),
        step: fullStep,
      },
      {
        label: t('studyAifg.scalable-formations.model.labels.musterAssessed'),
        step: example.steps,
      },
    ].filter(
      (moment, index, moments) => moments.findIndex(({ step }) => step === moment.step) === index,
    ),
    legend: motionLegend(t),
    caption: t('studyAifg.scalable-formations.model.overview.caption'),
    comparison: comparison(t, run),
    inputs: inputs(t),
  };
};

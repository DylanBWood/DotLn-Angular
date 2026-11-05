import { distance, length, subtract, type Vec2 } from '@dotln-angular/scene-engine';

import type { MotionFrame, MotionStudyModel, StudyInput, StudyWorkedStep } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import {
  type FixedFormationParameters,
  type FixedFormationSample,
  fixedFormationSamples,
  fixedOffsets,
} from './fixed-formations.simulation';
import { fixed, pair as point } from './presentation';

const namedPoints = (t: StudyTranslate, points: readonly Vec2[]) =>
  points
    .map((position, index) =>
      t('studyAifg.fixed-formations.model.slot', {
        index: index + 1,
        position: point(position),
      }),
    )
    .join('; ');

const spacingRange = { min: 3, max: 6, step: 0.5 } as const;

const spacingInput = (t: StudyTranslate): StudyInput => ({
  name: 'spacing',
  label: t('studyAifg.fixed-formations.model.slotSpacing'),
  unit: t('studyAifg.fixed-formations.model.spacingInputUnitUnits'),
  ...spacingRange,
});

const turnInput = (t: StudyTranslate): StudyInput => ({
  name: 'turnSteps',
  label: t('studyAifg.fixed-formations.model.turnDuration'),
  unit: t('studyAifg.fixed-formations.model.frames'),
  min: 2,
  max: 30,
  step: 1,
});

function workedStep(
  t: StudyTranslate,
  sample: FixedFormationSample,
  example: FixedFormationParameters,
): StudyWorkedStep {
  const offset = sample.formation.slots[1];
  const { x: forwardX, y: forwardY } = sample.formation.heading;
  const { anchor } = sample.formation;
  const target = sample.targets[1];
  const previous = sample.previousTargets[1];
  const delta = subtract(target, previous);
  return {
    title: t('studyAifg.fixed-formations.model.workedMiraPivotSeconds', {
      sampleSeconds: fixed(sample.seconds),
    }),
    lines: [
      t('studyAifg.fixed-formations.model.workedKeepSlotLocalOffset', {
        offset: point(offset),
        anchor: point(anchor),
      }),
      t('studyAifg.fixed-formations.model.workedScheduledHeadingForwardEngine', {
        sampleAngleDegrees: fixed(sample.angleDegrees),
        forwardX: fixed(forwardX),
        forwardY: fixed(forwardY),
      }),
      t('studyAifg.fixed-formations.model.workedSlotX', {
        anchorX: fixed(anchor.x),
        offsetX: fixed(offset.x),
        forwardX: fixed(forwardX),
        offsetY: fixed(offset.y),
        forwardY: fixed(forwardY),
        targetX: fixed(target.x),
      }),
      t('studyAifg.fixed-formations.model.workedSlotY', {
        anchorY: fixed(anchor.y),
        offsetX: fixed(offset.x),
        forwardY: fixed(forwardY),
        offsetY: fixed(offset.y),
        forwardX: fixed(forwardX),
        targetY: fixed(target.y),
      }),
      t('studyAifg.fixed-formations.model.workedSlotMovesChordLength', {
        previous: point(previous),
        target: point(target),
        delta: point(delta),
        deltaX: fixed(delta.x),
        deltaY: fixed(delta.y),
        value6: fixed(distance(target, previous)),
      }),
      t('studyAifg.fixed-formations.model.workedLargestEscortChordFrame', {
        sampleDisplacement: fixed(sample.displacement),
        exampleTimeStep: fixed(example.timeStep),
        sampleRequiredSpeed: fixed(sample.requiredSpeed),
        exampleSpeedLimit: fixed(example.speedLimit),
      }),
    ],
    note:
      sample.step === 0
        ? t('studyAifg.fixed-formations.model.workedInitialLayoutThereNo')
        : t('studyAifg.fixed-formations.model.workedDisplacementEndsSelectedMoment'),
  };
}

function frameNote(
  t: StudyTranslate,
  sample: FixedFormationSample,
  example: FixedFormationParameters,
  peakSpeed: number,
): string {
  if (sample.step <= example.turnStart)
    return t('studyAifg.fixed-formations.model.phaseMiraHoldsEscortSlots');
  if (sample.step <= example.turnStart + example.turnSteps)
    return sample.requiredSpeed > example.speedLimit
      ? t('studyAifg.fixed-formations.model.phaseMiraTurnsPlaceSweeping')
      : t('studyAifg.fixed-formations.model.phaseMiraTurnsPlaceHer');
  return peakSpeed > example.speedLimit
    ? t('studyAifg.fixed-formations.model.phaseMiraSlotsAgainAlthough')
    : t('studyAifg.fixed-formations.model.phaseMiraStopsTurningEscort');
}

function frameOf(
  t: StudyTranslate,
  sample: FixedFormationSample,
  example: FixedFormationParameters,
  peakSpeed: number,
): MotionFrame {
  const { anchor, slots } = sample.formation;
  const escorts = sample.targets.slice(1);
  const preceding = sample.previousTargets.slice(1);
  const orbitRadius = Math.max(...slots.map(length));
  return {
    seconds: sample.seconds,
    bodies: [
      {
        id: 'mira',
        label: t('studyAifg.fixed-formations.model.mira'),
        ...anchor,
        heading: sample.angleRadians,
      },
    ],
    marks: [
      ...preceding.map((position) => ({
        ...position,
        shape: 'dot' as const,
        tone: 'muted' as const,
      })),
      ...escorts.map((position, index) => ({
        ...position,
        shape: 'ring' as const,
        label: t('studyAifg.fixed-formations.model.slotLabel', { index: index + 1 }),
      })),
    ],
    zones: [{ ...anchor, radius: orbitRadius }],
    links: escorts.map((target) => ({ from: anchor, to: target })),
    vectors: escorts.map((target, index) => {
      const delta = subtract(target, preceding[index]);
      return { ...preceding[index], dx: delta.x, dy: delta.y, tone: 'desired' };
    }),
    values: {
      members: String(example.members),
      spacing: fixed(example.spacing),
      fastTurnDuration: fixed(example.fastTurnSteps * example.timeStep),
      peakSpeed: fixed(peakSpeed),
      runSpeedStatus:
        peakSpeed > example.speedLimit
          ? t('studyAifg.fixed-formations.model.valueOverSampledBudget')
          : t('studyAifg.fixed-formations.model.valueWithinSampledBudget'),
      seconds: fixed(sample.seconds),
      anchor: point(anchor),
      localSlots: namedPoints(t, slots.slice(1)),
      targets: namedPoints(t, escorts),
      previousTargets: namedPoints(t, preceding),
      angle: fixed(sample.angleDegrees),
      turnDegrees: fixed(example.turnDegrees),
      turnDuration: fixed(example.turnSteps * example.timeStep),
      orbitRadius: fixed(orbitRadius),
      displacement: fixed(sample.displacement),
      requiredSpeed: fixed(sample.requiredSpeed),
      timeStep: fixed(example.timeStep),
      speedLimit: fixed(example.speedLimit),
      speedStatus:
        sample.requiredSpeed > example.speedLimit
          ? t('studyAifg.fixed-formations.model.valueOverBudget')
          : t('studyAifg.fixed-formations.model.valueWithinBudget'),
    },
    note: frameNote(t, sample, example, peakSpeed),
    worked: workedStep(t, sample, example),
  };
}

function comparison(
  t: StudyTranslate,
  normal: readonly FixedFormationSample[],
  example: FixedFormationParameters,
): NonNullable<MotionStudyModel['comparison']> {
  const fast = fixedFormationSamples(example, example.fastTurnSteps);
  const normalPeak = Math.max(...normal.map(({ requiredSpeed }) => requiredSpeed));
  const fastPeak = Math.max(...fast.map(({ requiredSpeed }) => requiredSpeed));
  const firstOver = fast.find(({ requiredSpeed }) => requiredSpeed > example.speedLimit);
  const fastMove = fast[example.turnStart + 1];
  return {
    title: t('studyAifg.fixed-formations.model.comparisonSamePivotCompletedSooner'),
    intro: t('studyAifg.fixed-formations.model.comparisonChangeTurnStepsHeadingChange', {
      exampleTurnSteps: example.turnSteps,
      exampleFastTurnSteps: example.fastTurnSteps,
      exampleTurnDegrees: fixed(example.turnDegrees),
    }),
    timeline: {
      title: t('studyAifg.fixed-formations.model.comparisonMinimumSpeedNeededReach'),
      xLabel: t('studyAifg.fixed-formations.model.comparisonTimeSeconds'),
      yLabel: t('studyAifg.fixed-formations.model.comparisonRequiredSpeed'),
      seconds: normal.map(({ seconds }) => seconds),
      yRange: [0, Math.max(normalPeak, fastPeak, example.speedLimit)],
      yTicks: [...new Set([0, example.speedLimit, Math.max(normalPeak, fastPeak)])],
      reference: example.speedLimit,
      series: [
        {
          id: 'normal',
          label: t('studyAifg.fixed-formations.model.comparisonSolidGreenTurnOver', {
            exampleTurnSteps: fixed(example.turnSteps * example.timeStep),
          }),
          tone: 'actual',
          values: normal.map(({ requiredSpeed }) => requiredSpeed),
        },
        {
          id: 'fast',
          label: t('studyAifg.fixed-formations.model.comparisonDashedAmberTurnOver', {
            exampleFastTurnSteps: fixed(example.fastTurnSteps * example.timeStep),
          }),
          tone: 'desired',
          values: fast.map(({ requiredSpeed }) => requiredSpeed),
        },
      ],
    },
    findings: [
      t('studyAifg.fixed-formations.model.comparisonChosenTurnPeaksShorter', {
        normalPeak: fixed(normalPeak),
        fastPeak: fixed(fastPeak),
        exampleSpeedLimit: fixed(example.speedLimit),
        value4: firstOver
          ? t('studyAifg.fixed-formations.model.comparisonShorterRunFirstExceeds', {
              firstOverSeconds: fixed(firstOver.seconds),
            })
          : t('studyAifg.fixed-formations.model.comparisonShorterRunStaysWithin'),
      }),
      t('studyAifg.fixed-formations.model.comparisonFirstChangedSampleShorter', {
        fastMoveDisplacement: fixed(fastMove.displacement),
        exampleTimeStep: fixed(example.timeStep),
        fastMoveRequiredSpeed: fixed(fastMove.requiredSpeed),
      }),
      firstOver
        ? t('studyAifg.fixed-formations.model.comparisonGeneratorReturnsEveryTarget')
        : t('studyAifg.fixed-formations.model.comparisonSampledSpeedLimit'),
    ],
    note: t('studyAifg.fixed-formations.model.comparisonHorizontalReferenceGuardSpeed'),
  };
}

function runTimeline(
  t: StudyTranslate,
  samples: ReturnType<typeof fixedFormationSamples>,
  example: FixedFormationParameters,
  peakSpeed: number,
): NonNullable<MotionStudyModel['timeline']> {
  return {
    title: t('studyAifg.fixed-formations.model.escortTargetDemandDuring'),
    xLabel: t('studyAifg.fixed-formations.model.comparisonTimeSeconds'),
    yLabel: t('studyAifg.fixed-formations.model.comparisonRequiredSpeed'),
    seconds: samples.map(({ seconds }) => seconds),
    yRange: [0, Math.max(example.speedLimit, ...samples.map(({ requiredSpeed }) => requiredSpeed))],
    yTicks: [...new Set([0, example.speedLimit, peakSpeed])],
    reference: example.speedLimit,
    series: [
      {
        id: 'required',
        label: t('studyAifg.fixed-formations.model.solidGreenLargestSampled'),
        tone: 'actual',
        values: samples.map(({ requiredSpeed }) => requiredSpeed),
      },
    ],
  };
}

export const present = (
  example: FixedFormationParameters,
  samples: ReturnType<typeof fixedFormationSamples>,
  t: StudyTranslate,
): MotionStudyModel => {
  const peakSpeed = Math.max(...samples.map(({ requiredSpeed }) => requiredSpeed));
  // Keep the scale steady across the spacing slider so a wider escort looks wider.
  const drawingSpacing = Math.max(example.spacing, spacingRange.max);
  const radius = Math.max(...fixedOffsets({ ...example, spacing: drawingSpacing }).map(length));
  const extent = radius + drawingSpacing;
  const finish = example.turnStart + example.turnSteps;
  return {
    family: 'motion',
    motion: {
      bounds: {
        minX: example.leaderX - extent,
        maxX: example.leaderX + extent,
        minY: example.leaderY - extent,
        maxY: example.leaderY + extent,
      },
      frames: samples.map((sample) => frameOf(t, sample, example, peakSpeed)),
    },
    timeline: runTimeline(t, samples, example, peakSpeed),
    initialStep: example.turnStart + Math.ceil(example.turnSteps / 2),
    moments: [
      { label: t('studyAifg.fixed-formations.model.offsetsRest'), step: 0 },
      {
        label: t('studyAifg.fixed-formations.model.firstTurnSample'),
        step: example.turnStart + 1,
      },
      {
        label: t('studyAifg.fixed-formations.model.midTurn'),
        step: example.turnStart + Math.ceil(example.turnSteps / 2),
      },
      { label: t('studyAifg.fixed-formations.model.turnCompleted'), step: finish },
      {
        label: t('studyAifg.fixed-formations.model.targetsAgain'),
        step: Math.min(finish + 1, example.steps),
      },
    ].filter(
      (moment, index, moments) => moments.findIndex(({ step }) => step === moment.step) === index,
    ),
    legend: [
      { tone: 'subject', label: t('studyAifg.fixed-formations.model.leaderArrowMira') },
      {
        tone: 'target',
        label: t('studyAifg.fixed-formations.model.ringsEscortDestinations'),
      },
      {
        tone: 'muted',
        label: t('studyAifg.fixed-formations.model.dotsPrecedingDestinationsSpokes'),
      },
      {
        tone: 'desired',
        label: t('studyAifg.fixed-formations.model.arrowsOneSampledDisplacement'),
      },
      {
        tone: 'zone',
        label: t('studyAifg.fixed-formations.model.circularGuideOuterSlot'),
      },
    ],
    caption: t('studyAifg.fixed-formations.model.caption'),
    comparison: comparison(t, samples, example),
    inputs: [turnInput(t), spacingInput(t)],
  };
};

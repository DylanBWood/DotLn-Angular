import { distance, length, subtract, type Vec2 } from '@dotln-angular/scene-engine';

import { createNumberFormat } from '../number-format';
import type {
  MotionFrame,
  MotionStudyModel,
  StudyComparison,
  StudyInput,
  StudyWorkedStep,
  TimelineModel,
} from '../study-model';
import type { StudyTranslate } from '../study-translate';
import {
  type FixedFormationParameters,
  type FixedFormationSample,
  fixedFormationSamples,
  fixedOffsets,
} from './fixed-formations.simulation';

function describeRun(
  example: FixedFormationParameters,
  samples: readonly FixedFormationSample[],
): FixedFormationDescription {
  const peakSpeed = Math.max(...samples.map(({ requiredSpeed }) => requiredSpeed));
  // Keep the scale steady across the spacing slider so a wider escort looks wider.
  const drawingSpacing = Math.max(example.spacing, spacingRange.max);
  const radius = Math.max(...fixedOffsets({ ...example, spacing: drawingSpacing }).map(length));
  const extent = radius + drawingSpacing;
  const finish = example.turnStart + example.turnSteps;

  return { example, samples, peakSpeed, extent, finish };
}

interface FixedFormationDescription {
  readonly example: FixedFormationParameters;
  readonly samples: readonly FixedFormationSample[];
  readonly peakSpeed: number;
  readonly extent: number;
  readonly finish: number;
}

const { number: fixed, vector: point } = createNumberFormat({ normalizeNegativeZero: true });

const namedPoints = (t: StudyTranslate, points: readonly Vec2[]) =>
  points
    .map((position, index) =>
      t('studyAifg.fixed-formations.model.labels.slot', {
        index: index + 1,
        position: point(position),
      }),
    )
    .join('; ');

const spacingRange = { min: 3, max: 6, step: 0.5 } as const;

const spacingInput = (t: StudyTranslate): StudyInput => ({
  name: 'spacing',
  label: t('studyAifg.fixed-formations.model.inputs.slotSpacing'),
  unit: t('studyAifg.fixed-formations.model.inputs.spacingInputUnitUnits'),
  ...spacingRange,
});

const turnInput = (t: StudyTranslate): StudyInput => ({
  name: 'turnSteps',
  label: t('studyAifg.fixed-formations.model.inputs.turnDuration'),
  unit: t('studyAifg.fixed-formations.model.inputs.frames'),
  min: 2,
  max: 30,
  step: 1,
});

function workedStep(
  t: StudyTranslate,
  run: FixedFormationDescription,
  sample: FixedFormationSample,
): StudyWorkedStep {
  const { example } = run;

  const offset = sample.formation.slots[1];
  const { x: forwardX, y: forwardY } = sample.formation.heading;
  const { anchor } = sample.formation;
  const target = sample.targets[1];
  const previous = sample.previousTargets[1];
  const delta = subtract(target, previous);
  return {
    title: t('studyAifg.fixed-formations.model.worked.miraPivotSeconds', {
      sampleSeconds: fixed(sample.seconds),
    }),
    lines: [
      t('studyAifg.fixed-formations.model.worked.keepSlotLocalOffset', {
        offset: point(offset),
        anchor: point(anchor),
      }),
      t('studyAifg.fixed-formations.model.worked.scheduledHeadingForwardEngine', {
        sampleAngleDegrees: fixed(sample.angleDegrees),
        forwardX: fixed(forwardX),
        forwardY: fixed(forwardY),
      }),
      t('studyAifg.fixed-formations.model.worked.slotX', {
        anchorX: fixed(anchor.x),
        offsetX: fixed(offset.x),
        forwardX: fixed(forwardX),
        offsetY: fixed(offset.y),
        forwardY: fixed(forwardY),
        targetX: fixed(target.x),
      }),
      t('studyAifg.fixed-formations.model.worked.slotY', {
        anchorY: fixed(anchor.y),
        offsetX: fixed(offset.x),
        forwardY: fixed(forwardY),
        offsetY: fixed(offset.y),
        forwardX: fixed(forwardX),
        targetY: fixed(target.y),
      }),
      t('studyAifg.fixed-formations.model.worked.slotMovesChordLength', {
        previous: point(previous),
        target: point(target),
        delta: point(delta),
        deltaX: fixed(delta.x),
        deltaY: fixed(delta.y),
        chordLength: fixed(distance(target, previous)),
      }),
      t('studyAifg.fixed-formations.model.worked.largestEscortChordFrame', {
        sampleDisplacement: fixed(sample.displacement),
        exampleTimeStep: fixed(example.timeStep),
        sampleRequiredSpeed: fixed(sample.requiredSpeed),
        exampleSpeedLimit: fixed(example.speedLimit),
      }),
    ],
    note:
      sample.step === 0
        ? t('studyAifg.fixed-formations.model.worked.initialLayoutThereNo')
        : t('studyAifg.fixed-formations.model.worked.displacementEndsSelectedMoment'),
  };
}

function frameNote(
  t: StudyTranslate,
  run: FixedFormationDescription,
  sample: FixedFormationSample,
): string {
  const { example, peakSpeed } = run;

  if (sample.step <= example.turnStart)
    return t('studyAifg.fixed-formations.model.phase.miraHoldsEscortSlots');
  if (sample.step <= example.turnStart + example.turnSteps)
    return sample.requiredSpeed > example.speedLimit
      ? t('studyAifg.fixed-formations.model.phase.miraTurnsPlaceSweeping')
      : t('studyAifg.fixed-formations.model.phase.miraTurnsPlaceHer');
  return peakSpeed > example.speedLimit
    ? t('studyAifg.fixed-formations.model.phase.miraSlotsAgainAlthough')
    : t('studyAifg.fixed-formations.model.phase.miraStopsTurningEscort');
}

function frameOf(
  t: StudyTranslate,
  run: FixedFormationDescription,
  sample: FixedFormationSample,
): MotionFrame {
  const { example, peakSpeed } = run;

  const { anchor, slots } = sample.formation;
  const escorts = sample.targets.slice(1);
  const preceding = sample.previousTargets.slice(1);
  const orbitRadius = Math.max(...slots.map(length));
  return {
    seconds: sample.seconds,
    bodies: [
      {
        id: 'mira',
        label: t('studyAifg.fixed-formations.model.labels.mira'),
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
        label: t('studyAifg.fixed-formations.model.labels.slotLabel', { index: index + 1 }),
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
          ? t('studyAifg.fixed-formations.model.values.overSampledBudget')
          : t('studyAifg.fixed-formations.model.values.withinSampledBudget'),
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
          ? t('studyAifg.fixed-formations.model.values.overBudget')
          : t('studyAifg.fixed-formations.model.values.withinBudget'),
    },
    note: frameNote(t, run, sample),
    worked: workedStep(t, run, sample),
  };
}

function comparison(t: StudyTranslate, run: FixedFormationDescription): StudyComparison {
  const { samples: normal, example } = run;

  const fast = fixedFormationSamples(example, example.fastTurnSteps);
  const normalPeak = Math.max(...normal.map(({ requiredSpeed }) => requiredSpeed));
  const fastPeak = Math.max(...fast.map(({ requiredSpeed }) => requiredSpeed));
  const firstOver = fast.find(({ requiredSpeed }) => requiredSpeed > example.speedLimit);
  const fastMove = fast[example.turnStart + 1];
  return {
    title: t('studyAifg.fixed-formations.model.comparison.samePivotCompletedSooner'),
    intro: t('studyAifg.fixed-formations.model.comparison.changeTurnStepsHeadingChange', {
      exampleTurnSteps: example.turnSteps,
      exampleFastTurnSteps: example.fastTurnSteps,
      exampleTurnDegrees: fixed(example.turnDegrees),
    }),
    timeline: {
      title: t('studyAifg.fixed-formations.model.comparison.minimumSpeedNeededReach'),
      xLabel: t('studyAifg.fixed-formations.model.comparison.timeSeconds'),
      yLabel: t('studyAifg.fixed-formations.model.comparison.requiredSpeed'),
      seconds: normal.map(({ seconds }) => seconds),
      yRange: [0, Math.max(normalPeak, fastPeak, example.speedLimit)],
      yTicks: [...new Set([0, example.speedLimit, Math.max(normalPeak, fastPeak)])],
      reference: example.speedLimit,
      series: [
        {
          id: 'normal',
          label: t('studyAifg.fixed-formations.model.comparison.solidGreenTurnOver', {
            exampleTurnSteps: fixed(example.turnSteps * example.timeStep),
          }),
          tone: 'actual',
          values: normal.map(({ requiredSpeed }) => requiredSpeed),
        },
        {
          id: 'fast',
          label: t('studyAifg.fixed-formations.model.comparison.dashedAmberTurnOver', {
            exampleFastTurnSteps: fixed(example.fastTurnSteps * example.timeStep),
          }),
          tone: 'desired',
          values: fast.map(({ requiredSpeed }) => requiredSpeed),
        },
      ],
    },
    findings: [
      t('studyAifg.fixed-formations.model.comparison.chosenTurnPeaksShorter', {
        normalPeak: fixed(normalPeak),
        fastPeak: fixed(fastPeak),
        exampleSpeedLimit: fixed(example.speedLimit),
        shorterRunStatus: firstOver
          ? t('studyAifg.fixed-formations.model.comparison.shorterRunFirstExceeds', {
              firstOverSeconds: fixed(firstOver.seconds),
            })
          : t('studyAifg.fixed-formations.model.comparison.shorterRunStaysWithin'),
      }),
      t('studyAifg.fixed-formations.model.comparison.firstChangedSampleShorter', {
        fastMoveDisplacement: fixed(fastMove.displacement),
        exampleTimeStep: fixed(example.timeStep),
        fastMoveRequiredSpeed: fixed(fastMove.requiredSpeed),
      }),
      firstOver
        ? t('studyAifg.fixed-formations.model.comparison.generatorReturnsEveryTarget')
        : t('studyAifg.fixed-formations.model.comparison.sampledSpeedLimit'),
    ],
    note: t('studyAifg.fixed-formations.model.comparison.horizontalReferenceGuardSpeed'),
  };
}

function runTimeline(t: StudyTranslate, run: FixedFormationDescription): TimelineModel {
  const { samples, example, peakSpeed } = run;

  return {
    title: t('studyAifg.fixed-formations.model.timeline.escortTargetDemandDuring'),
    xLabel: t('studyAifg.fixed-formations.model.comparison.timeSeconds'),
    yLabel: t('studyAifg.fixed-formations.model.comparison.requiredSpeed'),
    seconds: samples.map(({ seconds }) => seconds),
    yRange: [0, Math.max(example.speedLimit, ...samples.map(({ requiredSpeed }) => requiredSpeed))],
    yTicks: [...new Set([0, example.speedLimit, peakSpeed])],
    reference: example.speedLimit,
    series: [
      {
        id: 'required',
        label: t('studyAifg.fixed-formations.model.timeline.solidGreenLargestSampled'),
        tone: 'actual',
        values: samples.map(({ requiredSpeed }) => requiredSpeed),
      },
    ],
  };
}

export const present = (
  example: FixedFormationParameters,
  samples: readonly FixedFormationSample[],
  t: StudyTranslate,
): MotionStudyModel => {
  const run = describeRun(example, samples);
  const { extent, finish } = run;
  return {
    family: 'motion',
    motion: {
      bounds: {
        minX: example.leaderX - extent,
        maxX: example.leaderX + extent,
        minY: example.leaderY - extent,
        maxY: example.leaderY + extent,
      },
      frames: samples.map((sample) => frameOf(t, run, sample)),
    },
    timeline: runTimeline(t, run),
    initialStep: example.turnStart + Math.ceil(example.turnSteps / 2),
    moments: [
      { label: t('studyAifg.fixed-formations.model.labels.offsetsRest'), step: 0 },
      {
        label: t('studyAifg.fixed-formations.model.labels.firstTurnSample'),
        step: example.turnStart + 1,
      },
      {
        label: t('studyAifg.fixed-formations.model.labels.midTurn'),
        step: example.turnStart + Math.ceil(example.turnSteps / 2),
      },
      { label: t('studyAifg.fixed-formations.model.labels.turnCompleted'), step: finish },
      {
        label: t('studyAifg.fixed-formations.model.labels.targetsAgain'),
        step: Math.min(finish + 1, example.steps),
      },
    ].filter(
      (moment, index, moments) => moments.findIndex(({ step }) => step === moment.step) === index,
    ),
    legend: [
      { tone: 'subject', label: t('studyAifg.fixed-formations.model.labels.leaderArrowMira') },
      {
        tone: 'target',
        label: t('studyAifg.fixed-formations.model.labels.ringsEscortDestinations'),
      },
      {
        tone: 'muted',
        label: t('studyAifg.fixed-formations.model.labels.dotsPrecedingDestinationsSpokes'),
      },
      {
        tone: 'desired',
        label: t('studyAifg.fixed-formations.model.labels.arrowsOneSampledDisplacement'),
      },
      {
        tone: 'zone',
        label: t('studyAifg.fixed-formations.model.labels.circularGuideOuterSlot'),
      },
    ],
    caption: t('studyAifg.fixed-formations.model.overview.caption'),
    comparison: comparison(t, run),
    inputs: [turnInput(t), spacingInput(t)],
  };
};

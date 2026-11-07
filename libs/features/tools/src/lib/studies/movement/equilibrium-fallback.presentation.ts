import { length, scale } from '@dotln-angular/scene-engine';

import { createNumberFormat } from '../number-format';
import type {
  MotionFrame,
  MotionStudyModel,
  StudyComparison,
  StudyMoment,
  StudyValues,
  StudyWorkedStep,
  TimelineModel,
} from '../study-model';
import type { StudyTranslate } from '../study-translate';
import {
  type EquilibriumParameters,
  type EquilibriumStep,
  equilibriumSteps,
} from './equilibrium-fallback.simulation';
import { boundsOfPoints } from './presentation';

interface EquilibriumDescription {
  readonly example: EquilibriumParameters;
  readonly run: readonly EquilibriumStep[];
  readonly comparison: readonly EquilibriumStep[];
  readonly seconds: readonly number[];
  readonly inputValues: StudyValues;

  readonly firstPrimary: number;
  readonly firstReturn: number;
  readonly fallbackSteps: number;
  readonly maxOffset: number;
  readonly comparisonMaxOffset: number;
  readonly comparisonInitialMagnitude: number;
  readonly comparisonStart: string;
  readonly comparisonStarts: boolean;
  readonly primaryHandover: string;
  readonly returnReading: string;
  readonly movementReading: string;
}
interface EquilibriumFrame {
  readonly reading: EquilibriumDescription;
  readonly index: number;
  readonly step: EquilibriumStep;
}

const { number: fixed, vector } = createNumberFormat();

function noteOf(
  t: StudyTranslate,
  step: EquilibriumStep,
  example: EquilibriumParameters,
  index: number,
): string {
  if (step.activeGroup === 'None')
    return length(step.state.velocity) === 0
      ? length(step.primary) === 0
        ? t('studyAifg.equilibrium-fallback.model.phase.beaconPullsCancelFallback')
        : t('studyAifg.equilibrium-fallback.model.phase.neitherRequestClearsThreshold')
      : t('studyAifg.equilibrium-fallback.model.phase.requestsTooSmallTake');
  if (step.activeGroup === 'Wander fallback')
    return index === 0
      ? t('studyAifg.equilibrium-fallback.model.phase.fallbackNudge')
      : t('studyAifg.equilibrium-fallback.model.phase.beaconPullTooSmall');
  return (step.state.position.y - example.beaconY) * step.state.velocity.y > 0
    ? t('studyAifg.equilibrium-fallback.model.phase.beaconsReclaimedControlNori')
    : t('studyAifg.equilibrium-fallback.model.phase.beaconsPullNoriBack');
}

function describeRun(
  t: StudyTranslate,
  example: EquilibriumParameters,
  run: readonly EquilibriumStep[],
): EquilibriumDescription {
  const comparison = equilibriumSteps(example, example.weakFallbackWeight);
  const seconds = run.map((_step, index) => index * example.timeStep);
  const firstPrimary = run.findIndex(({ activeGroup }) => activeGroup === 'Beacon blend');
  const firstReturn = run.findIndex(
    ({ state }) => (state.position.y - example.beaconY) * state.velocity.y < 0,
  );
  const fallbackSteps = run
    .slice(0, -1)
    .filter(({ activeGroup }) => activeGroup === 'Wander fallback').length;
  const maxOffset = Math.max(
    ...run.map(({ state }) => Math.abs(state.position.y - example.beaconY)),
  );
  const comparisonMaxOffset = Math.max(
    ...comparison.map(({ state }) => Math.abs(state.position.y - example.beaconY)),
  );
  const comparisonInitialMagnitude = length(comparison[0].fallback);
  const comparisonStarts = comparisonInitialMagnitude > example.epsilon;
  const comparisonStart = comparisonStarts
    ? t('studyAifg.equilibrium-fallback.model.comparison.fallbackClearsThreshold')
    : t('studyAifg.equilibrium-fallback.model.comparison.fallbackDoesNot');
  const primaryHandover =
    firstPrimary < 0
      ? t('studyAifg.equilibrium-fallback.model.labels.beaconGroupNeverReclaims')
      : t('studyAifg.equilibrium-fallback.model.labels.beaconGroupFirstReclaims', {
          seconds: fixed(seconds[firstPrimary]),
        });
  const returnReading =
    firstReturn < 0
      ? t('studyAifg.equilibrium-fallback.model.labels.noriDoesNotMove')
      : t('studyAifg.equilibrium-fallback.model.labels.noriFirstMovesBack', {
          seconds: fixed(seconds[firstReturn]),
        });
  const movementReading =
    maxOffset === 0
      ? t('studyAifg.equilibrium-fallback.model.labels.noriStaysRestBecause')
      : t('studyAifg.equilibrium-fallback.model.labels.noriLeavesBalanceNeither');
  const inputValues = Object.fromEntries(
    Object.entries(example).map(([name, value]) => [name, String(Number(fixed(value)))]),
  );
  return {
    example,
    run,
    seconds,
    inputValues,
    firstPrimary,
    firstReturn,
    fallbackSteps,
    maxOffset,
    comparisonMaxOffset,
    comparisonInitialMagnitude,
    comparisonStart,
    comparison,
    comparisonStarts,
    primaryHandover,
    returnReading,
    movementReading,
  };
}

function frameWorked(t: StudyTranslate, frame: EquilibriumFrame): StudyWorkedStep {
  const { reading, index, step } = frame;
  const { example } = reading;

  return {
    title: t('studyAifg.equilibrium-fallback.model.worked.nori', {
      seconds: fixed(reading.seconds[index]),
    }),
    lines: [
      t('studyAifg.equilibrium-fallback.model.worked.beginPositionVelocity', {
        statePosition: vector(step.state.position),
        stateVelocity: vector(step.state.velocity),
      }),
      t('studyAifg.equilibrium-fallback.model.worked.weightedBeaconRequestsClip', {
        leftRequest: vector(scale(step.left, example.beaconWeight)),
        rightRequest: vector(scale(step.right, example.beaconWeight)),
        exampleMaxAcceleration: fixed(example.maxAcceleration),
        stepPrimary: vector(step.primary),
      }),
      t('studyAifg.equilibrium-fallback.model.worked.unroundedBeaconMagnitudeEpsilon', {
        thresholdStatus:
          length(step.primary) > example.epsilon
            ? t('studyAifg.equilibrium-fallback.model.worked.clears')
            : t('studyAifg.equilibrium-fallback.model.worked.doesNotClear'),
        exampleEpsilon: fixed(example.epsilon),
        stepPrimary: fixed(length(step.primary)),
      }),
      t('studyAifg.equilibrium-fallback.model.worked.engineWanderRequestsMultiply', {
        stepWander: vector(step.wander),
        exampleFallbackWeight: fixed(example.fallbackWeight),
        stepFallback: vector(step.fallback),
      }),
      t('studyAifg.equilibrium-fallback.model.worked.firstActiveBeaconBlendWander', {
        stepActiveGroup: groupName(t, step.activeGroup),
        stepAcceleration: vector(step.acceleration),
      }),
      t('studyAifg.equilibrium-fallback.model.worked.newVelocityClipLength', {
        stateVelocity: vector(step.state.velocity),
        stepAcceleration: vector(step.acceleration),
        exampleTimeStep: fixed(example.timeStep),
        exampleMaxSpeed: fixed(example.maxSpeed),
        nextVelocity: vector(step.next.velocity),
      }),
      t('studyAifg.equilibrium-fallback.model.worked.newPosition', {
        statePosition: vector(step.state.position),
        nextVelocity: vector(step.next.velocity),
        exampleTimeStep: fixed(example.timeStep),
        nextPosition: vector(step.next.position),
      }),
    ],
    note: t('studyAifg.equilibrium-fallback.model.worked.displayedValuesRoundedCalculations'),
  };
}

function compareRuns(t: StudyTranslate, reading: EquilibriumDescription): StudyComparison {
  const { example, run } = reading;

  return {
    title: t('studyAifg.equilibrium-fallback.model.comparison.doesFallbackClearThreshold'),
    intro: t('studyAifg.equilibrium-fallback.model.comparison.compareChosenFallbackWeight', {
      exampleFallbackWeight: fixed(example.fallbackWeight),
      exampleWeakFallbackWeight: fixed(example.weakFallbackWeight),
      exampleEpsilon: fixed(example.epsilon),
      comparisonInitialMagnitude: fixed(reading.comparisonInitialMagnitude),
      comparisonStart: reading.comparisonStart,
    }),
    timeline: {
      title: t('studyAifg.equilibrium-fallback.model.comparison.displacementBeaconLine'),
      xLabel: t('studyAifg.equilibrium-fallback.model.labels.timeSeconds'),
      yLabel: t('studyAifg.equilibrium-fallback.model.comparison.absoluteDistanceLine'),
      seconds: reading.seconds,
      yRange: [0, Math.max(example.radius, reading.maxOffset, reading.comparisonMaxOffset)],
      reference: 0,
      series: [
        {
          id: 'chosen',
          label: t('studyAifg.equilibrium-fallback.model.comparison.chosenWeight', {
            exampleFallbackWeight: fixed(example.fallbackWeight),
          }),
          tone: 'actual',
          values: run.map(({ state }) => Math.abs(state.position.y - example.beaconY)),
        },
        {
          id: 'comparison',
          label: t('studyAifg.equilibrium-fallback.model.comparison.comparisonWeight', {
            exampleWeakFallbackWeight: fixed(example.weakFallbackWeight),
          }),
          tone: 'desired',
          values: reading.comparison.map(({ state }) =>
            Math.abs(state.position.y - example.beaconY),
          ),
        },
      ],
    },
    findings: [
      t('studyAifg.equilibrium-fallback.model.comparison.chosenRunReachesMaximum', {
        maxOffset: fixed(reading.maxOffset),
        comparisonMaxOffset: fixed(reading.comparisonMaxOffset),
        comparisonOutcome: reading.comparisonStarts
          ? t('studyAifg.equilibrium-fallback.model.comparison.comparisonFallbackStrongEnough')
          : t('studyAifg.equilibrium-fallback.model.comparison.comparisonStaysRestBecause'),
      }),
      t('studyAifg.equilibrium-fallback.model.comparison.fallbackOwnsSimulatedUpdates', {
        primaryHandover: reading.primaryHandover,
        fallbackSteps: reading.fallbackSteps,
        movementReading: reading.movementReading,
      }),
    ],
    note: t('studyAifg.equilibrium-fallback.model.comparison.linesJoinDeterministicFixed'),
  };
}

function frameValues(t: StudyTranslate, frame: EquilibriumFrame): StudyValues {
  const { reading, index, step } = frame;
  const { example } = reading;

  return {
    ...reading.inputValues,
    seconds: fixed(reading.seconds[index]),
    position: vector(step.state.position),
    velocity: vector(step.state.velocity),
    leftRequest: vector(scale(step.left, example.beaconWeight)),
    rightRequest: vector(scale(step.right, example.beaconWeight)),
    primaryRequest: vector(step.primary),
    fallbackRequest: vector(step.fallback),
    acceleration: vector(step.acceleration),
    activeGroup: groupName(t, step.activeGroup),
    lineOffset: fixed(Math.abs(step.state.position.y - example.beaconY)),
    primaryMagnitude: fixed(length(step.primary)),
    fallbackMagnitude: fixed(length(step.fallback)),
    selectedMagnitude: fixed(length(step.acceleration)),
    beaconReading:
      length(step.primary) === 0
        ? t('studyAifg.equilibrium-fallback.model.values.opposingBeaconRequestsCancel')
        : t('studyAifg.equilibrium-fallback.model.values.beaconsPullBackTowards', {
            stepPrimary: fixed(length(step.primary)),
          }),
    firstPrimaryTime:
      reading.firstPrimary < 0
        ? t('studyAifg.equilibrium-fallback.model.values.notReached')
        : fixed(reading.seconds[reading.firstPrimary]),
    firstReturnTime:
      reading.firstReturn < 0
        ? t('studyAifg.equilibrium-fallback.model.values.notReached')
        : fixed(reading.seconds[reading.firstReturn]),
    primaryHandover: reading.primaryHandover,
    returnReading: reading.returnReading,
    movementReading: reading.movementReading,
    fallbackSteps: String(reading.fallbackSteps),
    maxOffset: fixed(reading.maxOffset),
    comparisonMaxOffset: fixed(reading.comparisonMaxOffset),
    comparisonInitialMagnitude: fixed(reading.comparisonInitialMagnitude),
    comparisonStart: reading.comparisonStart,
  };
}

function runMoments(t: StudyTranslate, reading: EquilibriumDescription): readonly StudyMoment[] {
  const { example } = reading;

  return [
    { label: t('studyAifg.equilibrium-fallback.model.moments.requestsCancel'), step: 0 },
    {
      label:
        reading.maxOffset === 0
          ? t('studyAifg.equilibrium-fallback.model.moments.rest')
          : t('studyAifg.equilibrium-fallback.model.moments.nudgeMovesNori'),
      step: Math.min(1, example.steps),
    },
    ...(reading.firstPrimary > 1
      ? [
          {
            label: t('studyAifg.equilibrium-fallback.model.moments.beaconGroupResumes'),
            step: reading.firstPrimary,
          },
        ]
      : []),
    ...(reading.firstReturn > 1
      ? [
          {
            label: t('studyAifg.equilibrium-fallback.model.moments.returningTowardsLine'),
            step: reading.firstReturn,
          },
        ]
      : []),
    {
      label: t('studyAifg.equilibrium-fallback.model.moments.endRun'),
      step: example.steps,
    },
  ];
}

function motionFrames(t: StudyTranslate, reading: EquilibriumDescription): readonly MotionFrame[] {
  const { example, run } = reading;

  return run.map((step, index) => ({
    seconds: reading.seconds[index],
    bodies: [
      {
        id: 'Nori',
        ...step.state.position,
        tone: 'subject',
        label: t('studyAifg.equilibrium-fallback.model.labels.nori'),
      },
    ],
    marks: [
      {
        x: -example.beaconHalfSpan,
        y: example.beaconY,
        shape: 'cross',
        tone: 'target',
        label: t('studyAifg.equilibrium-fallback.model.labels.west'),
      },
      {
        x: example.beaconHalfSpan,
        y: example.beaconY,
        shape: 'cross',
        tone: 'target',
        label: t('studyAifg.equilibrium-fallback.model.labels.east'),
      },
    ],
    links: [
      {
        from: { x: -example.beaconHalfSpan, y: example.beaconY },
        to: { x: example.beaconHalfSpan, y: example.beaconY },
        tone: 'muted',
      },
    ],
    vectors: [
      {
        ...step.state.position,
        dx: step.left.x * example.beaconWeight,
        dy: step.left.y * example.beaconWeight,
        tone: 'target',
      },
      {
        ...step.state.position,
        dx: step.right.x * example.beaconWeight,
        dy: step.right.y * example.beaconWeight,
        tone: 'target',
      },
      { ...step.state.position, dx: step.primary.x, dy: step.primary.y, tone: 'other' },
      {
        x: step.state.position.x + example.radius * 2,
        y: step.state.position.y,
        dx: step.fallback.x,
        dy: step.fallback.y,
        tone: 'desired',
      },
      {
        x: step.state.position.x - example.radius * 2,
        y: step.state.position.y,
        dx: step.acceleration.x,
        dy: step.acceleration.y,
        tone: 'actual',
      },
    ],
    values: frameValues(t, { reading, index, step }),
    note: noteOf(t, step, example, index),
    worked: frameWorked(t, { reading, index, step }),
  }));
}

function runTimeline(t: StudyTranslate, reading: EquilibriumDescription): TimelineModel {
  const { example, run } = reading;

  return {
    title: t('studyAifg.equilibrium-fallback.model.timeline.cancellationControlReturningBeacon'),
    xLabel: t('studyAifg.equilibrium-fallback.model.labels.timeSeconds'),
    yLabel: t('studyAifg.equilibrium-fallback.model.timeline.accelerationMagnitude'),
    seconds: reading.seconds,
    reference: example.epsilon,
    series: [
      {
        id: 'primary',
        label: t('studyAifg.equilibrium-fallback.model.timeline.beaconBlend'),
        tone: 'other',
        values: run.map(({ primary }) => length(primary)),
      },
      {
        id: 'fallback',
        label: t('studyAifg.equilibrium-fallback.model.timeline.wanderFallbackRequest'),
        tone: 'desired',
        values: run.map(({ fallback }) => length(fallback)),
      },
      {
        id: 'selected',
        label: t('studyAifg.equilibrium-fallback.model.timeline.selectedAcceleration'),
        tone: 'actual',
        values: run.map(({ acceleration }) => length(acceleration)),
      },
    ],
  };
}

export const present = (
  example: EquilibriumParameters,
  run: readonly EquilibriumStep[],
  t: StudyTranslate,
): MotionStudyModel => {
  const reading = describeRun(t, example, run);
  const frames: readonly MotionFrame[] = motionFrames(t, reading);
  const points = frames.flatMap((frame) => [
    ...frame.bodies,
    ...(frame.marks ?? []),
    ...(frame.vectors ?? []).flatMap(({ x, y, dx, dy }) => [
      { x, y },
      { x: x + dx, y: y + dy },
    ]),
  ]);
  const padding = Math.max(
    example.radius * 2,
    (Math.max(...points.map(({ x }) => x)) - Math.min(...points.map(({ x }) => x))) * 0.08,
  );
  return {
    family: 'motion',
    motion: {
      frames,
      bounds: boundsOfPoints(points, padding),
      trail: true,
    },
    timeline: runTimeline(t, reading),
    initialStep: 0,
    moments: runMoments(t, reading),
    legend: [
      {
        tone: 'target',
        label: t('studyAifg.equilibrium-fallback.model.labels.arrowsThroughNoriWeighted'),
      },
      {
        tone: 'other',
        label: t('studyAifg.equilibrium-fallback.model.labels.arrowThroughNoriNet'),
      },
      {
        tone: 'desired',
        label: t('studyAifg.equilibrium-fallback.model.labels.rightArrowFallbackRequest'),
      },
      {
        tone: 'actual',
        label: t('studyAifg.equilibrium-fallback.model.labels.leftArrowSelectedAcceleration'),
      },
    ],
    caption: t('studyAifg.equilibrium-fallback.model.overview.caption'),
    comparison: compareRuns(t, reading),
    inputs: [
      {
        name: 'fallbackWeight',
        label: t('studyAifg.equilibrium-fallback.model.labels.fallbackWeight'),
        unit: t('studyAifg.equilibrium-fallback.model.labels.weight'),
        min: 0,
        max: 1,
        step: 0.01,
      },
      {
        name: 'epsilon',
        label: t('studyAifg.equilibrium-fallback.model.labels.activationThreshold'),
        unit: t('studyAifg.equilibrium-fallback.model.inputs.unitUnitsS'),
        min: 0.05,
        max: 1,
        step: 0.05,
      },
    ],
  };
};

function groupName(t: StudyTranslate, value: string): string {
  switch (value) {
    case 'Beacon blend':
      return t('studyAifg.equilibrium-fallback.model.names.groupNameBeaconblend');
    case 'Wander fallback':
      return t('studyAifg.equilibrium-fallback.model.names.groupNameWanderfallback');
    case 'None':
      return t('studyAifg.equilibrium-fallback.model.names.groupNameNone');
    default:
      return value;
  }
}

import { length, scale } from '@dotln-angular/scene-engine';

import type { MotionFrame, MotionStudyModel, StudyWorkedStep } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import {
  type EquilibriumParameters,
  type EquilibriumStep,
  equilibriumSteps,
} from './equilibrium-fallback.simulation';
import { boundsOfPoints, decimal as fixed, vectorText as vector } from './presentation';

function noteOf(
  t: StudyTranslate,
  step: EquilibriumStep,
  example: EquilibriumParameters,
  index: number,
) {
  if (step.activeGroup === 'None')
    return length(step.state.velocity) === 0
      ? length(step.primary) === 0
        ? t('studyAifg.equilibrium-fallback.model.phaseBeaconPullsCancelFallback')
        : t('studyAifg.equilibrium-fallback.model.phaseNeitherRequestClearsThreshold')
      : t('studyAifg.equilibrium-fallback.model.phaseRequestsTooSmallTake');
  if (step.activeGroup === 'Wander fallback')
    return index === 0
      ? t('studyAifg.equilibrium-fallback.model.fallbackNudge')
      : t('studyAifg.equilibrium-fallback.model.phaseBeaconPullTooSmall');
  return (step.state.position.y - example.beaconY) * step.state.velocity.y > 0
    ? t('studyAifg.equilibrium-fallback.model.phaseBeaconsReclaimedControlNori')
    : t('studyAifg.equilibrium-fallback.model.phaseBeaconsPullNoriBack');
}

function describeRun(
  t: StudyTranslate,
  example: EquilibriumParameters,
  run: ReturnType<typeof equilibriumSteps>,
) {
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
    ? t('studyAifg.equilibrium-fallback.model.comparisonFallbackClearsThreshold')
    : t('studyAifg.equilibrium-fallback.model.comparisonFallbackDoesNot');
  const primaryHandover =
    firstPrimary < 0
      ? t('studyAifg.equilibrium-fallback.model.beaconGroupNeverReclaims')
      : t('studyAifg.equilibrium-fallback.model.beaconGroupFirstReclaims', {
          seconds: fixed(seconds[firstPrimary]),
        });
  const returnReading =
    firstReturn < 0
      ? t('studyAifg.equilibrium-fallback.model.noriDoesNotMove')
      : t('studyAifg.equilibrium-fallback.model.noriFirstMovesBack', {
          seconds: fixed(seconds[firstReturn]),
        });
  const movementReading =
    maxOffset === 0
      ? t('studyAifg.equilibrium-fallback.model.noriStaysRestBecause')
      : t('studyAifg.equilibrium-fallback.model.noriLeavesBalanceNeither');
  const inputValues = Object.fromEntries(
    Object.entries(example).map(([name, value]) => [name, String(Number(fixed(value)))]),
  );
  return {
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

function frameWorked(
  t: StudyTranslate,
  reading: ReturnType<typeof describeRun>,
  index: number,
  step: EquilibriumStep,
  example: EquilibriumParameters,
): StudyWorkedStep {
  return {
    title: t('studyAifg.equilibrium-fallback.model.workedNori', {
      seconds: fixed(reading.seconds[index]),
    }),
    lines: [
      t('studyAifg.equilibrium-fallback.model.workedBeginPositionVelocity', {
        statePosition: vector(step.state.position),
        stateVelocity: vector(step.state.velocity),
      }),
      t('studyAifg.equilibrium-fallback.model.workedWeightedBeaconRequestsClip', {
        value1: vector(scale(step.left, example.beaconWeight)),
        value2: vector(scale(step.right, example.beaconWeight)),
        exampleMaxAcceleration: fixed(example.maxAcceleration),
        stepPrimary: vector(step.primary),
      }),
      t('studyAifg.equilibrium-fallback.model.workedUnroundedBeaconMagnitudeEpsilon', {
        value1:
          length(step.primary) > example.epsilon
            ? t('studyAifg.equilibrium-fallback.model.workedClears')
            : t('studyAifg.equilibrium-fallback.model.workedDoesNotClear'),
        exampleEpsilon: fixed(example.epsilon),
        stepPrimary: fixed(length(step.primary)),
      }),
      t('studyAifg.equilibrium-fallback.model.workedEngineWanderRequestsMultiply', {
        stepWander: vector(step.wander),
        exampleFallbackWeight: fixed(example.fallbackWeight),
        stepFallback: vector(step.fallback),
      }),
      t('studyAifg.equilibrium-fallback.model.workedFirstActiveBeaconBlendWander', {
        stepActiveGroup: groupName(t, step.activeGroup),
        stepAcceleration: vector(step.acceleration),
      }),
      t('studyAifg.equilibrium-fallback.model.workedNewVelocityClipLength', {
        stateVelocity: vector(step.state.velocity),
        stepAcceleration: vector(step.acceleration),
        exampleTimeStep: fixed(example.timeStep),
        exampleMaxSpeed: fixed(example.maxSpeed),
        nextVelocity: vector(step.next.velocity),
      }),
      t('studyAifg.equilibrium-fallback.model.workedNewPosition', {
        statePosition: vector(step.state.position),
        nextVelocity: vector(step.next.velocity),
        exampleTimeStep: fixed(example.timeStep),
        nextPosition: vector(step.next.position),
      }),
    ],
    note: t('studyAifg.equilibrium-fallback.model.workedDisplayedValuesRoundedCalculations'),
  };
}

function compareRuns(
  t: StudyTranslate,
  example: EquilibriumParameters,
  reading: ReturnType<typeof describeRun>,
  run: ReturnType<typeof equilibriumSteps>,
): NonNullable<MotionStudyModel['comparison']> {
  return {
    title: t('studyAifg.equilibrium-fallback.model.comparisonDoesFallbackClearThreshold'),
    intro: t('studyAifg.equilibrium-fallback.model.comparisonCompareChosenFallbackWeight', {
      exampleFallbackWeight: fixed(example.fallbackWeight),
      exampleWeakFallbackWeight: fixed(example.weakFallbackWeight),
      exampleEpsilon: fixed(example.epsilon),
      comparisonInitialMagnitude: fixed(reading.comparisonInitialMagnitude),
      comparisonStart: reading.comparisonStart,
    }),
    timeline: {
      title: t('studyAifg.equilibrium-fallback.model.comparisonDisplacementBeaconLine'),
      xLabel: t('studyAifg.equilibrium-fallback.model.timeSeconds'),
      yLabel: t('studyAifg.equilibrium-fallback.model.comparisonAbsoluteDistanceLine'),
      seconds: reading.seconds,
      yRange: [0, Math.max(example.radius, reading.maxOffset, reading.comparisonMaxOffset)],
      reference: 0,
      series: [
        {
          id: 'chosen',
          label: t('studyAifg.equilibrium-fallback.model.comparisonChosenWeight', {
            exampleFallbackWeight: fixed(example.fallbackWeight),
          }),
          tone: 'actual',
          values: run.map(({ state }) => Math.abs(state.position.y - example.beaconY)),
        },
        {
          id: 'comparison',
          label: t('studyAifg.equilibrium-fallback.model.comparisonComparisonWeight', {
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
      t('studyAifg.equilibrium-fallback.model.comparisonChosenRunReachesMaximum', {
        maxOffset: fixed(reading.maxOffset),
        comparisonMaxOffset: fixed(reading.comparisonMaxOffset),
        value3: reading.comparisonStarts
          ? t('studyAifg.equilibrium-fallback.model.comparisonComparisonFallbackStrongEnough')
          : t('studyAifg.equilibrium-fallback.model.comparisonComparisonStaysRestBecause'),
      }),
      t('studyAifg.equilibrium-fallback.model.comparisonFallbackOwnsSimulatedUpdates', {
        primaryHandover: reading.primaryHandover,
        fallbackSteps: reading.fallbackSteps,
        movementReading: reading.movementReading,
      }),
    ],
    note: t('studyAifg.equilibrium-fallback.model.comparisonLinesJoinDeterministicFixed'),
  };
}

function frameValues(
  t: StudyTranslate,
  reading: ReturnType<typeof describeRun>,
  index: number,
  step: EquilibriumStep,
  example: EquilibriumParameters,
): Readonly<Record<string, string>> {
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
        ? t('studyAifg.equilibrium-fallback.model.opposingBeaconRequestsCancel')
        : t('studyAifg.equilibrium-fallback.model.beaconsPullBackTowards', {
            stepPrimary: fixed(length(step.primary)),
          }),
    firstPrimaryTime:
      reading.firstPrimary < 0
        ? t('studyAifg.equilibrium-fallback.model.notReached')
        : fixed(reading.seconds[reading.firstPrimary]),
    firstReturnTime:
      reading.firstReturn < 0
        ? t('studyAifg.equilibrium-fallback.model.notReached')
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

function runMoments(
  t: StudyTranslate,
  reading: ReturnType<typeof describeRun>,
  example: EquilibriumParameters,
): MotionStudyModel['moments'] {
  return [
    { label: t('studyAifg.equilibrium-fallback.model.requestsCancel'), step: 0 },
    {
      label:
        reading.maxOffset === 0
          ? t('studyAifg.equilibrium-fallback.model.rest')
          : t('studyAifg.equilibrium-fallback.model.nudgeMovesNori'),
      step: Math.min(1, example.steps),
    },
    ...(reading.firstPrimary > 1
      ? [
          {
            label: t('studyAifg.equilibrium-fallback.model.beaconGroupResumes'),
            step: reading.firstPrimary,
          },
        ]
      : []),
    ...(reading.firstReturn > 1
      ? [
          {
            label: t('studyAifg.equilibrium-fallback.model.returningTowardsLine'),
            step: reading.firstReturn,
          },
        ]
      : []),
    {
      label: t('studyAifg.equilibrium-fallback.model.endRun'),
      step: example.steps,
    },
  ];
}

function motionFrames(
  t: StudyTranslate,
  run: ReturnType<typeof equilibriumSteps>,
  reading: ReturnType<typeof describeRun>,
  example: EquilibriumParameters,
): readonly MotionFrame[] {
  return run.map((step, index) => ({
    seconds: reading.seconds[index],
    bodies: [
      {
        id: 'Nori',
        ...step.state.position,
        tone: 'subject',
        label: t('studyAifg.equilibrium-fallback.model.nori'),
      },
    ],
    marks: [
      {
        x: -example.beaconHalfSpan,
        y: example.beaconY,
        shape: 'cross',
        tone: 'target',
        label: t('studyAifg.equilibrium-fallback.model.west'),
      },
      {
        x: example.beaconHalfSpan,
        y: example.beaconY,
        shape: 'cross',
        tone: 'target',
        label: t('studyAifg.equilibrium-fallback.model.east'),
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
    values: frameValues(t, reading, index, step, example),
    note: noteOf(t, step, example, index),
    worked: frameWorked(t, reading, index, step, example),
  }));
}

function runTimeline(
  t: StudyTranslate,
  reading: ReturnType<typeof describeRun>,
  example: EquilibriumParameters,
  run: ReturnType<typeof equilibriumSteps>,
): NonNullable<MotionStudyModel['timeline']> {
  return {
    title: t('studyAifg.equilibrium-fallback.model.cancellationControlReturningBeacon'),
    xLabel: t('studyAifg.equilibrium-fallback.model.timeSeconds'),
    yLabel: t('studyAifg.equilibrium-fallback.model.accelerationMagnitude'),
    seconds: reading.seconds,
    reference: example.epsilon,
    series: [
      {
        id: 'primary',
        label: t('studyAifg.equilibrium-fallback.model.beaconBlend'),
        tone: 'other',
        values: run.map(({ primary }) => length(primary)),
      },
      {
        id: 'fallback',
        label: t('studyAifg.equilibrium-fallback.model.wanderFallbackRequest'),
        tone: 'desired',
        values: run.map(({ fallback }) => length(fallback)),
      },
      {
        id: 'selected',
        label: t('studyAifg.equilibrium-fallback.model.selectedAcceleration'),
        tone: 'actual',
        values: run.map(({ acceleration }) => length(acceleration)),
      },
    ],
  };
}

export const present = (
  example: EquilibriumParameters,
  run: ReturnType<typeof equilibriumSteps>,
  t: StudyTranslate,
): MotionStudyModel => {
  const reading = describeRun(t, example, run);
  const frames: readonly MotionFrame[] = motionFrames(t, run, reading, example);
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
    timeline: runTimeline(t, reading, example, run),
    initialStep: 0,
    moments: runMoments(t, reading, example),
    legend: [
      {
        tone: 'target',
        label: t('studyAifg.equilibrium-fallback.model.arrowsThroughNoriWeighted'),
      },
      {
        tone: 'other',
        label: t('studyAifg.equilibrium-fallback.model.arrowThroughNoriNet'),
      },
      {
        tone: 'desired',
        label: t('studyAifg.equilibrium-fallback.model.rightArrowFallbackRequest'),
      },
      {
        tone: 'actual',
        label: t('studyAifg.equilibrium-fallback.model.leftArrowSelectedAcceleration'),
      },
    ],
    caption: t('studyAifg.equilibrium-fallback.model.caption'),
    comparison: compareRuns(t, example, reading, run),
    inputs: [
      {
        name: 'fallbackWeight',
        label: t('studyAifg.equilibrium-fallback.model.fallbackWeight'),
        unit: t('studyAifg.equilibrium-fallback.model.weight'),
        min: 0,
        max: 1,
        step: 0.01,
      },
      {
        name: 'epsilon',
        label: t('studyAifg.equilibrium-fallback.model.activationThreshold'),
        unit: t('studyAifg.equilibrium-fallback.model.inputsUnitUnitsS'),
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
      return t('studyAifg.equilibrium-fallback.model.groupNameBeaconblend');
    case 'Wander fallback':
      return t('studyAifg.equilibrium-fallback.model.groupNameWanderfallback');
    case 'None':
      return t('studyAifg.equilibrium-fallback.model.groupNameNone');
    default:
      return value;
  }
}

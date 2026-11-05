import {
  add,
  centroid,
  distance,
  length,
  slotPosition,
  type Vec2,
} from '@dotln-angular/scene-engine';

import type { MotionFrame, MotionStudyModel, StudyWorkedStep } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import {
  anchorLag,
  arrivalSteps,
  calculateGroupStep,
  type GroupExample,
  groupSamples,
  type GroupState,
  groupStates,
  maxSlotError,
  memberIds,
  slotErrors,
} from './group-movement.simulation';
import { boundsOfPoints, decimal as fixed, vectorText as point } from './presentation';

const arrivalSummary = (
  t: StudyTranslate,
  states: readonly GroupState[],
  example: GroupExample,
) => {
  const steps = arrivalSteps(states, example);
  const times = steps
    .map(
      (step, index) =>
        `${memberName(t, index)} ${step === null ? t('studyAifg.group-movement.model.notYet') : t('studyAifg.group-movement.model.arrivalSummaryS', { step: fixed(step * example.timeStep) })}`,
    )
    .join('; ');
  const reached = steps.filter((step): step is number => step !== null);
  return {
    times,
    spread:
      reached.length === memberIds.length
        ? t('studyAifg.group-movement.model.arrivalSummarySpreadS', {
            value1: fixed((Math.max(...reached) - Math.min(...reached)) * example.timeStep),
          })
        : t('studyAifg.group-movement.model.unknownAnyMemberNot'),
  };
};

function describeWorkedStep(
  state: GroupState,
  example: GroupExample,
  calculation: ReturnType<typeof calculateGroupStep>,
) {
  const medic = state.members[1];
  const target = calculation.targets[1];
  const gap = distance(medic.position, target);
  const stop = example.targetRadius / 2;
  const desiredSpeed =
    gap <= stop
      ? 0
      : gap >= example.slowRadius
        ? medic.maxSpeed
        : (medic.maxSpeed * (gap - stop)) / (example.slowRadius - stop);
  const desiredX = Math.sign(target.x - medic.position.x) * desiredSpeed;
  const requested = (desiredX - medic.velocity.x) / example.responseTime;
  const nextMedic = calculation.next.members[1];
  const nextMean = centroid(calculation.next.members.map(({ position }) => position));
  return {
    target,
    medic,
    gap,
    stop,
    desiredSpeed,
    desiredX,
    requested,
    nextMedic,
    nextMean,
  };
}

function memberLines(
  t: StudyTranslate,
  state: GroupState,
  calculation: ReturnType<typeof calculateGroupStep>,
): readonly string[] {
  return state.members.map((member, index) =>
    t('studyAifg.group-movement.model.workedPositionVelocitySlot', {
      memberNames: memberName(t, index),
      memberPosition: point(member.position),
      memberVelocity: point(member.velocity),
      value4: point(calculation.targets[index]),
    }),
  );
}

function workedLines(
  t: StudyTranslate,
  state: GroupState,
  calculation: ReturnType<typeof calculateGroupStep>,
  description: ReturnType<typeof describeWorkedStep>,
  example: GroupExample,
  step: number,
): readonly string[] {
  return [
    ...memberLines(t, state, calculation),
    t('studyAifg.group-movement.model.workedOldAnchorMedicOffset', {
      formationAnchor: point(state.formation.anchor),
      value2: point(state.formation.slots[1]),
      target: point(description.target),
    }),
    t('studyAifg.group-movement.model.workedDistanceSlotStopDistance', {
      targetX: fixed(description.target.x),
      positionX: fixed(description.medic.position.x),
      gap: fixed(description.gap),
      exampleTargetRadius: fixed(example.targetRadius),
      stop: fixed(description.stop),
    }),
    description.gap <= description.stop
      ? t('studyAifg.group-movement.model.workedInsideStopDistanceDesired')
      : description.gap >= example.slowRadius
        ? t('studyAifg.group-movement.model.workedOutsideSlowingRadiusDesired', {
            exampleSlowRadius: fixed(example.slowRadius),
            medicMaxSpeed: fixed(description.medic.maxSpeed),
          })
        : t('studyAifg.group-movement.model.workedInsideSlowingRadius', {
            medicMaxSpeed: fixed(description.medic.maxSpeed),
            gap: fixed(description.gap),
            stop: fixed(description.stop),
            exampleSlowRadius: fixed(example.slowRadius),
            desiredSpeed: fixed(description.desiredSpeed),
          }),
    t('studyAifg.group-movement.model.workedRequestedXAccelerationEngine', {
      desiredX: fixed(description.desiredX),
      velocityX: fixed(description.medic.velocity.x),
      exampleResponseTime: fixed(example.responseTime),
      requested: fixed(description.requested),
      exampleMaxAcceleration: fixed(example.maxAcceleration),
      accelerationsX: fixed(calculation.accelerations[1].x),
    }),
    t('studyAifg.group-movement.model.workedUpdateVelocityCappedX', {
      medicMaxSpeed: fixed(description.medic.maxSpeed),
      velocityX: fixed(description.medic.velocity.x),
      accelerationsX: fixed(calculation.accelerations[1].x),
      exampleTimeStep: fixed(example.timeStep),
      velocityX2: fixed(description.nextMedic.velocity.x),
      positionX: fixed(description.medic.position.x),
      positionX2: fixed(description.nextMedic.position.x),
    }),
    t('studyAifg.group-movement.model.workedAfterEveryFollowerMoves', {
      nextMean: point(description.nextMean),
      formationAnchor: point(calculation.next.formation.anchor),
      exampleLagLimit: fixed(example.lagLimit),
    }),
    ...(step === 0
      ? [
          t('studyAifg.group-movement.model.workedInitialAnchorCruiseRequest', {
            exampleAnchorSpeed: fixed(example.anchorSpeed),
            exampleEnginePlanningSeconds: fixed(example.enginePlanningSeconds),
            exampleAnchorSpeed2: fixed(example.anchorSpeed / example.enginePlanningSeconds),
            anchorVelocityX: fixed(calculation.next.formation.anchorVelocity.x),
            exampleStartX: fixed(example.startX),
            exampleTimeStep: fixed(example.timeStep),
            exampleEngineAnchorPull: fixed(example.engineAnchorPull),
            anchorX: fixed(calculation.next.formation.anchor.x),
          }),
        ]
      : []),
  ];
}

function workedStep(
  t: StudyTranslate,
  state: GroupState,
  step: number,
  example: GroupExample,
  calculation: ReturnType<typeof calculateGroupStep>,
): StudyWorkedStep {
  const description = describeWorkedStep(state, example, calculation);
  return {
    title: t('studyAifg.group-movement.model.workedMedicStep', {
      step: fixed(step * example.timeStep),
      step2: fixed((step + 1) * example.timeStep),
    }),
    lines: workedLines(t, state, calculation, description, example, step),
    note:
      step === example.steps
        ? t('studyAifg.group-movement.model.workedCalculationPreviewsOneMore')
        : t('studyAifg.group-movement.model.workedRoundedValuesExplainCalculation'),
  };
}

const isArrived = (state: GroupState, index: number, example: GroupExample) =>
  distance(
    state.members[index].position,
    add({ x: example.goalX, y: 0 }, state.formation.slots[index]),
  ) <= example.arrivalDistance && length(state.members[index].velocity) <= example.arrivalSpeed;

function frameNote(
  t: StudyTranslate,
  state: GroupState,
  step: number,
  example: GroupExample,
  slowing: boolean,
) {
  if (step === 0) return t('studyAifg.group-movement.model.phaseEveryoneStartsOwnSlot');
  if (state.members.every(({ velocity }) => length(velocity) === 0))
    return t('studyAifg.group-movement.model.phaseAnchorMovedAheadSquad');
  if (maxSlotError(state) > example.slotErrorBudget)
    return t('studyAifg.group-movement.model.phaseMedicFallenTooFar');
  const arrived = state.members.map((_member, index) => isArrived(state, index, example));
  if (arrived.every(Boolean)) return t('studyAifg.group-movement.model.phaseEveryoneNearFinalSlot');
  if (arrived.some(Boolean)) return t('studyAifg.group-movement.model.phaseSomeMembersPassArrival');
  if (slowing) return t('studyAifg.group-movement.model.phaseAnchorSlowsNearBeacon');
  if (state.members[0].position.x - state.members[1].position.x > 0.005)
    return t('studyAifg.group-movement.model.phaseMedicTrailsEscortsBecause');
  return t('studyAifg.group-movement.model.phaseSquadStartsAcceleratingAfter');
}

function frameValues(
  runValues: Readonly<Record<string, string>>,
  memberRelation: string,
  gapOwner: string,
  error: number,
  state: GroupState,
  example: GroupExample,
): Readonly<Record<string, string>> {
  return {
    ...runValues,
    memberRelation,
    gapOwner,
    slotError: fixed(error),
    anchorLag: fixed(anchorLag(state)),
    budget: fixed(example.slotErrorBudget),
    spacing: fixed(example.spacing),
    timeStep: fixed(example.timeStep),
    responseTime: fixed(example.responseTime),
    slowRadius: fixed(example.slowRadius),
    stopDistance: fixed(example.targetRadius / 2),
    accelerationLimit: fixed(example.maxAcceleration),
    lagLimit: fixed(example.lagLimit),
    arrivalDistance: fixed(example.arrivalDistance),
    arrivalSpeed: fixed(example.arrivalSpeed),
    anchorSpeed: fixed(example.anchorSpeed),
    planningSeconds: fixed(example.enginePlanningSeconds),
    cruiseRequest: fixed(example.anchorSpeed / example.enginePlanningSeconds),
    medicSpeedNow: fixed(length(state.members[1].velocity)),
    escortSpeedNow: fixed(length(state.members[0].velocity)),
  };
}

function frameMarks(
  t: StudyTranslate,
  slots: Vec2[],
  state: GroupState,
  example: GroupExample,
  anchorLabel: {
    x: number;
    y: number;
  },
  beaconLabel: {
    x: number;
    y: number;
  },
): MotionFrame['marks'] {
  return [
    ...slots.map((slot) => ({ ...slot, shape: 'ring' as const, tone: 'target' as const })),
    { ...state.formation.anchor, shape: 'dot', tone: 'desired' },
    { x: example.goalX, y: 0, shape: 'cross', tone: 'target' },
    {
      ...anchorLabel,
      shape: 'dot',
      tone: 'muted',
      label: t('studyAifg.group-movement.model.anchor'),
    },
    {
      ...beaconLabel,
      shape: 'dot',
      tone: 'muted',
      label: t('studyAifg.group-movement.model.beacon'),
    },
  ];
}

function frameOf(
  t: StudyTranslate,
  state: GroupState,
  step: number,
  example: GroupExample,
  runValues: Readonly<Record<string, string>>,
  calculation: ReturnType<typeof calculateGroupStep>,
): MotionFrame {
  const slots = state.formation.assignment.map(({ slot }) => slotPosition(state.formation, slot));
  const errors = slotErrors(state);
  const error = Math.max(...errors);
  const lead = state.members[0].position.x - state.members[1].position.x;
  const memberRelation =
    Math.abs(lead) < 0.005
      ? t('studyAifg.group-movement.model.medicNearlyLevelEscorts')
      : lead > 0
        ? t('studyAifg.group-movement.model.medicTrailsEscorts', {
            lead: fixed(lead),
          })
        : t('studyAifg.group-movement.model.medicAheadEscorts', {
            value1: fixed(-lead),
          });
  const gapOwner =
    error - Math.min(...errors) < 0.005
      ? t('studyAifg.group-movement.model.allMembersEqualSlot')
      : errors[1] >= error - 1e-10
        ? t('studyAifg.group-movement.model.medicLargestSlotGap')
        : t('studyAifg.group-movement.model.escortsLargestSlotGap');
  const slowing =
    length(calculation.next.formation.anchorVelocity) <
    length(state.formation.anchorVelocity) - 1e-10;
  // Leader lines lift the anchor and beacon names away from the medic's lane, even at arrival.
  const anchorLabel = { x: state.formation.anchor.x, y: -2 * example.spacing };
  const beaconLabel = { x: example.goalX, y: 2 * example.spacing };
  return {
    seconds: step * example.timeStep,
    bodies: state.members.map((member, index) => ({
      id: member.id,
      label: [
        t('studyAifg.group-movement.model.north'),
        t('studyAifg.group-movement.model.medic'),
        t('studyAifg.group-movement.model.south'),
      ][index],
      ...member.position,
      tone: member.id === 'medic' ? 'actual' : 'subject',
    })),
    marks: frameMarks(t, slots, state, example, anchorLabel, beaconLabel),
    links: [
      ...state.members.map((member, index) => ({
        from: member.position,
        to: slots[index],
        tone: 'muted' as const,
      })),
      { from: anchorLabel, to: state.formation.anchor, tone: 'desired' },
      { from: beaconLabel, to: { x: example.goalX, y: 0 }, tone: 'target' },
    ],
    vectors: state.members.map(({ position, velocity }) => ({
      ...position,
      dx: velocity.x * example.velocityArrowSeconds,
      dy: velocity.y * example.velocityArrowSeconds,
      tone: 'actual',
    })),
    values: frameValues(runValues, memberRelation, gapOwner, error, state, example),
    note: frameNote(t, state, step, example, slowing),
    worked: workedStep(t, state, step, example, calculation),
  };
}

function describeRun(
  t: StudyTranslate,
  example: GroupExample,
  states: ReturnType<typeof groupStates>,
) {
  const changed = { ...example, anchorSpeed: example.fastAnchorSpeed };
  const comparedSamples = groupSamples(changed);
  const compared = comparedSamples.map(({ state }) => state);
  const errors = states.map(maxSlotError);
  const comparedErrors = compared.map(maxSlotError);
  const peak = errors.indexOf(Math.max(...errors));
  const comparedPeak = comparedErrors.indexOf(Math.max(...comparedErrors));
  const arrivals = arrivalSteps(states, example);
  const allArrived = arrivals.every((step) => step !== null);
  const lastArrival = allArrived
    ? Math.max(...arrivals.filter((step): step is number => step !== null))
    : example.steps;
  const selectedArrival = arrivalSummary(t, states, example);
  const comparedArrival = arrivalSummary(t, compared, changed);
  const runValues = {
    runPeak: fixed(errors[peak]),
    shapeOutcome:
      errors[peak] <= example.slotErrorBudget
        ? t('studyAifg.group-movement.model.selectedPaceStaysWithin')
        : t('studyAifg.group-movement.model.selectedPaceExceedsSlot'),
    arrivalSpread: selectedArrival.spread,
    comparisonPace: fixed(changed.anchorSpeed),
  };
  return {
    runValues,
    changed,
    errors,
    comparedErrors,
    peak,
    allArrived,
    lastArrival,
    comparedPeak,
    compared,
    selectedArrival,
    comparedArrival,
  };
}

function comparisonTimeline(
  t: StudyTranslate,
  seconds: number[],
  example: GroupExample,
  reading: ReturnType<typeof describeRun>,
): NonNullable<MotionStudyModel['timeline']> {
  return {
    title: t('studyAifg.group-movement.model.largestMemberSlotGap'),
    xLabel: t('studyAifg.group-movement.model.timeSeconds'),
    yLabel: t('studyAifg.group-movement.model.distance'),
    seconds,
    reference: example.slotErrorBudget,
    yRange: [0, Math.max(example.slotErrorBudget, ...reading.errors, ...reading.comparedErrors)],
    series: [
      {
        id: 'selected',
        label: t('studyAifg.group-movement.model.comparisonSelectedAnchorPace'),
        tone: 'actual',
        values: reading.errors,
      },
      {
        id: 'compared',
        label: t('studyAifg.group-movement.model.comparisonComparisonAnchorPace'),
        tone: 'desired',
        values: reading.comparedErrors,
      },
    ],
    marks: [
      { x: seconds[reading.peak], y: reading.errors[reading.peak], tone: 'actual' },
      {
        x: seconds[reading.comparedPeak],
        y: reading.comparedErrors[reading.comparedPeak],
        tone: 'desired',
      },
    ],
  };
}

function compareRuns(
  t: StudyTranslate,
  samePace: boolean,
  example: GroupExample,
  reading: ReturnType<typeof describeRun>,
  seconds: number[],
): NonNullable<MotionStudyModel['comparison']> {
  return {
    title: samePace
      ? t('studyAifg.group-movement.model.comparisonRunsNowUseSame')
      : t('studyAifg.group-movement.model.comparisonFasterPlanCanStretch'),
    intro: t('studyAifg.group-movement.model.comparisonSelectedAnchorPaceComparison', {
      exampleAnchorSpeed: fixed(example.anchorSpeed),
      changedAnchorSpeed: fixed(reading.changed.anchorSpeed),
      exampleEnginePlanningSeconds: fixed(example.enginePlanningSeconds),
      exampleTimeStep: fixed(example.timeStep),
    }),
    timeline: comparisonTimeline(t, seconds, example, reading),
    findings: [
      t('studyAifg.group-movement.model.comparisonSelectedPeakGapComparison', {
        errors: fixed(reading.errors[reading.peak]),
        seconds: fixed(seconds[reading.peak]),
        comparedErrors: fixed(reading.comparedErrors[reading.comparedPeak]),
        seconds2: fixed(seconds[reading.comparedPeak]),
        exampleSlotErrorBudget: fixed(example.slotErrorBudget),
        value6: fixed(Math.max(...reading.compared.map(anchorLag))),
      }),
      t('studyAifg.group-movement.model.comparisonSelectedArrivalTimesSpread', {
        selectedArrivalTimes: reading.selectedArrival.times,
        selectedArrivalSpread: reading.selectedArrival.spread,
        comparedArrivalTimes: reading.comparedArrival.times,
        comparedArrivalSpread: reading.comparedArrival.spread,
        exampleArrivalDistance: fixed(example.arrivalDistance),
        exampleArrivalSpeed: fixed(example.arrivalSpeed),
      }),
    ],
    note: t('studyAifg.group-movement.model.comparisonReferenceChosenMemberSlot'),
  };
}

function runTimeline(
  t: StudyTranslate,
  seconds: number[],
  example: GroupExample,
  reading: ReturnType<typeof describeRun>,
  states: ReturnType<typeof groupStates>,
): NonNullable<MotionStudyModel['timeline']> {
  return {
    title: t('studyAifg.group-movement.model.boundMeanDifferentBound'),
    xLabel: t('studyAifg.group-movement.model.timeSeconds'),
    yLabel: t('studyAifg.group-movement.model.distance'),
    seconds,
    reference: example.slotErrorBudget,
    yRange: [0, Math.max(example.slotErrorBudget, ...reading.errors, ...reading.comparedErrors)],
    series: [
      {
        id: 'member-error',
        label: t('studyAifg.group-movement.model.largestMemberSlotGap'),
        tone: 'actual',
        values: reading.errors,
      },
      {
        id: 'anchor-lag',
        label: t('studyAifg.group-movement.model.anchorMeanDistance'),
        tone: 'desired',
        values: states.map(anchorLag),
      },
    ],
  };
}

function runMoments(
  t: StudyTranslate,
  reading: ReturnType<typeof describeRun>,
  states: ReturnType<typeof groupStates>,
  example: GroupExample,
): MotionStudyModel['moments'] {
  return [
    { label: t('studyAifg.group-movement.model.oldSlots'), step: 0 },
    { label: t('studyAifg.group-movement.model.anchorMovesFirst'), step: 1 },
    { label: t('studyAifg.group-movement.model.largestSlotGap'), step: reading.peak },
    {
      label: reading.allArrived
        ? t('studyAifg.group-movement.model.allPassArrivalTest')
        : t('studyAifg.group-movement.model.arrivalPending'),
      step: reading.lastArrival,
    },
    {
      label: states[example.steps].members.every((_member, index) =>
        isArrived(states[example.steps], index, example),
      )
        ? t('studyAifg.group-movement.model.nearSlow')
        : t('studyAifg.group-movement.model.runEnds'),
      step: example.steps,
    },
  ];
}

export const present = (
  example: GroupExample,
  statesSamples: ReturnType<typeof groupSamples>,
  t: StudyTranslate,
): MotionStudyModel => {
  const states = statesSamples.map(({ state }) => state);
  const reading = describeRun(t, example, states);
  const frames = states.map((state, step) =>
    frameOf(t, state, step, example, reading.runValues, statesSamples[step].calculation),
  );
  const seconds = frames.map(({ seconds }) => seconds);
  const positions = frames.flatMap((frame) => [
    ...frame.bodies,
    ...(frame.marks ?? []),
    ...(frame.vectors ?? []).map(({ x, y, dx, dy }) => ({ x: x + dx, y: y + dy })),
  ]);
  const samePace = example.anchorSpeed === reading.changed.anchorSpeed;
  return {
    family: 'motion',
    motion: {
      bounds: boundsOfPoints(positions, example.spacing),
      frames,
      trail: true,
    },
    timeline: runTimeline(t, seconds, example, reading, states),
    initialStep: reading.peak,
    moments: runMoments(t, reading, states, example),
    legend: [
      {
        tone: 'subject',
        label: t('studyAifg.group-movement.model.northSouthEscorts'),
      },
      {
        tone: 'actual',
        label: t('studyAifg.group-movement.model.medicArrowsActualVelocity'),
      },
      { tone: 'desired', label: t('studyAifg.group-movement.model.anchorMovingPlan') },
      {
        tone: 'target',
        label: t('studyAifg.group-movement.model.ringsAssignedSlotsBeacon'),
      },
      {
        tone: 'muted',
        label: t('studyAifg.group-movement.model.shortLinksMemberSlot'),
      },
    ],
    caption: t('studyAifg.group-movement.model.caption', {
      exampleVelocityArrowSeconds: fixed(example.velocityArrowSeconds),
    }),
    comparison: compareRuns(t, samePace, example, reading, seconds),
    inputs: [
      {
        name: 'anchorSpeed',
        label: t('studyAifg.group-movement.model.anchorPace'),
        unit: t('studyAifg.group-movement.model.planningStep'),
        min: 0.4,
        max: 1.5,
        step: 0.1,
      },
    ],
  };
};

function memberName(t: StudyTranslate, index: number): string {
  switch (index) {
    case 0:
      return t('studyAifg.group-movement.model.northEscortName');
    case 1:
      return t('studyAifg.group-movement.model.medicName');
    default:
      return t('studyAifg.group-movement.model.southEscortName');
  }
}

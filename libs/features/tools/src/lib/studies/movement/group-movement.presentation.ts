import {
  add,
  centroid,
  distance,
  length,
  slotPosition,
  type Vec2,
} from '@dotln-angular/scene-engine';

import { createNumberFormat } from '../number-format';
import type {
  MotionFrame,
  MotionMark,
  MotionStudyModel,
  StudyComparison,
  StudyMoment,
  StudyPoint,
  StudyValues,
  StudyWorkedStep,
  TimelineModel,
} from '../study-model';
import type { StudyTranslate } from '../study-translate';
import {
  anchorLag,
  arrivalSteps,
  type GroupExample,
  type GroupSample,
  groupSamples,
  type GroupState,
  maxSlotError,
  memberIds,
  slotErrors,
} from './group-movement.simulation';
import { boundsOfPoints, type PresentationMember } from './presentation';

function describeFrame(
  t: StudyTranslate,
  reading: GroupDescription,
  sample: GroupSample,
  step: number,
): GroupFrame {
  const { example } = reading;
  const { state, calculation } = sample;

  const slots = state.formation.assignment.map(({ slot }) => slotPosition(state.formation, slot));
  const errors = slotErrors(state);
  const error = Math.max(...errors);
  const lead = state.members[0].position.x - state.members[1].position.x;
  const memberRelation =
    Math.abs(lead) < 0.005
      ? t('studyAifg.group-movement.model.labels.medicNearlyLevelEscorts')
      : lead > 0
        ? t('studyAifg.group-movement.model.labels.medicTrailsEscorts', {
            lead: fixed(lead),
          })
        : t('studyAifg.group-movement.model.labels.medicAheadEscorts', {
            lead: fixed(-lead),
          });
  const gapOwner =
    error - Math.min(...errors) < 0.005
      ? t('studyAifg.group-movement.model.labels.allMembersEqualSlot')
      : errors[1] >= error - 1e-10
        ? t('studyAifg.group-movement.model.labels.medicLargestSlotGap')
        : t('studyAifg.group-movement.model.labels.escortsLargestSlotGap');
  const slowing =
    length(calculation.next.formation.anchorVelocity) <
    length(state.formation.anchorVelocity) - 1e-10;
  // Leader lines lift the anchor and beacon names away from the medic's lane, even at arrival.
  const anchorLabel = { x: state.formation.anchor.x, y: -2 * example.spacing };
  const beaconLabel = { x: example.goalX, y: 2 * example.spacing };

  return {
    ...sample,
    reading,
    step,
    slots,
    error,
    memberRelation,
    gapOwner,
    slowing,
    anchorLabel,
    beaconLabel,
    medic: describeWorkedStep(sample, example),
  };
}

interface ArrivalSummary {
  readonly times: string;
  readonly spread: string;
}
interface GroupDescription {
  readonly example: GroupExample;
  readonly states: readonly GroupState[];
  readonly seconds: readonly number[];
  readonly runValues: StudyValues;
  readonly changed: GroupExample;
  readonly errors: readonly number[];
  readonly comparedErrors: readonly number[];
  readonly peak: number;
  readonly allArrived: boolean;
  readonly lastArrival: number;
  readonly comparedPeak: number;
  readonly compared: readonly GroupState[];
  readonly selectedArrival: ArrivalSummary;
  readonly comparedArrival: ArrivalSummary;
}
interface MedicStep {
  readonly target: Vec2;
  readonly medic: PresentationMember;
  readonly gap: number;
  readonly stop: number;
  readonly desiredSpeed: number;
  readonly desiredX: number;
  readonly requested: number;
  readonly nextMedic: PresentationMember;
  readonly nextMean: Vec2;
}
interface GroupFrame extends GroupSample {
  readonly reading: GroupDescription;
  readonly step: number;
  readonly slots: readonly Vec2[];
  readonly error: number;
  readonly memberRelation: string;
  readonly gapOwner: string;
  readonly slowing: boolean;
  readonly anchorLabel: StudyPoint;
  readonly beaconLabel: StudyPoint;
  readonly medic: MedicStep;
}

const { number: fixed, vector: point } = createNumberFormat();

const arrivalSummary = (
  t: StudyTranslate,
  states: readonly GroupState[],
  example: GroupExample,
): ArrivalSummary => {
  const steps = arrivalSteps(states, example);
  const times = steps
    .map(
      (step, index) =>
        `${memberName(t, index)} ${step === null ? t('studyAifg.group-movement.model.labels.notYet') : t('studyAifg.group-movement.model.labels.arrivalSummaryS', { step: fixed(step * example.timeStep) })}`,
    )
    .join('; ');
  const reached = steps.filter((step): step is number => step !== null);
  return {
    times,
    spread:
      reached.length === memberIds.length
        ? t('studyAifg.group-movement.model.values.arrivalSummarySpreadS', {
            spread: fixed((Math.max(...reached) - Math.min(...reached)) * example.timeStep),
          })
        : t('studyAifg.group-movement.model.values.unknownAnyMemberNot'),
  };
};

function describeWorkedStep(sample: GroupSample, example: GroupExample): MedicStep {
  const { state, calculation } = sample;

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

function memberLines(t: StudyTranslate, frame: GroupFrame): readonly string[] {
  const { state, calculation } = frame;

  return state.members.map((member, index) =>
    t('studyAifg.group-movement.model.worked.positionVelocitySlot', {
      memberNames: memberName(t, index),
      memberPosition: point(member.position),
      memberVelocity: point(member.velocity),
      target: point(calculation.targets[index]),
    }),
  );
}

function workedLines(t: StudyTranslate, frame: GroupFrame): readonly string[] {
  const {
    reading: { example },
    state,
    calculation,
    step,
    medic: description,
  } = frame;

  return [
    ...memberLines(t, frame),
    t('studyAifg.group-movement.model.worked.oldAnchorMedicOffset', {
      formationAnchor: point(state.formation.anchor),
      offset: point(state.formation.slots[1]),
      target: point(description.target),
    }),
    t('studyAifg.group-movement.model.worked.distanceSlotStopDistance', {
      targetX: fixed(description.target.x),
      positionX: fixed(description.medic.position.x),
      gap: fixed(description.gap),
      exampleTargetRadius: fixed(example.targetRadius),
      stop: fixed(description.stop),
    }),
    description.gap <= description.stop
      ? t('studyAifg.group-movement.model.worked.insideStopDistanceDesired')
      : description.gap >= example.slowRadius
        ? t('studyAifg.group-movement.model.worked.outsideSlowingRadiusDesired', {
            exampleSlowRadius: fixed(example.slowRadius),
            medicMaxSpeed: fixed(description.medic.maxSpeed),
          })
        : t('studyAifg.group-movement.model.worked.insideSlowingRadius', {
            medicMaxSpeed: fixed(description.medic.maxSpeed),
            gap: fixed(description.gap),
            stop: fixed(description.stop),
            exampleSlowRadius: fixed(example.slowRadius),
            desiredSpeed: fixed(description.desiredSpeed),
          }),
    t('studyAifg.group-movement.model.worked.requestedXAccelerationEngine', {
      desiredX: fixed(description.desiredX),
      velocityX: fixed(description.medic.velocity.x),
      exampleResponseTime: fixed(example.responseTime),
      requested: fixed(description.requested),
      exampleMaxAcceleration: fixed(example.maxAcceleration),
      accelerationsX: fixed(calculation.accelerations[1].x),
    }),
    t('studyAifg.group-movement.model.worked.updateVelocityCappedX', {
      medicMaxSpeed: fixed(description.medic.maxSpeed),
      velocityX: fixed(description.medic.velocity.x),
      accelerationsX: fixed(calculation.accelerations[1].x),
      exampleTimeStep: fixed(example.timeStep),
      nextVelocityX: fixed(description.nextMedic.velocity.x),
      positionX: fixed(description.medic.position.x),
      nextPositionX: fixed(description.nextMedic.position.x),
    }),
    t('studyAifg.group-movement.model.worked.afterEveryFollowerMoves', {
      nextMean: point(description.nextMean),
      formationAnchor: point(calculation.next.formation.anchor),
      exampleLagLimit: fixed(example.lagLimit),
    }),
    ...(step === 0
      ? [
          t('studyAifg.group-movement.model.worked.initialAnchorCruiseRequest', {
            exampleAnchorSpeed: fixed(example.anchorSpeed),
            exampleEnginePlanningSeconds: fixed(example.enginePlanningSeconds),
            planningSpeed: fixed(example.anchorSpeed / example.enginePlanningSeconds),
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

function workedStep(t: StudyTranslate, frame: GroupFrame): StudyWorkedStep {
  const {
    reading: { example },
    step,
  } = frame;

  return {
    title: t('studyAifg.group-movement.model.worked.medicStep', {
      seconds: fixed(step * example.timeStep),
      nextSeconds: fixed((step + 1) * example.timeStep),
    }),
    lines: workedLines(t, frame),
    note:
      step === example.steps
        ? t('studyAifg.group-movement.model.worked.calculationPreviewsOneMore')
        : t('studyAifg.group-movement.model.worked.roundedValuesExplainCalculation'),
  };
}

const isArrived = (state: GroupState, index: number, example: GroupExample) =>
  distance(
    state.members[index].position,
    add({ x: example.goalX, y: 0 }, state.formation.slots[index]),
  ) <= example.arrivalDistance && length(state.members[index].velocity) <= example.arrivalSpeed;

function frameNote(t: StudyTranslate, frame: GroupFrame): string {
  const {
    reading: { example },
    state,
    step,
    slowing,
  } = frame;

  if (step === 0) return t('studyAifg.group-movement.model.phase.everyoneStartsOwnSlot');
  if (state.members.every(({ velocity }) => length(velocity) === 0))
    return t('studyAifg.group-movement.model.phase.anchorMovedAheadSquad');
  if (maxSlotError(state) > example.slotErrorBudget)
    return t('studyAifg.group-movement.model.phase.medicFallenTooFar');
  const arrived = state.members.map((_member, index) => isArrived(state, index, example));
  if (arrived.every(Boolean))
    return t('studyAifg.group-movement.model.phase.everyoneNearFinalSlot');
  if (arrived.some(Boolean))
    return t('studyAifg.group-movement.model.phase.someMembersPassArrival');
  if (slowing) return t('studyAifg.group-movement.model.phase.anchorSlowsNearBeacon');
  if (state.members[0].position.x - state.members[1].position.x > 0.005)
    return t('studyAifg.group-movement.model.phase.medicTrailsEscortsBecause');
  return t('studyAifg.group-movement.model.phase.squadStartsAcceleratingAfter');
}

function frameValues(frame: GroupFrame): StudyValues {
  const {
    reading: { example, runValues },
    state,
    error,
    memberRelation,
    gapOwner,
  } = frame;

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

function frameMarks(t: StudyTranslate, frame: GroupFrame): readonly MotionMark[] {
  const {
    reading: { example },
    state,
    slots,
    anchorLabel,
    beaconLabel,
  } = frame;

  return [
    ...slots.map((slot) => ({ ...slot, shape: 'ring' as const, tone: 'target' as const })),
    { ...state.formation.anchor, shape: 'dot', tone: 'desired' },
    { x: example.goalX, y: 0, shape: 'cross', tone: 'target' },
    {
      ...anchorLabel,
      shape: 'dot',
      tone: 'muted',
      label: t('studyAifg.group-movement.model.labels.anchor'),
    },
    {
      ...beaconLabel,
      shape: 'dot',
      tone: 'muted',
      label: t('studyAifg.group-movement.model.labels.beacon'),
    },
  ];
}

function frameOf(t: StudyTranslate, frame: GroupFrame): MotionFrame {
  const {
    reading: { example },
    state,
    step,
    slots,
    anchorLabel,
    beaconLabel,
  } = frame;
  return {
    seconds: step * example.timeStep,
    bodies: state.members.map((member, index) => ({
      id: member.id,
      label: [
        t('studyAifg.group-movement.model.labels.north'),
        t('studyAifg.group-movement.model.labels.medic'),
        t('studyAifg.group-movement.model.labels.south'),
      ][index],
      ...member.position,
      tone: member.id === 'medic' ? 'actual' : 'subject',
    })),
    marks: frameMarks(t, frame),
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
    values: frameValues(frame),
    note: frameNote(t, frame),
    worked: workedStep(t, frame),
  };
}

function describeRun(
  t: StudyTranslate,
  example: GroupExample,
  states: readonly GroupState[],
): GroupDescription {
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
        ? t('studyAifg.group-movement.model.values.selectedPaceStaysWithin')
        : t('studyAifg.group-movement.model.values.selectedPaceExceedsSlot'),
    arrivalSpread: selectedArrival.spread,
    comparisonPace: fixed(changed.anchorSpeed),
  };
  return {
    example,
    states,
    seconds: states.map((_state, step) => step * example.timeStep),
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

function comparisonTimeline(t: StudyTranslate, reading: GroupDescription): TimelineModel {
  const { example, seconds } = reading;

  return {
    title: t('studyAifg.group-movement.model.labels.largestMemberSlotGap'),
    xLabel: t('studyAifg.group-movement.model.labels.timeSeconds'),
    yLabel: t('studyAifg.group-movement.model.labels.distance'),
    seconds,
    reference: example.slotErrorBudget,
    yRange: [0, Math.max(example.slotErrorBudget, ...reading.errors, ...reading.comparedErrors)],
    series: [
      {
        id: 'selected',
        label: t('studyAifg.group-movement.model.comparison.selectedAnchorPace'),
        tone: 'actual',
        values: reading.errors,
      },
      {
        id: 'compared',
        label: t('studyAifg.group-movement.model.comparison.comparisonAnchorPace'),
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

function compareRuns(t: StudyTranslate, reading: GroupDescription): StudyComparison {
  const samePace = reading.example.anchorSpeed === reading.changed.anchorSpeed;

  const { example, seconds } = reading;

  return {
    title: samePace
      ? t('studyAifg.group-movement.model.comparison.runsNowUseSame')
      : t('studyAifg.group-movement.model.comparison.fasterPlanCanStretch'),
    intro: t('studyAifg.group-movement.model.comparison.selectedAnchorPaceComparison', {
      exampleAnchorSpeed: fixed(example.anchorSpeed),
      changedAnchorSpeed: fixed(reading.changed.anchorSpeed),
      exampleEnginePlanningSeconds: fixed(example.enginePlanningSeconds),
      exampleTimeStep: fixed(example.timeStep),
    }),
    timeline: comparisonTimeline(t, reading),
    findings: [
      t('studyAifg.group-movement.model.comparison.selectedPeakGapComparison', {
        errors: fixed(reading.errors[reading.peak]),
        seconds: fixed(seconds[reading.peak]),
        comparedErrors: fixed(reading.comparedErrors[reading.comparedPeak]),
        comparedPeakSeconds: fixed(seconds[reading.comparedPeak]),
        exampleSlotErrorBudget: fixed(example.slotErrorBudget),
        comparedAnchorLag: fixed(Math.max(...reading.compared.map(anchorLag))),
      }),
      t('studyAifg.group-movement.model.comparison.selectedArrivalTimesSpread', {
        selectedArrivalTimes: reading.selectedArrival.times,
        selectedArrivalSpread: reading.selectedArrival.spread,
        comparedArrivalTimes: reading.comparedArrival.times,
        comparedArrivalSpread: reading.comparedArrival.spread,
        exampleArrivalDistance: fixed(example.arrivalDistance),
        exampleArrivalSpeed: fixed(example.arrivalSpeed),
      }),
    ],
    note: t('studyAifg.group-movement.model.comparison.referenceChosenMemberSlot'),
  };
}

function runTimeline(t: StudyTranslate, reading: GroupDescription): TimelineModel {
  const { example, states, seconds } = reading;

  return {
    title: t('studyAifg.group-movement.model.timeline.boundMeanDifferentBound'),
    xLabel: t('studyAifg.group-movement.model.labels.timeSeconds'),
    yLabel: t('studyAifg.group-movement.model.labels.distance'),
    seconds,
    reference: example.slotErrorBudget,
    yRange: [0, Math.max(example.slotErrorBudget, ...reading.errors, ...reading.comparedErrors)],
    series: [
      {
        id: 'member-error',
        label: t('studyAifg.group-movement.model.labels.largestMemberSlotGap'),
        tone: 'actual',
        values: reading.errors,
      },
      {
        id: 'anchor-lag',
        label: t('studyAifg.group-movement.model.timeline.anchorMeanDistance'),
        tone: 'desired',
        values: states.map(anchorLag),
      },
    ],
  };
}

function runMoments(t: StudyTranslate, reading: GroupDescription): readonly StudyMoment[] {
  const { example, states } = reading;

  return [
    { label: t('studyAifg.group-movement.model.moments.oldSlots'), step: 0 },
    { label: t('studyAifg.group-movement.model.moments.anchorMovesFirst'), step: 1 },
    { label: t('studyAifg.group-movement.model.moments.largestSlotGap'), step: reading.peak },
    {
      label: reading.allArrived
        ? t('studyAifg.group-movement.model.moments.allPassArrivalTest')
        : t('studyAifg.group-movement.model.moments.arrivalPending'),
      step: reading.lastArrival,
    },
    {
      label: states[example.steps].members.every((_member, index) =>
        isArrived(states[example.steps], index, example),
      )
        ? t('studyAifg.group-movement.model.moments.nearSlow')
        : t('studyAifg.group-movement.model.moments.runEnds'),
      step: example.steps,
    },
  ];
}

export const present = (
  example: GroupExample,
  statesSamples: readonly GroupSample[],
  t: StudyTranslate,
): MotionStudyModel => {
  const states = statesSamples.map(({ state }) => state);
  const reading = describeRun(t, example, states);
  const frames = statesSamples.map((sample, step) =>
    frameOf(t, describeFrame(t, reading, sample, step)),
  );
  const positions = frames.flatMap((frame) => [
    ...frame.bodies,
    ...(frame.marks ?? []),
    ...(frame.vectors ?? []).map(({ x, y, dx, dy }) => ({ x: x + dx, y: y + dy })),
  ]);
  return {
    family: 'motion',
    motion: {
      bounds: boundsOfPoints(positions, example.spacing),
      frames,
      trail: true,
    },
    timeline: runTimeline(t, reading),
    initialStep: reading.peak,
    moments: runMoments(t, reading),
    legend: [
      {
        tone: 'subject',
        label: t('studyAifg.group-movement.model.labels.northSouthEscorts'),
      },
      {
        tone: 'actual',
        label: t('studyAifg.group-movement.model.labels.medicArrowsActualVelocity'),
      },
      { tone: 'desired', label: t('studyAifg.group-movement.model.labels.anchorMovingPlan') },
      {
        tone: 'target',
        label: t('studyAifg.group-movement.model.labels.ringsAssignedSlotsBeacon'),
      },
      {
        tone: 'muted',
        label: t('studyAifg.group-movement.model.labels.shortLinksMemberSlot'),
      },
    ],
    caption: t('studyAifg.group-movement.model.overview.caption', {
      exampleVelocityArrowSeconds: fixed(example.velocityArrowSeconds),
    }),
    comparison: compareRuns(t, reading),
    inputs: [
      {
        name: 'anchorSpeed',
        label: t('studyAifg.group-movement.model.labels.anchorPace'),
        unit: t('studyAifg.group-movement.model.labels.planningStep'),
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
      return t('studyAifg.group-movement.model.names.northEscortName');
    case 1:
      return t('studyAifg.group-movement.model.names.medicName');
    default:
      return t('studyAifg.group-movement.model.names.southEscortName');
  }
}

import type { SlotAssignment } from '@dotln-angular/scene-engine';

import { createNumberFormat } from '../number-format';
import type {
  MotionFrame,
  MotionStudyModel,
  StudyComparison,
  StudyPoint,
  StudyWorkedStep,
  TimelineModel,
} from '../study-model';
import type { StudyTranslate } from '../study-translate';
import {
  acceptableCounts,
  allocate,
  assignmentCost,
  candidates,
  cheapestComplete,
  roles,
  slotCost,
  type SlotExample,
} from './slot-assignment.simulation';

const { number: fixed } = createNumberFormat();

interface AllocationDescription {
  readonly example: SlotExample;
  readonly assignment: readonly SlotAssignment[];
  readonly selectedOptimum: readonly SlotAssignment[];
  readonly changed: SlotExample;
  readonly changedAssignment: readonly SlotAssignment[];
  readonly changedOptimum: readonly SlotAssignment[];
  readonly seconds: readonly number[];
  readonly sameCost: boolean;
  readonly selectedCosts: readonly number[];
  readonly comparedCosts: readonly number[];
}
interface AllocationFrame {
  readonly run: AllocationDescription;
  readonly stage: number;
  readonly committed: readonly SlotAssignment[];
  readonly total: number;
  readonly costTable: string;
  readonly counts: string;
  readonly order: string;
  readonly choices: string;
  readonly reservations: string;
  readonly excess: number;
  readonly decision: SlotAssignment | null;
  readonly optimum: readonly SlotAssignment[];
  readonly prior: number;
}
function describeRun(
  example: SlotExample,
  assignment: readonly SlotAssignment[],
): AllocationDescription {
  const changed: SlotExample = {
    ...example,
    costs: { ...example.costs, 'cost.reserve.flank': example.comparisonFlankCost },
  };
  const changedAssignment = allocate(changed);
  const seconds = Array.from(
    { length: assignment.length + 1 },
    (_value, stage) => stage * example.decisionSeconds,
  );
  return {
    example,
    assignment,
    changed,
    changedAssignment,
    seconds,
    selectedOptimum: cheapestComplete(example),
    changedOptimum: cheapestComplete(changed),
    sameCost: slotCost(example.costs, 'reserve', 'flank') === example.comparisonFlankCost,
    selectedCosts: seconds.map((_seconds, stage) => assignmentCost(assignment.slice(0, stage))),
    comparedCosts: seconds.map((_seconds, stage) =>
      assignmentCost(changedAssignment.slice(0, stage)),
    ),
  };
}

const unitPoint = (example: SlotExample, index: number): StudyPoint => ({
  x: example.unitX,
  y: (index - 1) * example.spacing,
});

const slotPoint = (example: SlotExample, slot: number): StudyPoint => ({
  x: example.slotX,
  y: (slot - 1) * example.spacing,
});

const describeAssignment = (t: StudyTranslate, assignment: readonly SlotAssignment[]) =>
  assignment.length === 0
    ? t('studyAifg.slot-assignment.model.values.noLinksYet')
    : assignment
        .map(
          ({ unitId, slotRole, cost }) =>
            `${guardName(t, unitId)} → ${roleName(t, slotRole)} (${fixed(cost)})`,
        )
        .join('; ');

function allocationNote(t: StudyTranslate, description: AllocationFrame): string {
  const {
    run: { assignment },
    stage,
    excess,
  } = description;

  if (stage === 0)
    return t('studyAifg.slot-assignment.model.phase.fewestSuitablePostsGuard', {
      assignmentUnitId: guardName(t, assignment[0].unitId),
    });
  const chosen = assignment[stage - 1];
  if (stage === assignment.length)
    return excess > 1e-10
      ? t('studyAifg.slot-assignment.model.phase.everyonePostEarlierReservations')
      : t('studyAifg.slot-assignment.model.phase.everyoneDistinctPostRoster');
  if (stage === assignment.length - 1)
    return t('studyAifg.slot-assignment.model.phase.reservesCheapestFreePost', {
      chosenUnitId: guardName(t, chosen.unitId),
      chosenSlotRole: roleName(t, chosen.slotRole),
      assignmentStageUnitId: guardName(t, assignment[stage].unitId),
    });
  return t('studyAifg.slot-assignment.model.phase.reservationChangesRemainingChoices', {
    chosenUnitId: guardName(t, chosen.unitId),
    chosenSlotRole: roleName(t, chosen.slotRole),
  });
}

function describeFrame(
  t: StudyTranslate,
  run: AllocationDescription,
  stage: number,
): AllocationFrame {
  const { example, assignment, selectedOptimum: optimum } = run;

  const committed = assignment.slice(0, stage);
  const decision = stage === 0 ? null : assignment[stage - 1];
  const previously = new Set(assignment.slice(0, Math.max(0, stage - 1)).map(({ slot }) => slot));
  const unit = decision ? candidates.find(({ id }) => id === decision.unitId) : undefined;
  const choices = unit
    ? roles
        .flatMap((role, slot) =>
          previously.has(slot)
            ? []
            : [`${roleName(t, role)}: ${fixed(slotCost(example.costs, unit.unitClass, role))}`],
        )
        .join('; ')
    : t('studyAifg.slot-assignment.model.labels.allSlotsFree');
  const costTable = candidates
    .map(
      ({ id, unitClass }) =>
        `${guardName(t, id)}: ${roles.map((role) => fixed(slotCost(example.costs, unitClass, role))).join(' | ')}`,
    )
    .join('; ');
  const counts = acceptableCounts(example)
    .map(({ id, count }) => `${guardName(t, id)} ${count}`)
    .join(', ');
  const order = assignment.map(({ unitId }) => guardName(t, unitId)).join(' → ');
  const total = assignmentCost(committed);
  const prior = assignmentCost(assignment.slice(0, Math.max(0, stage - 1)));
  const excess = Math.max(0, assignmentCost(assignment) - assignmentCost(optimum));
  const reservations =
    committed.length === 0
      ? t('studyAifg.slot-assignment.model.labels.noGuardLinkedPost')
      : t('studyAifg.slot-assignment.model.labels.linksReserve', {
          reservations: committed
            .map(({ unitId, slotRole }) =>
              t('studyAifg.slot-assignment.model.labels.frameOfForThe', {
                unitId: guardName(t, unitId),
                slotRole: roleName(t, slotRole),
              }),
            )
            .join(', '),
        });
  return {
    run,
    stage,
    committed,
    total,
    costTable,
    counts,
    order,
    choices,
    reservations,
    excess,
    decision,
    optimum,
    prior,
  };
}

function frameWorked(t: StudyTranslate, description: AllocationFrame): StudyWorkedStep {
  const {
    run: { example, assignment },
    stage,
  } = description;

  return {
    title:
      stage === 0
        ? t('studyAifg.slot-assignment.model.worked.beaconGateCostTable')
        : t('studyAifg.slot-assignment.model.worked.decision', {
            stage,
            decisionUnitId: guardName(t, String(description.decision?.unitId)),
          }),
    lines: [
      t('studyAifg.slot-assignment.model.worked.columnsFrontFlankRear'),
      ...candidates.map(
        ({ id, unitClass }) =>
          `${guardName(t, id)}: ${roles.map((role) => fixed(slotCost(example.costs, unitClass, role))).join(' | ')}`,
      ),
      t('studyAifg.slot-assignment.model.worked.countCostsOriginalTable', {
        exampleAcceptableBelow: fixed(example.acceptableBelow),
        counts: description.counts,
        order: description.order,
      }),
      ...(description.decision
        ? [
            t('studyAifg.slot-assignment.model.worked.freeCostsChooseTies', {
              decisionUnitId: guardName(t, description.decision.unitId),
              choices: description.choices,
              decisionSlotRole: roleName(t, description.decision.slotRole),
            }),
            t('studyAifg.slot-assignment.model.worked.runningCost', {
              prior: fixed(description.prior),
              decisionCost: fixed(description.decision.cost),
              total: fixed(description.total),
            }),
          ]
        : [t('studyAifg.slot-assignment.model.worked.noSlotBeenReserved')]),
      ...(stage === assignment.length
        ? [
            t('studyAifg.slot-assignment.model.worked.greedyTotal', {
              costs: description.committed.map(({ cost }) => fixed(cost)).join(' + '),
              total: fixed(description.total),
            }),
            t('studyAifg.slot-assignment.model.worked.checkingEveryCompleteAssignment', {
              optimalAssignment: describeAssignment(t, description.optimum),
              optimalCost: fixed(assignmentCost(description.optimum)),
              excess: fixed(description.excess),
            }),
          ]
        : []),
    ],
    note: t('studyAifg.slot-assignment.model.worked.eachIntervalRevealsDecision', {
      exampleDecisionSeconds: fixed(example.decisionSeconds),
    }),
  };
}

function frameOf(t: StudyTranslate, description: AllocationFrame): MotionFrame {
  const {
    run: { example },
    stage,
  } = description;

  return {
    seconds: stage * example.decisionSeconds,
    bodies: candidates.map(({ id }, index) => ({
      id,
      label: guardName(t, id),
      ...unitPoint(example, index),
    })),
    marks: roles.map((role, slot) => ({
      ...slotPoint(example, slot),
      shape: 'ring',
      label: roleLabel(t, role),
    })),
    links: description.committed.map(({ unitId, slot }) => ({
      from: unitPoint(
        example,
        candidates.findIndex(({ id }) => id === unitId),
      ),
      to: slotPoint(example, slot),
      tone: 'actual',
    })),
    values: {
      stage: String(stage),
      total: fixed(description.total),
      acceptableBelow: fixed(example.acceptableBelow),
      costTable: description.costTable,
      counts: description.counts,
      order: description.order,
      choices: description.choices,
      reservations: description.reservations,
      flankCost: fixed(slotCost(example.costs, 'reserve', 'flank')),
      rosterOutcome:
        description.excess > 1e-10
          ? t('studyAifg.slot-assignment.model.values.greedyRosterCostsMore', {
              excess: fixed(description.excess),
            })
          : t('studyAifg.slot-assignment.model.values.greedyRosterMatchesMinimum'),
      decision: description.decision
        ? t('studyAifg.slot-assignment.model.values.takes', {
            decisionUnitId: guardName(t, description.decision.unitId),
            decisionSlotRole: roleName(t, description.decision.slotRole),
            decisionCost: fixed(description.decision.cost),
          })
        : t('studyAifg.slot-assignment.model.values.noChoiceBeenCommitted'),
      assignments: describeAssignment(t, description.committed),
      optimum: fixed(assignmentCost(description.optimum)),
    },
    note: allocationNote(t, description),
    worked: frameWorked(t, description),
  };
}

function compareRuns(t: StudyTranslate, run: AllocationDescription): StudyComparison {
  const {
    sameCost,
    example,
    changed,
    changedAssignment,
    seconds,
    assignment,
    changedOptimum,
    selectedOptimum,
    selectedCosts,
    comparedCosts,
  } = run;

  return {
    title: sameCost
      ? t('studyAifg.slot-assignment.model.comparison.runsNowUseSame')
      : t('studyAifg.slot-assignment.model.comparison.localChoiceCanLeave'),
    intro: t('studyAifg.slot-assignment.model.comparison.selectedAriFlankCost', {
      flankCost: fixed(slotCost(example.costs, 'reserve', 'flank')),
      exampleComparisonFlankCost: fixed(example.comparisonFlankCost),
      acceptableCounts: acceptableCounts(changed)
        .map(({ id, count }) => `${guardName(t, id)} ${count}`)
        .join(', '),
      guardOrder: changedAssignment.map(({ unitId }) => guardName(t, unitId)).join(' → '),
    }),
    timeline: {
      title: t('studyAifg.slot-assignment.model.comparison.accumulatedCostTwoAllocations'),
      xLabel: t('studyAifg.slot-assignment.model.labels.presentationTimeSeconds'),
      yLabel: t('studyAifg.slot-assignment.model.labels.accumulatedRoleCost'),
      seconds,
      xTicks: seconds,
      yRange: [
        0,
        Math.max(
          assignmentCost(assignment),
          assignmentCost(changedAssignment),
          assignmentCost(changedOptimum),
          example.acceptableBelow,
        ),
      ],
      series: [
        {
          id: 'selected',
          label: t('studyAifg.slot-assignment.model.labels.selectedCostTable'),
          tone: 'actual',
          values: selectedCosts,
        },
        {
          id: 'compared',
          label: t('studyAifg.slot-assignment.model.comparison.comparisonFlankCost'),
          tone: 'desired',
          values: comparedCosts,
        },
      ],
      reference: assignmentCost(changedOptimum),
    },
    findings: [
      t('studyAifg.slot-assignment.model.comparison.selectedRosterTotalMinimum', {
        assignment: describeAssignment(t, assignment),
        totalCost: fixed(assignmentCost(assignment)),
        optimalCost: fixed(assignmentCost(selectedOptimum)),
      }),
      t('studyAifg.slot-assignment.model.comparison.comparisonRosterTotalChecking', {
        assignment: describeAssignment(t, changedAssignment),
        totalCost: fixed(assignmentCost(changedAssignment)),
        optimalAssignment: describeAssignment(t, changedOptimum),
        optimalCost: fixed(assignmentCost(changedOptimum)),
        excessCost: fixed(
          Math.max(0, assignmentCost(changedAssignment) - assignmentCost(changedOptimum)),
        ),
      }),
    ],
    note: t('studyAifg.slot-assignment.model.comparison.referenceMinimumCompleteCost'),
  };
}

function runTimeline(t: StudyTranslate, run: AllocationDescription): TimelineModel {
  const { example, changedAssignment, seconds, assignment, selectedCosts } = run;

  return {
    title: t('studyAifg.slot-assignment.model.timeline.costCommittedEachDecision'),
    xLabel: t('studyAifg.slot-assignment.model.labels.presentationTimeSeconds'),
    yLabel: t('studyAifg.slot-assignment.model.labels.accumulatedRoleCost'),
    seconds,
    yRange: [
      0,
      Math.max(
        assignmentCost(assignment),
        assignmentCost(changedAssignment),
        example.acceptableBelow,
      ),
    ],
    xTicks: seconds,
    series: [
      {
        id: 'greedy',
        label: t('studyAifg.slot-assignment.model.labels.selectedCostTable'),
        tone: 'actual',
        values: selectedCosts,
      },
    ],
  };
}

export const present = (
  example: SlotExample,
  assignment: readonly SlotAssignment[],
  t: StudyTranslate,
): MotionStudyModel => {
  const run = describeRun(example, assignment);
  const frames = run.seconds.map((_second, stage) => frameOf(t, describeFrame(t, run, stage)));
  const margin = example.spacing;
  return {
    family: 'motion',
    motion: {
      bounds: {
        minX: Math.min(example.unitX, example.slotX) - margin,
        maxX: Math.max(example.unitX, example.slotX) + margin,
        minY: -example.spacing - margin,
        maxY: example.spacing + margin,
      },
      frames,
      trail: false,
    },
    timeline: runTimeline(t, run),
    initialStep: 2,
    moments: [
      { label: t('studyAifg.slot-assignment.model.labels.readTable'), step: 0 },
      ...assignment.map(({ unitId }, index) => ({
        label: t('studyAifg.slot-assignment.model.labels.chooses', {
          unitId: guardName(t, unitId),
        }),
        step: index + 1,
      })),
    ],
    legend: [
      {
        tone: 'subject',
        label: t('studyAifg.slot-assignment.model.labels.namedDotsGuardsWaiting'),
      },
      {
        tone: 'target',
        label: t('studyAifg.slot-assignment.model.labels.namedRingsRolePosts'),
      },
      {
        tone: 'actual',
        label: t('studyAifg.slot-assignment.model.labels.linksCommittedReservations'),
      },
    ],
    caption: t('studyAifg.slot-assignment.model.overview.caption'),
    comparison: compareRuns(t, run),
    inputs: [
      {
        name: 'cost.reserve.flank',
        label: t('studyAifg.slot-assignment.model.labels.ariFlankCost'),
        unit: t('studyAifg.slot-assignment.model.labels.cost'),
        min: 0.1,
        max: 1.2,
        step: 0.1,
      },
    ],
  };
};

function guardName(t: StudyTranslate, value: string): string {
  switch (value) {
    case 'Ari':
      return t('studyAifg.slot-assignment.model.names.guardNameAri');
    case 'Bryn':
      return t('studyAifg.slot-assignment.model.names.guardNameBryn');
    case 'Cleo':
      return t('studyAifg.slot-assignment.model.names.guardNameCleo');
    default:
      return value;
  }
}

function roleName(t: StudyTranslate, value: string): string {
  switch (value) {
    case 'front':
      return t('studyAifg.slot-assignment.model.names.roleNamefront');
    case 'flank':
      return t('studyAifg.slot-assignment.model.names.roleNameflank');
    case 'rear':
      return t('studyAifg.slot-assignment.model.names.roleNamerear');
    default:
      return value;
  }
}

function roleLabel(t: StudyTranslate, value: string): string {
  switch (value) {
    case 'front':
      return t('studyAifg.slot-assignment.model.names.roleLabelfront');
    case 'flank':
      return t('studyAifg.slot-assignment.model.names.roleLabelflank');
    case 'rear':
      return t('studyAifg.slot-assignment.model.names.roleLabelrear');
    default:
      return value;
  }
}

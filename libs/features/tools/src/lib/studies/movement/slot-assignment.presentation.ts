import type { SlotAssignment } from '@dotln-angular/scene-engine';

import type { MotionFrame, MotionStudyModel, StudyPoint, StudyWorkedStep } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { decimal as fixed } from './presentation';
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
    ? t('studyAifg.slot-assignment.model.noLinksYet')
    : assignment
        .map(
          ({ unitId, slotRole, cost }) =>
            `${guardName(t, unitId)} → ${roleName(t, slotRole)} (${fixed(cost)})`,
        )
        .join('; ');

function allocationNote(
  t: StudyTranslate,
  assignment: readonly SlotAssignment[],
  stage: number,
  excess: number,
) {
  if (stage === 0)
    return t('studyAifg.slot-assignment.model.fewestSuitablePostsGuard', {
      assignmentUnitId: guardName(t, assignment[0].unitId),
    });
  const chosen = assignment[stage - 1];
  if (stage === assignment.length)
    return excess > 1e-10
      ? t('studyAifg.slot-assignment.model.everyonePostEarlierReservations')
      : t('studyAifg.slot-assignment.model.everyoneDistinctPostRoster');
  if (stage === assignment.length - 1)
    return t('studyAifg.slot-assignment.model.reservesCheapestFreePost', {
      chosenUnitId: guardName(t, chosen.unitId),
      chosenSlotRole: roleName(t, chosen.slotRole),
      assignmentStageUnitId: guardName(t, assignment[stage].unitId),
    });
  return t('studyAifg.slot-assignment.model.reservationChangesRemainingChoices', {
    chosenUnitId: guardName(t, chosen.unitId),
    chosenSlotRole: roleName(t, chosen.slotRole),
  });
}

function describeFrame(
  t: StudyTranslate,
  example: SlotExample,
  assignment: readonly SlotAssignment[],
  stage: number,
  optimum: readonly SlotAssignment[],
) {
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
    : t('studyAifg.slot-assignment.model.allSlotsFree');
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
      ? t('studyAifg.slot-assignment.model.noGuardLinkedPost')
      : t('studyAifg.slot-assignment.model.linksReserve', {
          value1: committed
            .map(({ unitId, slotRole }) =>
              t('studyAifg.slot-assignment.model.frameOfForThe', {
                unitId: guardName(t, unitId),
                slotRole: roleName(t, slotRole),
              }),
            )
            .join(', '),
        });
  return {
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

function frameWorked(
  t: StudyTranslate,
  stage: number,
  description: ReturnType<typeof describeFrame>,
  example: SlotExample,
  assignment: readonly SlotAssignment[],
): StudyWorkedStep {
  return {
    title:
      stage === 0
        ? t('studyAifg.slot-assignment.model.workedBeaconGateCostTable')
        : t('studyAifg.slot-assignment.model.workedDecision', {
            stage,
            decisionUnitId: guardName(t, String(description.decision?.unitId)),
          }),
    lines: [
      t('studyAifg.slot-assignment.model.workedColumnsFrontFlankRear'),
      ...candidates.map(
        ({ id, unitClass }) =>
          `${guardName(t, id)}: ${roles.map((role) => fixed(slotCost(example.costs, unitClass, role))).join(' | ')}`,
      ),
      t('studyAifg.slot-assignment.model.workedCountCostsOriginalTable', {
        exampleAcceptableBelow: fixed(example.acceptableBelow),
        counts: description.counts,
        order: description.order,
      }),
      ...(description.decision
        ? [
            t('studyAifg.slot-assignment.model.workedFreeCostsChooseTies', {
              decisionUnitId: guardName(t, description.decision.unitId),
              choices: description.choices,
              decisionSlotRole: roleName(t, description.decision.slotRole),
            }),
            t('studyAifg.slot-assignment.model.workedRunningCost', {
              prior: fixed(description.prior),
              decisionCost: fixed(description.decision.cost),
              total: fixed(description.total),
            }),
          ]
        : [t('studyAifg.slot-assignment.model.workedNoSlotBeenReserved')]),
      ...(stage === assignment.length
        ? [
            t('studyAifg.slot-assignment.model.workedGreedyTotal', {
              value1: description.committed.map(({ cost }) => fixed(cost)).join(' + '),
              total: fixed(description.total),
            }),
            t('studyAifg.slot-assignment.model.workedCheckingEveryCompleteAssignment', {
              value1: describeAssignment(t, description.optimum),
              value2: fixed(assignmentCost(description.optimum)),
              excess: fixed(description.excess),
            }),
          ]
        : []),
    ],
    note: t('studyAifg.slot-assignment.model.workedEachIntervalRevealsDecision', {
      exampleDecisionSeconds: fixed(example.decisionSeconds),
    }),
  };
}

function frameOf(
  t: StudyTranslate,
  example: SlotExample,
  assignment: readonly SlotAssignment[],
  stage: number,
  optimum: readonly SlotAssignment[],
): MotionFrame {
  const description = describeFrame(t, example, assignment, stage, optimum);
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
          ? t('studyAifg.slot-assignment.model.valueGreedyRosterCostsMore', {
              excess: fixed(description.excess),
            })
          : t('studyAifg.slot-assignment.model.valueGreedyRosterMatchesMinimum'),
      decision: description.decision
        ? t('studyAifg.slot-assignment.model.valueTakes', {
            decisionUnitId: guardName(t, description.decision.unitId),
            decisionSlotRole: roleName(t, description.decision.slotRole),
            decisionCost: fixed(description.decision.cost),
          })
        : t('studyAifg.slot-assignment.model.valueNoChoiceBeenCommitted'),
      assignments: describeAssignment(t, description.committed),
      optimum: fixed(assignmentCost(description.optimum)),
    },
    note: allocationNote(t, assignment, stage, description.excess),
    worked: frameWorked(t, stage, description, example, assignment),
  };
}

function compareRuns(
  t: StudyTranslate,
  sameCost: boolean,
  example: SlotExample,
  changed: SlotExample,
  changedAssignment: ReturnType<typeof allocate>,
  seconds: number[],
  assignment: ReturnType<typeof allocate>,
  changedOptimum: ReturnType<typeof cheapestComplete>,
  cumulative: (entries: readonly SlotAssignment[]) => number[],
  selectedOptimum: ReturnType<typeof cheapestComplete>,
): NonNullable<MotionStudyModel['comparison']> {
  return {
    title: sameCost
      ? t('studyAifg.slot-assignment.model.comparisonRunsNowUseSame')
      : t('studyAifg.slot-assignment.model.comparisonLocalChoiceCanLeave'),
    intro: t('studyAifg.slot-assignment.model.comparisonSelectedAriFlankCost', {
      value1: fixed(slotCost(example.costs, 'reserve', 'flank')),
      exampleComparisonFlankCost: fixed(example.comparisonFlankCost),
      value3: acceptableCounts(changed)
        .map(({ id, count }) => `${guardName(t, id)} ${count}`)
        .join(', '),
      value4: changedAssignment.map(({ unitId }) => guardName(t, unitId)).join(' → '),
    }),
    timeline: {
      title: t('studyAifg.slot-assignment.model.comparisonAccumulatedCostTwoAllocations'),
      xLabel: t('studyAifg.slot-assignment.model.presentationTimeSeconds'),
      yLabel: t('studyAifg.slot-assignment.model.accumulatedRoleCost'),
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
          label: t('studyAifg.slot-assignment.model.selectedCostTable'),
          tone: 'actual',
          values: cumulative(assignment),
        },
        {
          id: 'compared',
          label: t('studyAifg.slot-assignment.model.comparisonComparisonFlankCost'),
          tone: 'desired',
          values: cumulative(changedAssignment),
        },
      ],
      reference: assignmentCost(changedOptimum),
    },
    findings: [
      t('studyAifg.slot-assignment.model.comparisonSelectedRosterTotalMinimum', {
        value1: describeAssignment(t, assignment),
        value2: fixed(assignmentCost(assignment)),
        value3: fixed(assignmentCost(selectedOptimum)),
      }),
      t('studyAifg.slot-assignment.model.comparisonComparisonRosterTotalChecking', {
        value1: describeAssignment(t, changedAssignment),
        value2: fixed(assignmentCost(changedAssignment)),
        value3: describeAssignment(t, changedOptimum),
        value4: fixed(assignmentCost(changedOptimum)),
        value5: fixed(
          Math.max(0, assignmentCost(changedAssignment) - assignmentCost(changedOptimum)),
        ),
      }),
    ],
    note: t('studyAifg.slot-assignment.model.comparisonReferenceMinimumCompleteCost'),
  };
}

function runTimeline(
  t: StudyTranslate,
  seconds: number[],
  assignment: ReturnType<typeof allocate>,
  changedAssignment: ReturnType<typeof allocate>,
  example: SlotExample,
  cumulative: (entries: readonly SlotAssignment[]) => number[],
): NonNullable<MotionStudyModel['timeline']> {
  return {
    title: t('studyAifg.slot-assignment.model.costCommittedEachDecision'),
    xLabel: t('studyAifg.slot-assignment.model.presentationTimeSeconds'),
    yLabel: t('studyAifg.slot-assignment.model.accumulatedRoleCost'),
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
        label: t('studyAifg.slot-assignment.model.selectedCostTable'),
        tone: 'actual',
        values: cumulative(assignment),
      },
    ],
  };
}

export const present = (
  example: SlotExample,
  assignment: ReturnType<typeof allocate>,
  t: StudyTranslate,
): MotionStudyModel => {
  const selectedOptimum = cheapestComplete(example);
  const frames = Array.from({ length: assignment.length + 1 }, (_unused, stage) =>
    frameOf(t, example, assignment, stage, selectedOptimum),
  );
  const changed: SlotExample = {
    ...example,
    costs: { ...example.costs, 'cost.reserve.flank': example.comparisonFlankCost },
  };
  const changedAssignment = allocate(changed);
  const changedOptimum = cheapestComplete(changed);
  const cumulative = (entries: readonly SlotAssignment[]) =>
    frames.map((_frame, stage) => assignmentCost(entries.slice(0, stage)));
  const seconds = frames.map(({ seconds }) => seconds);
  const margin = example.spacing;
  const sameCost = slotCost(example.costs, 'reserve', 'flank') === example.comparisonFlankCost;
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
    timeline: runTimeline(t, seconds, assignment, changedAssignment, example, cumulative),
    initialStep: 2,
    moments: [
      { label: t('studyAifg.slot-assignment.model.readTable'), step: 0 },
      ...assignment.map(({ unitId }, index) => ({
        label: t('studyAifg.slot-assignment.model.chooses', { unitId: guardName(t, unitId) }),
        step: index + 1,
      })),
    ],
    legend: [
      {
        tone: 'subject',
        label: t('studyAifg.slot-assignment.model.namedDotsGuardsWaiting'),
      },
      {
        tone: 'target',
        label: t('studyAifg.slot-assignment.model.namedRingsRolePosts'),
      },
      {
        tone: 'actual',
        label: t('studyAifg.slot-assignment.model.linksCommittedReservations'),
      },
    ],
    caption: t('studyAifg.slot-assignment.model.caption'),
    comparison: compareRuns(
      t,
      sameCost,
      example,
      changed,
      changedAssignment,
      seconds,
      assignment,
      changedOptimum,
      cumulative,
      selectedOptimum,
    ),
    inputs: [
      {
        name: 'cost.reserve.flank',
        label: t('studyAifg.slot-assignment.model.ariFlankCost'),
        unit: t('studyAifg.slot-assignment.model.cost'),
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
      return t('studyAifg.slot-assignment.model.guardNameAri');
    case 'Bryn':
      return t('studyAifg.slot-assignment.model.guardNameBryn');
    case 'Cleo':
      return t('studyAifg.slot-assignment.model.guardNameCleo');
    default:
      return value;
  }
}

function roleName(t: StudyTranslate, value: string): string {
  switch (value) {
    case 'front':
      return t('studyAifg.slot-assignment.model.roleNamefront');
    case 'flank':
      return t('studyAifg.slot-assignment.model.roleNameflank');
    case 'rear':
      return t('studyAifg.slot-assignment.model.roleNamerear');
    default:
      return value;
  }
}

function roleLabel(t: StudyTranslate, value: string): string {
  switch (value) {
    case 'front':
      return t('studyAifg.slot-assignment.model.roleLabelfront');
    case 'flank':
      return t('studyAifg.slot-assignment.model.roleLabelflank');
    case 'rear':
      return t('studyAifg.slot-assignment.model.roleLabelrear');
    default:
      return value;
  }
}

import type { StudyParameters } from '@dotln-angular/models';
import {
  assignSlots,
  type SlotAssignment,
  type SlotCandidate,
  type SlotCosts,
} from '@dotln-angular/scene-engine';

import { numberParameter } from '../parameters';
import type { MotionFrame, MotionStudyModel, StudyPoint } from '../study-model';

const candidates: readonly SlotCandidate[] = [
  { id: 'Ari', unitClass: 'reserve' },
  { id: 'Bryn', unitClass: 'shield' },
  { id: 'Cleo', unitClass: 'medic' },
];
const roles = ['front', 'flank', 'rear'] as const;
const fixed = (value: number) => value.toFixed(2);

export interface SlotExample {
  readonly costs: SlotCosts;
  readonly comparisonFlankCost: number;
  readonly acceptableBelow: number;
  readonly unitX: number;
  readonly slotX: number;
  readonly spacing: number;
  readonly decisionSeconds: number;
}

export function readSlotExample(parameters: StudyParameters): SlotExample {
  const costs = Object.fromEntries(
    candidates.flatMap(({ unitClass }) =>
      roles.map((role) => {
        const key = `cost.${unitClass}.${role}`;
        const cost = numberParameter(parameters, key);
        if (!Number.isFinite(cost) || cost < 0)
          throw new Error(`${key} must be finite and non-negative.`);
        return [key, cost];
      }),
    ),
  );
  const acceptableBelow = numberParameter(parameters, 'acceptableBelow');
  if (acceptableBelow !== 1) throw new Error('The engine counts costs strictly below one.');
  const example = {
    costs,
    acceptableBelow,
    comparisonFlankCost: numberParameter(parameters, 'comparisonFlankCost'),
    unitX: numberParameter(parameters, 'unitX'),
    slotX: numberParameter(parameters, 'slotX'),
    spacing: numberParameter(parameters, 'spacing'),
    decisionSeconds: numberParameter(parameters, 'decisionSeconds'),
  };
  if (
    !Object.values(example).every((value) => typeof value !== 'number' || Number.isFinite(value)) ||
    example.comparisonFlankCost < 0 ||
    example.spacing <= 0 ||
    example.decisionSeconds <= 0
  )
    throw new Error(
      'The layout and decision interval must be finite, with positive spacing and time.',
    );
  return example;
}

export const slotCost = (costs: SlotCosts, unitClass: string, role: string): number =>
  costs[`cost.${unitClass}.${role}`];

export const acceptableCounts = (example: SlotExample) =>
  candidates.map((unit) => ({
    id: unit.id,
    count: roles.filter(
      (role) => slotCost(example.costs, unit.unitClass, role) < example.acceptableBelow,
    ).length,
  }));

export const allocate = (example: SlotExample): readonly SlotAssignment[] =>
  assignSlots(candidates, roles, example.costs);

export const assignmentCost = (assignment: readonly SlotAssignment[]) =>
  assignment.reduce((total, entry) => total + entry.cost, 0);

/** Enumerate this small table to audit the greedy result; this does not assign the drawing. */
export function cheapestComplete(example: SlotExample): readonly SlotAssignment[] {
  let best: readonly SlotAssignment[] = [];
  let bestCost = Infinity;
  const visit = (partial: readonly SlotAssignment[], free: readonly number[]) => {
    if (free.length === 0) {
      const total = assignmentCost(partial);
      if (total < bestCost) {
        best = partial;
        bestCost = total;
      }
      return;
    }
    const unit = candidates[partial.length];
    for (const slot of free) {
      visit(
        [
          ...partial,
          {
            unitId: unit.id,
            slot,
            slotRole: roles[slot],
            cost: slotCost(example.costs, unit.unitClass, roles[slot]),
          },
        ],
        free.filter((remaining) => remaining !== slot),
      );
    }
  };
  visit(
    [],
    roles.map((_role, slot) => slot),
  );
  return best;
}

const unitPoint = (example: SlotExample, index: number): StudyPoint => ({
  x: example.unitX,
  y: (index - 1) * example.spacing,
});
const slotPoint = (example: SlotExample, slot: number): StudyPoint => ({
  x: example.slotX,
  y: (slot - 1) * example.spacing,
});
const describeAssignment = (assignment: readonly SlotAssignment[]) =>
  assignment.length === 0
    ? 'no links yet'
    : assignment
        .map(({ unitId, slotRole, cost }) => `${unitId} → ${slotRole} (${fixed(cost)})`)
        .join('; ');

function allocationNote(assignment: readonly SlotAssignment[], stage: number, excess: number) {
  if (stage === 0)
    return `${assignment[0].unitId} has the fewest suitable posts, so that guard gets the first choice.`;
  const chosen = assignment[stage - 1];
  if (stage === assignment.length)
    return excess > 1e-10
      ? 'Everyone has a post, but earlier reservations leave a more expensive roster than another complete assignment.'
      : 'Everyone has a distinct post, and this roster matches the lowest complete cost for the current table.';
  if (stage === assignment.length - 1)
    return `${chosen.unitId} reserves the ${chosen.slotRole} as the cheapest free post, leaving ${assignment[stage].unitId} to take the remainder.`;
  return `${chosen.unitId} reserves the ${chosen.slotRole} as the cheapest free post, so the other guards must choose around that commitment.`;
}

function frameOf(
  example: SlotExample,
  assignment: readonly SlotAssignment[],
  stage: number,
): MotionFrame {
  const committed = assignment.slice(0, stage);
  const decision = stage === 0 ? null : assignment[stage - 1];
  const previously = new Set(assignment.slice(0, Math.max(0, stage - 1)).map(({ slot }) => slot));
  const unit = decision ? candidates.find(({ id }) => id === decision.unitId) : undefined;
  const choices = unit
    ? roles
        .flatMap((role, slot) =>
          previously.has(slot)
            ? []
            : [`${role}: ${fixed(slotCost(example.costs, unit.unitClass, role))}`],
        )
        .join('; ')
    : 'all slots are free';
  const costTable = candidates
    .map(
      ({ id, unitClass }) =>
        `${id}: ${roles.map((role) => fixed(slotCost(example.costs, unitClass, role))).join(' | ')}`,
    )
    .join('; ');
  const counts = acceptableCounts(example)
    .map(({ id, count }) => `${id} ${count}`)
    .join(', ');
  const order = assignment.map(({ unitId }) => unitId).join(' → ');
  const total = assignmentCost(committed);
  const prior = assignmentCost(assignment.slice(0, Math.max(0, stage - 1)));
  const optimum = cheapestComplete(example);
  const excess = Math.max(0, assignmentCost(assignment) - assignmentCost(optimum));
  const reservations =
    committed.length === 0
      ? 'No guard is linked to a post yet'
      : `Links reserve ${committed.map(({ unitId, slotRole }) => `${unitId} for the ${slotRole}`).join(', ')}`;
  return {
    seconds: stage * example.decisionSeconds,
    bodies: candidates.map(({ id }, index) => ({ id, label: id, ...unitPoint(example, index) })),
    marks: roles.map((role, slot) => ({
      ...slotPoint(example, slot),
      shape: 'ring',
      label: role[0].toUpperCase() + role.slice(1),
    })),
    links: committed.map(({ unitId, slot }) => ({
      from: unitPoint(
        example,
        candidates.findIndex(({ id }) => id === unitId),
      ),
      to: slotPoint(example, slot),
      tone: 'actual',
    })),
    values: {
      stage: String(stage),
      total: fixed(total),
      acceptableBelow: fixed(example.acceptableBelow),
      costTable,
      counts,
      order,
      choices,
      reservations,
      flankCost: fixed(slotCost(example.costs, 'reserve', 'flank')),
      rosterOutcome:
        excess > 1e-10
          ? `the greedy roster costs ${fixed(excess)} more than the minimum`
          : 'the greedy roster matches the minimum complete cost',
      decision: decision
        ? `${decision.unitId} takes ${decision.slotRole} for ${fixed(decision.cost)}`
        : 'no choice has been committed',
      assignments: describeAssignment(committed),
      optimum: fixed(assignmentCost(optimum)),
    },
    note: allocationNote(assignment, stage, excess),
    worked: {
      title: stage === 0 ? 'Beacon gate cost table' : `Decision ${stage}: ${decision?.unitId}`,
      lines: [
        'Columns are front | flank | rear; costs measure role suitability rather than travel distance.',
        ...candidates.map(
          ({ id, unitClass }) =>
            `${id}: ${roles.map((role) => fixed(slotCost(example.costs, unitClass, role))).join(' | ')}`,
        ),
        `Count costs < ${fixed(example.acceptableBelow)} in the original table: ${counts}. Fewest first, then input order: ${order}.`,
        ...(decision
          ? [
              `Free costs for ${decision.unitId}: ${choices}. Choose ${decision.slotRole}; ties favour the earlier column.`,
              `Running cost: ${fixed(prior)} + ${fixed(decision.cost)} = ${fixed(total)}.`,
            ]
          : ['No slot has been reserved yet.']),
        ...(stage === assignment.length
          ? [
              `Greedy total = ${committed.map(({ cost }) => fixed(cost)).join(' + ')} = ${fixed(total)}.`,
              `Checking every complete assignment gives ${describeAssignment(optimum)}; minimum ${fixed(assignmentCost(optimum))}, greedy excess ${fixed(excess)}.`,
            ]
          : []),
      ],
      note: `Each ${fixed(example.decisionSeconds)} s interval reveals a decision, without walking or steering.`,
    },
  };
}

export const model = (parameters: StudyParameters): MotionStudyModel => {
  const example = readSlotExample(parameters);
  const assignment = allocate(example);
  const frames = Array.from({ length: assignment.length + 1 }, (_unused, stage) =>
    frameOf(example, assignment, stage),
  );
  const changed: SlotExample = {
    ...example,
    costs: { ...example.costs, 'cost.reserve.flank': example.comparisonFlankCost },
  };
  const changedAssignment = allocate(changed);
  const selectedOptimum = cheapestComplete(example);
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
    timeline: {
      title: 'Cost committed by each decision',
      xLabel: 'Presentation time · seconds',
      yLabel: 'Accumulated role cost',
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
          label: 'Selected cost table',
          tone: 'actual',
          values: cumulative(assignment),
        },
      ],
    },
    initialStep: 2,
    moments: [
      { label: 'Read the table', step: 0 },
      ...assignment.map(({ unitId }, index) => ({ label: `${unitId} chooses`, step: index + 1 })),
    ],
    legend: [
      { tone: 'subject', label: 'Named dots · guards waiting for posts' },
      { tone: 'target', label: 'Named rings · role posts' },
      { tone: 'actual', label: 'Links · committed reservations' },
    ],
    caption:
      'Named guards wait on the left and named posts are on the right. Links reveal reservations, not walking routes; the worked step prints the cost table. Change Ari’s flank cost to inspect the greedy total and the ranking cut-off.',
    comparison: {
      title: sameCost
        ? 'Both runs now use the same flank cost'
        : 'A local choice can leave an expensive remainder',
      intro: `Selected Ari flank cost ${fixed(slotCost(example.costs, 'reserve', 'flank'))}; comparison cost ${fixed(example.comparisonFlankCost)}. Only that table entry changes. Comparison counts: ${acceptableCounts(
        changed,
      )
        .map(({ id, count }) => `${id} ${count}`)
        .join(', ')}, giving order ${changedAssignment.map(({ unitId }) => unitId).join(' → ')}.`,
      timeline: {
        title: 'Accumulated cost of the two allocations',
        xLabel: 'Presentation time · seconds',
        yLabel: 'Accumulated role cost',
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
            label: 'Selected cost table',
            tone: 'actual',
            values: cumulative(assignment),
          },
          {
            id: 'compared',
            label: 'Comparison flank cost',
            tone: 'desired',
            values: cumulative(changedAssignment),
          },
        ],
        reference: assignmentCost(changedOptimum),
      },
      findings: [
        `Selected roster: ${describeAssignment(assignment)}. Total ${fixed(assignmentCost(assignment))}; minimum complete cost ${fixed(assignmentCost(selectedOptimum))}.`,
        `Comparison roster: ${describeAssignment(changedAssignment)}. Total ${fixed(assignmentCost(changedAssignment))}. Checking every complete assignment gives ${describeAssignment(changedOptimum)}, total ${fixed(assignmentCost(changedOptimum))}: ${fixed(Math.max(0, assignmentCost(changedAssignment) - assignmentCost(changedOptimum)))} less. Each greedy choice ignores the cost of the posts left for later guards.`,
      ],
      note: 'The reference is the minimum complete cost for the comparison table; partial totals may be below it before the last decision.',
    },
    inputs: [
      {
        name: 'cost.reserve.flank',
        label: 'Ari’s flank cost',
        unit: 'cost',
        min: 0.1,
        max: 1.2,
        step: 0.1,
      },
    ],
  };
};

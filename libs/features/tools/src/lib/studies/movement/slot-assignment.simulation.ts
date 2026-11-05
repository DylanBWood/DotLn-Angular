import type { StudyParameters } from '@dotln-angular/models';
import {
  assignSlots,
  type SlotAssignment,
  type SlotCandidate,
  type SlotCosts,
} from '@dotln-angular/scene-engine';

import { numberParameter } from '../parameters';

export const candidates: readonly SlotCandidate[] = [
  { id: 'Ari', unitClass: 'reserve' },
  { id: 'Bryn', unitClass: 'shield' },
  { id: 'Cleo', unitClass: 'medic' },
];

export const roles = ['front', 'flank', 'rear'] as const;

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

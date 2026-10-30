import type { SlotAssignment, UnitId } from './types';

export interface SlotCandidate {
  readonly id: UnitId;
  readonly unitClass: string;
}

/** What it costs a unit of a class to fill a slot of a role; a missing pair costs the most. */
export type SlotCosts = Readonly<Record<string, number>>;

/** A slot is acceptable to a unit when its cost is below this. */
const acceptableCost = 1;

const unsuitable = 100;

export const slotCostKey = (unitClass: string, slotRole: string) => `cost.${unitClass}.${slotRole}`;

export const costOf = (costs: SlotCosts, unitClass: string, slotRole: string) =>
  costs[slotCostKey(unitClass, slotRole)] ?? unsuitable;

/**
 * Greedy assignment, most constrained first: units with the fewest acceptable slots choose
 * first and take their cheapest free slot. Ties go to the earlier unit and the earlier slot,
 * so a result can be computed by hand.
 */
export function assignSlots(
  units: readonly SlotCandidate[],
  slotRoles: readonly string[],
  costs: SlotCosts,
): readonly SlotAssignment[] {
  const acceptableSlots = (unit: SlotCandidate) =>
    slotRoles.filter((role) => costOf(costs, unit.unitClass, role) < acceptableCost).length;
  const order = units
    .map((unit, index) => ({ unit, index, acceptable: acceptableSlots(unit) }))
    .sort((a, b) => a.acceptable - b.acceptable || a.index - b.index);

  const free = new Set(slotRoles.keys());
  const assignment: SlotAssignment[] = [];
  for (const { unit } of order) {
    let chosen = -1;
    let cheapest = Infinity;
    for (const slot of free) {
      const cost = costOf(costs, unit.unitClass, slotRoles[slot]);
      if (cost < cheapest) {
        cheapest = cost;
        chosen = slot;
      }
    }
    if (chosen === -1) continue;
    free.delete(chosen);
    assignment.push({
      unitId: unit.id,
      slot: chosen,
      slotRole: slotRoles[chosen],
      cost: cheapest,
    });
  }
  return assignment;
}

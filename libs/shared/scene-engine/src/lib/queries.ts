import { placeOf } from './formation';
import type { SimulationState, UnitId, UnitState } from './types';
import { distance } from './vectors';

/** Every pair of units touching, each pair once. */
export function touchingPairs<Body extends Pick<UnitState, 'position' | 'radius'>>(
  units: readonly Body[],
): readonly (readonly [Body, Body])[] {
  return units.flatMap((unit, index) =>
    units
      .slice(index + 1)
      .filter((other) => distance(unit.position, other.position) < unit.radius + other.radius)
      .map((other) => [unit, other] as const),
  );
}

/** The units a unit moves with: its formation, then its group; nobody if it stands alone. */
export function squadOf(state: SimulationState, unitId: UnitId): readonly UnitId[] {
  const formation = state.formations.find(
    ({ leader, assignment }) =>
      leader === unitId || assignment.some((member) => member.unitId === unitId),
  );
  if (formation) {
    const members = formation.assignment.map((member) => member.unitId);
    // A leader given steering of its own has left the slots behind and still leads them.
    return formation.leader === null ? members : [...new Set([formation.leader, ...members])];
  }
  return state.units.find((unit) => unit.id === unitId)?.behaviour.group ?? [];
}

/** Those of these units not following a formation, so free to take an order of their own. */
export const unitsFollowingNothing = (state: SimulationState, unitIds: readonly UnitId[]) =>
  unitIds.filter((unitId) => placeOf(state.formations, unitId) === null);

/** The slot table of the formation holding any of these units, or none. */
export const assignmentOf = (state: SimulationState, unitIds: readonly UnitId[]) =>
  state.formations.find(({ assignment }) =>
    assignment.some(({ unitId }) => unitIds.includes(unitId)),
  )?.assignment ?? [];

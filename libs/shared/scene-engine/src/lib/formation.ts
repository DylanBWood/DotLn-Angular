import { assignSlots } from './slot-assignment';
import type {
  FormationPattern,
  FormationState,
  SceneFormation,
  UnitId,
  UnitState,
  Vec2,
} from './types';
import {
  add,
  alongHeading,
  centroid,
  clipLength,
  distance,
  length,
  normalize,
  scale,
  subtract,
} from './vectors';

export const formationPatterns: readonly FormationPattern[] = ['wedge', 'line', 'column'];

export const slotRoles = ['close-combat', 'ranged', 'support'] as const;

const anchorAcceleration = 24;
const anchorSlowRadius = 6;
// The catalog gives anchor speed in distance per step. Its step is a planning step, not the
// sixtieth of a second the scene ticks at; a quarter of a second marches at a brisk walk.
const anchorStepSeconds = 0.25;
const anchorStopRadius = 0.5;
// How much of the way to the members' mean the anchor is pulled each frame.
const anchorModeration = 0.02;
const turningSpeed = 0.05;

// Slots are laid out with x running forward and y to the side. A wedge's tip leads with each
// row behind it two wider; a line stands abreast; a column files behind its head.
const layouts: Readonly<Record<FormationPattern, (index: number, count: number) => Vec2>> = {
  wedge: (index) => {
    if (index === 0) return { x: 0, y: 0 };
    const row = Math.ceil(index / 2);
    return { x: -row, y: index % 2 === 1 ? row : -row };
  },
  line: (index, count) => ({ x: 0, y: index - (count - 1) / 2 }),
  column: (index, count) => ({ x: (count - 1) / 2 - index, y: 0 }),
};

/** The slots of a pattern around their own centre, so the anchor sits amid the formation. */
export function patternSlots(
  pattern: FormationPattern,
  count: number,
  spacing: number,
): readonly Vec2[] {
  const offsets = Array.from({ length: count }, (_, index) =>
    scale(layouts[pattern](index, count), spacing),
  );
  const centre = centroid(offsets);
  return offsets.map((offset) => subtract(offset, centre));
}

/** The role of each slot: the leading third fights, the next third shoots, the rest support. */
export function patternSlotRoles(count: number): readonly string[] {
  return Array.from({ length: count }, (_, index) => {
    const band = Math.floor((index * slotRoles.length) / count);
    return slotRoles[band];
  });
}

/** Both initial placement and a smaller roster use the formation's original rules. */
export function rosterSlots(
  layout: Pick<SceneFormation, 'kind' | 'pattern' | 'spacing' | 'slotCosts'>,
  members: readonly UnitState[],
) {
  const centred = patternSlots(layout.pattern, members.length, layout.spacing);
  const roles = patternSlotRoles(members.length);
  if (layout.kind === 'two-level')
    return { slots: centred, assignment: assignSlots(members, roles, layout.slotCosts) };
  return {
    slots: centred.map((slot) => subtract(slot, centred[0])),
    assignment: members.map((unit, slot) => ({
      unitId: unit.id,
      slot,
      slotRole: roles[slot],
      cost: 0,
    })),
  };
}

/** Close vacancies from a knockout. A member reassigned by a composition step keeps its old slot vacant. */
export function reformAfterKnockout(
  formations: readonly SceneFormation[],
  units: readonly UnitState[],
  down: ReadonlySet<UnitId>,
): readonly SceneFormation[] {
  return formations.flatMap((formation) => {
    const lostLeader = formation.leader !== null && down.has(formation.leader);
    if (!lostLeader && !formation.assignment.some(({ unitId }) => down.has(unitId)))
      return [formation];

    const remainingIds = new Set(
      formation.assignment.filter(({ unitId }) => !down.has(unitId)).map(({ unitId }) => unitId),
    );
    const remaining = units.filter(({ id }) => remainingIds.has(id));
    if (remaining.length === 0) return [];

    if (formation.kind === 'two-level')
      return [{ ...formation, ...rosterSlots(formation, remaining) }];

    // Fixed slots are assigned in row order. A leader previously given a separate order
    // can still lead the row even though its slot assignment is no longer present.
    const slots = new Map(formation.assignment.map(({ unitId, slot }) => [unitId, slot]));
    remaining.sort((a, b) => (slots.get(a.id) ?? 0) - (slots.get(b.id) ?? 0));
    const previousLeader = !lostLeader && units.find(({ id }) => id === formation.leader);
    const leader = previousLeader || remaining[0];
    const row = rosterSlots(formation, [leader, ...remaining.filter(({ id }) => id !== leader.id)]);
    return [
      {
        ...formation,
        slots: row.slots,
        assignment: row.assignment.filter(({ unitId }) => remainingIds.has(unitId)),
        leader: leader.id,
        anchor: leader.position,
        heading: leader.heading,
      },
    ];
  });
}

export const slotPosition = (formation: FormationState, slot: number): Vec2 =>
  add(formation.anchor, alongHeading(formation.slots[slot], formation.heading));

/** Where a unit stands in a formation it follows. */
export interface FormationPlace {
  readonly formation: FormationState;
  readonly slot: number;
}

/**
 * The formation a unit follows, read from the assignments, which are the only record of who
 * stands where. A fixed formation's leader leads it and so follows nothing.
 */
export function placeOf(
  formations: readonly FormationState[],
  unitId: UnitId,
): FormationPlace | null {
  for (const formation of formations) {
    const place = formation.assignment.find((member) => member.unitId === unitId);
    if (place && formation.leader !== unitId) return { formation, slot: place.slot };
  }
  return null;
}

/**
 * Moves a two-level formation's anchor to the centre of the slots still held and measures the
 * slots from it, so nothing stands anywhere new but the anchor and the members' mean agree. A
 * fixed formation is measured from its leader and has nothing to move.
 */
export function recentred(formation: SceneFormation): SceneFormation {
  if (formation.kind === 'fixed' || formation.assignment.length === 0) return formation;
  const held = centroid(formation.assignment.map(({ slot }) => formation.slots[slot]));
  return {
    ...formation,
    anchor: add(formation.anchor, alongHeading(held, formation.heading)),
    slots: formation.slots.map((slot) => subtract(slot, held)),
  };
}

function memberPositions(formation: FormationState, units: readonly UnitState[]) {
  const ids = new Set(formation.assignment.map(({ unitId }) => unitId));
  return units.filter((unit) => ids.has(unit.id)).map((unit) => unit.position);
}

export const memberMean = (formation: FormationState, units: readonly UnitState[]) =>
  centroid(memberPositions(formation, units));

/**
 * Moves a formation one frame. A two-level anchor is steered like a character toward the
 * objective, then pulled back toward the members so it can never run away from them. A fixed
 * formation has no anchor of its own: it copies the leader, every twitch included.
 */
export function advanceFormation<F extends FormationState>(
  formation: F,
  units: readonly UnitState[],
  target: Vec2 | null,
  timeStep: number,
): F {
  if (formation.kind === 'fixed') {
    const leader = units.find((unit) => unit.id === formation.leader);
    return leader ? { ...formation, anchor: leader.position, heading: leader.heading } : formation;
  }

  const offset = target === null ? null : subtract(target, formation.anchor);
  const gap = offset === null ? 0 : length(offset);
  const speed =
    offset === null || gap <= anchorStopRadius
      ? 0
      : (formation.anchorSpeed / anchorStepSeconds) *
        Math.min(1, (gap - anchorStopRadius) / (anchorSlowRadius - anchorStopRadius));
  const desired = offset === null ? { x: 0, y: 0 } : scale(normalize(offset), speed);
  const anchorVelocity = add(
    formation.anchorVelocity,
    clipLength(subtract(desired, formation.anchorVelocity), anchorAcceleration * timeStep),
  );

  const mean = memberMean(formation, units);
  const moved = add(formation.anchor, scale(anchorVelocity, timeStep));
  const moderated = add(moved, scale(subtract(mean, moved), anchorModeration));
  const lag = distance(moderated, mean);
  const anchor =
    lag > formation.lagLimit
      ? add(mean, scale(subtract(moderated, mean), formation.lagLimit / lag))
      : moderated;

  return {
    ...formation,
    anchor,
    anchorVelocity,
    heading: length(anchorVelocity) > turningSpeed ? normalize(anchorVelocity) : formation.heading,
  };
}

import { memberMean, slotPosition } from './formation';
import { touchingPairs } from './queries';
import { frameSeconds, stallThreshold } from './simulation';
import type {
  FormationState,
  MetricName,
  SceneMetrics,
  SimulationState,
  UnitId,
  UnitState,
} from './types';
import { centroid, distance, length } from './vectors';

export const metricNames: readonly MetricName[] = [
  'cohesionRadius',
  'collisions',
  'headingVariance',
  'timeToObjective',
  'stalledUnits',
  'anchorToMean',
  'slotError',
  'assignmentCost',
];

// A focus naming nobody in the scene, as an imported step can, reads as the whole scene.
function focusUnits(state: SimulationState, focus: readonly UnitId[]) {
  const ids = new Set(focus);
  const focused = state.units.filter((unit) => ids.has(unit.id));
  return focused.length === 0 ? state.units : focused;
}

const collisionCount = (units: readonly UnitState[], focus: ReadonlySet<UnitId>) =>
  touchingPairs(units).filter(([a, b]) => focus.size === 0 || focus.has(a.id) || focus.has(b.id))
    .length;

function formationFor(state: SimulationState, focus: ReadonlySet<UnitId>): FormationState | null {
  const inFocus = (formation: FormationState) =>
    focus.size === 0 || formation.assignment.some(({ unitId }) => focus.has(unitId));
  return [...state.formations].reverse().find(inFocus) ?? null;
}

function slotErrorOf(formation: FormationState, units: readonly UnitState[]) {
  const errors = formation.assignment.flatMap(({ unitId, slot }) => {
    const unit = units.find((candidate) => candidate.id === unitId);
    return unit ? [distance(unit.position, slotPosition(formation, slot))] : [];
  });
  return errors.reduce((sum, error) => sum + error, 0) / errors.length;
}

/** Measures the focus units, or every unit when the focus is empty. */
export function measure(state: SimulationState, focus: readonly UnitId[] = []): SceneMetrics {
  const units = focusUnits(state, focus);
  const focusSet = new Set(focus);
  const centre = centroid(units.map((unit) => unit.position));
  const { objective } = state;
  const formation = formationFor(state, focusSet);
  return {
    cohesionRadius: Math.max(...units.map((unit) => distance(unit.position, centre))),
    collisions: collisionCount(state.units, focusSet),
    // Circular variance: nought when every heading agrees, near one when they scatter.
    headingVariance: 1 - length(centroid(units.map((unit) => unit.heading))),
    timeToObjective:
      objective?.arrivedAt == null
        ? null
        : (objective.arrivedAt - objective.startedAt) * frameSeconds,
    stalledUnits: units.filter((unit) => unit.stallFrames >= stallThreshold).length,
    anchorToMean:
      formation?.kind === 'two-level'
        ? distance(formation.anchor, memberMean(formation, state.units))
        : null,
    slotError: formation ? slotErrorOf(formation, state.units) : null,
    assignmentCost: formation
      ? formation.assignment.reduce((sum, { cost }) => sum + cost, 0)
      : null,
  };
}

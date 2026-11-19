import type { SceneMetrics, Trial } from '@dotln-angular/scene-engine';

import type {
  FormationReading,
  InstrumentId,
  InstrumentView,
  TrialView,
} from '../models/scene-view-model';

const fightIds: readonly InstrumentId[] = ['shots', 'hits', 'accuracy', 'downUnits'];

const movementIds: readonly InstrumentId[] = [
  'cohesionRadius',
  'collisions',
  'headingVariance',
  'timeToObjective',
  'stalledUnits',
  'pathLength',
  'replans',
  'blockedUnits',
];

export const instrumentIds = [...movementIds, ...fightIds];
const duringVolley = [...fightIds, ...movementIds];

// Route figures say nothing about a trial in which nobody followed a route, so the compare leaves
// them out of one.
const routeIds: readonly InstrumentId[] = ['pathLength', 'replans', 'blockedUnits'];

/** How many frames of history a sparkline shows. */
export const sparklineFrames = 600;

export const sparklineWidth = 120;
export const sparklineHeight = 28;
export const chartWidth = 240;
export const chartHeight = 56;

const decimals: Readonly<Record<InstrumentId, number>> = {
  cohesionRadius: 1,
  collisions: 0,
  headingVariance: 2,
  timeToObjective: 1,
  stalledUnits: 0,
  pathLength: 1,
  replans: 0,
  blockedUnits: 0,
  shots: 0,
  hits: 0,
  accuracy: 0,
  downUnits: 0,
};

/** A figure in its own precision; null stays null, never a fabricated zero. */
const formatNumber = (value: number | null, places = 1) =>
  value === null ? null : value.toFixed(places);

const formatReading = (id: InstrumentId, value: number | null) =>
  formatNumber(id === 'accuracy' && value !== null ? value * 100 : value, decimals[id]);

/** Scales a series into a polyline's points; gaps in a series are left out, not invented. */
export function seriesPoints(
  values: readonly (number | null)[],
  width: number,
  height: number,
  ceiling?: number,
): string {
  const known = values.filter((value): value is number => value !== null);
  if (known.length === 0) return '';
  const top = ceiling ?? Math.max(...known);
  const bottom = ceiling === undefined ? Math.min(...known) : 0;
  const range = top - bottom || 1;
  const stride = Math.max(1, Math.ceil(values.length / width));
  const across = (index: number) => ((index / Math.max(1, values.length - 1)) * width).toFixed(1);
  const up = (value: number) => (height - ((value - bottom) / range) * height).toFixed(1);
  return values
    .flatMap((value, index) =>
      value === null || index % stride !== 0 ? [] : [`${across(index)},${up(value)}`],
    )
    .join(' ');
}

export interface InstrumentLabels {
  readonly name: (id: InstrumentId) => string;
  readonly unit: (id: InstrumentId) => string;
  readonly unknown: string;
}

export function mapInstruments(
  metrics: SceneMetrics,
  points: Readonly<Record<InstrumentId, string>>,
  labels: InstrumentLabels,
): readonly InstrumentView[] {
  const ordered = metrics.shots > 0 || metrics.downUnits > 0 ? duringVolley : instrumentIds;
  return ordered.map((id) => {
    const reading = formatReading(id, metrics[id]);
    return {
      id,
      label: labels.name(id),
      value: reading ?? labels.unknown,
      unit: reading === null ? '' : labels.unit(id),
      known: reading !== null,
      points: points[id],
    };
  });
}

/** Formation figures, or null when the units measured are not in a formation. */
export function mapFormation(metrics: SceneMetrics, unknown: string): FormationReading | null {
  const { anchorToMean, slotError, assignmentCost } = metrics;
  if (slotError === null) return null;
  return {
    anchorToMean: formatNumber(anchorToMean) ?? unknown,
    slotError: formatNumber(slotError) ?? unknown,
    assignmentCost: formatNumber(assignmentCost, 0) ?? unknown,
  };
}

/** Both branches of each metric on one scale, so the two lines compare directly. */
export function mapTrial(trial: Trial, labels: InstrumentLabels): TrialView {
  const marker =
    trial.firstDivergenceFrame === null
      ? null
      : ((trial.firstDivergenceFrame - trial.from) / Math.max(1, trial.frames)) * chartWidth;
  const { pathLength, blockedUnits } = trial.metrics;
  const shots = trial.metrics.shots;
  const fired = [...shots.a, ...shots.b].some((value) => (value ?? 0) > 0);
  const routed =
    [...pathLength.a, ...pathLength.b].some((value) => value !== null) ||
    [...blockedUnits.a, ...blockedUnits.b].some((value) => (value ?? 0) > 0);
  return {
    firstDivergence: trial.firstDivergenceFrame,
    series: (fired ? duringVolley : instrumentIds).flatMap((id) => {
      if (!routed && routeIds.includes(id)) return [];
      if (!fired && fightIds.includes(id)) return [];
      const { a, b } = trial.metrics[id];
      const known = [...a, ...b].filter((value): value is number => value !== null);
      if (known.length === 0) return [];
      const ceiling = Math.max(...known, 0) || 1;
      const summary = (value: number | null) => {
        const reading = formatReading(id, value);
        if (reading === null) return labels.unknown;
        return id === 'accuracy' ? reading + labels.unit(id) : reading;
      };
      return [
        {
          id,
          label: labels.name(id),
          before: seriesPoints(a, chartWidth, chartHeight, ceiling),
          after: seriesPoints(b, chartWidth, chartHeight, ceiling),
          marker,
          summaryBefore: summary(a.at(-1) ?? null),
          summaryAfter: summary(b.at(-1) ?? null),
        },
      ];
    }),
  };
}

import type {
  Composition,
  CompositionStep,
  MetricName,
  Trial,
  TrialSeries,
} from '@dotln-angular/scene-engine';
import { isSafeStep, metricNames } from '@dotln-angular/scene-engine';
import { RA } from '@dotln-angular/utils';

/** The shape under `dotln-angular.scene`, versioned so an older one is recognised and ignored. */
export interface StoredScene {
  readonly version: 1;
  readonly compositions: readonly Composition[];
}

/** What could be read back, and whether that was all of it. */
export interface RestoredScene {
  readonly compositions: readonly Composition[];
  readonly complete: boolean;
}

const exportSchema = 'scene-composition-v0';

type Fields = Readonly<Record<string, unknown>>;

const isObject = (value: unknown): value is Fields =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isCount = (value: unknown) => Number.isInteger(value) && Number(value) >= 0;

const isTextList = (value: unknown) =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

const isNumberRecord = (value: unknown) =>
  isObject(value) && Object.values(value).every((item) => typeof item === 'number');

const isSeries = (value: unknown) =>
  Array.isArray(value) && value.every((item) => item === null || typeof item === 'number');

const isSeriesPair = (value: unknown): value is TrialSeries =>
  isObject(value) && isSeries(value['a']) && isSeries(value['b']);

/**
 * The metrics `scene-composition-v0` carried when it was first written. A trial must hold a series
 * for each of them; a metric added since may be missing from a trial saved before it existed, and
 * reads as a series of nulls as long as the trial's own, which the compare shows as unknown. A
 * series that is there is checked whatever its metric.
 */
const firstMetrics: readonly MetricName[] = [
  'cohesionRadius',
  'collisions',
  'headingVariance',
  'timeToObjective',
  'stalledUnits',
  'anchorToMean',
  'slotError',
  'assignmentCost',
];

function isStep(value: unknown): value is CompositionStep {
  return (
    isObject(value) &&
    isCount(value['at']) &&
    RA.isNonEmptyString(value['toolId']) === true &&
    RA.isNonEmptyString(value['kind']) === true &&
    isTextList(value['selection']) &&
    isNumberRecord(value['params']) &&
    isSafeStep(value as unknown as CompositionStep)
  );
}

const isSteps = (value: unknown) => Array.isArray(value) && value.every(isStep);

const isBranch = (value: unknown) =>
  isObject(value) && typeof value['label'] === 'string' && isSteps(value['steps']);

const nulls = (length: number) => Array.from({ length }, () => null);

/** A stored trial with any later metric it lacks read as a series of nulls, or null when it is not one. */
function readTrial(value: unknown): Trial | null {
  if (!isObject(value)) return null;
  const { metrics } = value;
  const readable =
    RA.isNonEmptyString(value['id']) === true &&
    RA.isNonEmptyString(value['sceneId']) === true &&
    Number.isInteger(value['seed']) &&
    isCount(value['from']) &&
    isCount(value['frames']) &&
    isCount(value['sampleEvery']) &&
    isTextList(value['focus']) &&
    isBranch(value['branchA']) &&
    isBranch(value['branchB']) &&
    (value['firstDivergenceFrame'] === null || isCount(value['firstDivergenceFrame'])) &&
    isObject(metrics) &&
    firstMetrics.every((name) => isSeriesPair(metrics[name])) &&
    metricNames.every((name) => metrics[name] === undefined || isSeriesPair(metrics[name]));
  if (!readable) return null;
  const { a, b } = metrics['cohesionRadius'] as TrialSeries;
  const filled = Object.fromEntries(
    metricNames.map((name) => [name, metrics[name] ?? { a: nulls(a.length), b: nulls(b.length) }]),
  );
  return { ...(value as unknown as Trial), metrics: filled as Trial['metrics'] };
}

/** A stored composition with its trials read as above, or null when it is not one. */
function readComposition(value: unknown): Composition | null {
  if (
    !isObject(value) ||
    RA.isNonEmptyString(value['id']) !== true ||
    RA.isNonEmptyString(value['title']) !== true ||
    RA.isNonEmptyString(value['sceneId']) !== true ||
    !Number.isInteger(value['seed']) ||
    !isSteps(value['steps']) ||
    typeof value['note'] !== 'string' ||
    !Array.isArray(value['trials'])
  )
    return null;
  const trials = value['trials'].map(readTrial);
  return trials.every((trial) => trial !== null)
    ? { ...(value as unknown as Composition), trials: trials as Trial[] }
    : null;
}

/** Whether a stored value reads as a composition, a kept older trial's later metrics as nulls. */
export const isComposition = (value: unknown): boolean => readComposition(value) !== null;

/**
 * Reads a stored value back, or undefined for anything not the current shape. A composition that
 * cannot be read costs only itself: the rest come back, marked as not the whole of what was there.
 */
export function restoreStoredScene(value: unknown): RestoredScene | undefined {
  if (!isObject(value) || value['version'] !== 1) return undefined;
  const { compositions } = value;
  if (!Array.isArray(compositions)) return undefined;
  const readable = compositions.flatMap((composition) => {
    const read = readComposition(composition);
    return read === null ? [] : [read];
  });
  return { compositions: readable, complete: readable.length === compositions.length };
}

export const encodeExport = (composition: Composition) =>
  JSON.stringify({ schema: exportSchema, composition });

/** Reads exported text as a composition of this scene, or null for anything else. */
export function parseExport(text: string, sceneId: string): Composition | null {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return null;
  }
  if (!isObject(value) || value['schema'] !== exportSchema) return null;
  const composition = readComposition(value['composition']);
  return composition !== null && composition.sceneId === sceneId ? composition : null;
}

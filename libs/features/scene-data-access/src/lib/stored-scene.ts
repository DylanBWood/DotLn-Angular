import type { Composition, CompositionStep, Trial } from '@dotln-angular/scene-engine';
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

function isTrial(value: unknown): value is Trial {
  if (!isObject(value)) return false;
  const metrics = value['metrics'];
  return (
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
    metricNames.every((name) => {
      const series = metrics[name];
      return isObject(series) && isSeries(series['a']) && isSeries(series['b']);
    })
  );
}

export function isComposition(value: unknown): value is Composition {
  return (
    isObject(value) &&
    RA.isNonEmptyString(value['id']) === true &&
    RA.isNonEmptyString(value['title']) === true &&
    RA.isNonEmptyString(value['sceneId']) === true &&
    Number.isInteger(value['seed']) &&
    isSteps(value['steps']) &&
    typeof value['note'] === 'string' &&
    Array.isArray(value['trials']) &&
    value['trials'].every(isTrial)
  );
}

/**
 * Reads a stored value back, or undefined for anything not the current shape. A composition that
 * cannot be read costs only itself: the rest come back, marked as not the whole of what was there.
 */
export function restoreStoredScene(value: unknown): RestoredScene | undefined {
  if (!isObject(value) || value['version'] !== 1) return undefined;
  const { compositions } = value;
  if (!Array.isArray(compositions)) return undefined;
  const readable = compositions.filter(isComposition);
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
  const { composition } = value;
  return isComposition(composition) && composition.sceneId === sceneId ? composition : null;
}

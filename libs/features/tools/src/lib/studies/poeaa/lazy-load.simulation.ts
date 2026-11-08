import type { StudyParameters } from '@dotln-angular/models';

import { booleanParameter, numberParameter } from '../parameters';

/** The example's inputs: the size of the work's chunk, failed imports, and how studies are chunked. */
export interface LazyLoadParameters {
  /** How many study records the work's chunk carries; one import brings all of them into memory. */
  readonly studiesInChunk: number;
  /** How many imports fail before one succeeds, as a dropped connection would make them. */
  readonly failFirst: number;
  /** True when every study is a chunk of its own; false when a work's studies share one chunk. */
  readonly chunkPerStudy: boolean;
}

/** The three studies the reader opens, in the order the readings are opened. */
export const studies = ['lazyLoad', 'unitOfWork', 'recordSet'] as const;
export type StudyId = (typeof studies)[number];

/** Where a study's record stands: a marker in the summary, being imported, or in memory. */
export type RecordState = 'marker' | 'loading' | 'loaded';

/** What the loader holds after a step: each followed study's state and what it has cost so far. */
export interface StudyLoader {
  readonly recordStates: Readonly<Record<StudyId, RecordState>>;
  /** Chunk imports requested so far. */
  readonly requests: number;
  /** Study records in memory, counting every record a loaded chunk carries. */
  readonly records: number;
  /** Imports that have failed so far. */
  readonly failures: number;
}

export type LazyLoadOperation =
  | { readonly kind: 'start' }
  | { readonly kind: 'filter' }
  | { readonly kind: 'request'; readonly id: StudyId; readonly retry: boolean }
  | { readonly kind: 'arrive'; readonly id: StudyId }
  | { readonly kind: 'fail'; readonly id: StudyId }
  | { readonly kind: 'cached'; readonly id: StudyId };

/** One moment of the run: what the reader or the loader did, and the loader afterwards. */
export interface LazyLoadStep {
  readonly operation: LazyLoadOperation;
  readonly loader: StudyLoader;
  /** Readings the reader has opened so far. */
  readonly opened: number;
}

export const readParameters = (parameters: StudyParameters): LazyLoadParameters => ({
  studiesInChunk: numberParameter(parameters, 'studiesInChunk'),
  failFirst: numberParameter(parameters, 'failFirst'),
  chunkPerStudy: booleanParameter(parameters, 'chunkPerStudy'),
});

/** The loader once the studies summary has been read: every study a marker, nothing requested. */
export const summaryRead: StudyLoader = {
  recordStates: { lazyLoad: 'marker', unitOfWork: 'marker', recordSet: 'marker' },
  requests: 0,
  records: 0,
  failures: 0,
};

/** The followed studies one import brings in with this one: the whole work's, or this one alone. */
export const chunkOf = (example: LazyLoadParameters, id: StudyId): readonly StudyId[] =>
  example.chunkPerStudy ? [id] : studies;

const withState = (
  recordStates: StudyLoader['recordStates'],
  ids: readonly StudyId[],
  state: RecordState,
): StudyLoader['recordStates'] => ({
  ...recordStates,
  ...Object.fromEntries(ids.map((id) => [id, state])),
});

/** A first read of a study that is still a marker asks for its chunk: one request, and every study in it starts loading. */
export function request(
  loader: StudyLoader,
  example: LazyLoadParameters,
  id: StudyId,
): StudyLoader {
  if (loader.recordStates[id] !== 'marker') throw new Error(`${id} is not a marker.`);
  return {
    ...loader,
    recordStates: withState(loader.recordStates, chunkOf(example, id), 'loading'),
    requests: loader.requests + 1,
  };
}

/**
 * A pending import settles. While fewer imports have failed than the example asks for, it fails and
 * the loader forgets it, so every study in the chunk is a marker again; otherwise every study in it
 * is in memory, with as many records as the chunk carries.
 */
export function settle(
  loader: StudyLoader,
  example: LazyLoadParameters,
  id: StudyId,
): { readonly loader: StudyLoader; readonly failed: boolean } {
  const chunk = chunkOf(example, id);
  if (chunk.some((each) => loader.recordStates[each] !== 'loading'))
    throw new Error(`${id} has no import pending.`);
  if (loader.failures < example.failFirst)
    return {
      loader: {
        ...loader,
        recordStates: withState(loader.recordStates, chunk, 'marker'),
        failures: loader.failures + 1,
      },
      failed: true,
    };
  const carried = example.chunkPerStudy ? chunk.length : example.studiesInChunk;
  return {
    loader: {
      ...loader,
      recordStates: withState(loader.recordStates, chunk, 'loaded'),
      records: loader.records + carried,
    },
    failed: false,
  };
}

/**
 * The example as the reader runs it: the summary is read, the catalog is filtered to studied
 * concepts from the markers alone, then the readings of the three studies open in turn. A reading
 * whose record is a marker requests its chunk and waits for it, retrying after a failed import;
 * one whose record is in memory is answered without a request.
 */
export function lazyLoadRun(example: LazyLoadParameters): readonly LazyLoadStep[] {
  let loader = summaryRead;
  let opened = 0;
  const steps: LazyLoadStep[] = [{ operation: { kind: 'start' }, loader, opened }];
  const record = (operation: LazyLoadOperation) => steps.push({ operation, loader, opened });
  record({ kind: 'filter' });
  for (const id of studies) {
    opened += 1;
    if (loader.recordStates[id] === 'loaded') {
      record({ kind: 'cached', id });
      continue;
    }
    let failed = true;
    let retry = false;
    while (failed) {
      loader = request(loader, example, id);
      record({ kind: 'request', id, retry });
      const settled = settle(loader, example, id);
      loader = settled.loader;
      failed = settled.failed;
      record({ kind: failed ? 'fail' : 'arrive', id });
      retry = true;
    }
  }
  return steps;
}

/** The loader after each count of readings opened, from none to all three. */
export const afterEachReading = (steps: readonly LazyLoadStep[]): readonly StudyLoader[] =>
  [0, ...studies.map((_, index) => index + 1)].map(
    (opened) => steps.filter((step) => step.opened === opened).slice(-1)[0].loader,
  );

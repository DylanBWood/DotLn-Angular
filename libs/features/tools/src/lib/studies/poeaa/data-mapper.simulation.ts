import type { StudyParameters } from '@dotln-angular/models';

import { numberParameter } from '../parameters';

/** The example's inputs: the stored rows, the format this build reads, and how the save writes. */
export interface DataMapperParameters {
  readonly stepsFlank: number;
  readonly stepsRidge: number;
  readonly stepsDawn: number;
  /** The row format this build's mapper reads, and writes. */
  readonly formatRead: number;
  /** The format Dawn patrol's row was written in, by whichever build saved it. */
  readonly formatDawn: number;
  /** 1 when the save writes each changed object to its own row; 0 when it writes the whole library. */
  readonly eachRow: number;
}

/** The three compositions of the example, by id, in the order the scene lists them. */
export const compositions = ['flank', 'ridge', 'dawn'] as const;
export type CompositionId = (typeof compositions)[number];

/** One stored row: the format it was written in, the steps it encodes and its title's renames. */
export interface StoredRow {
  readonly format: number;
  readonly steps: number;
  readonly renames: number;
}

/** Browser storage as the mapper sees it: the rows by id, and the writes it has taken. */
export interface LibraryStorage {
  readonly rows: Readonly<Partial<Record<CompositionId, StoredRow>>>;
  readonly writes: number;
}

/** A composition as the domain holds it: no format, no key, nothing about where it is stored. */
export interface Composition {
  readonly steps: number;
  readonly renames: number;
}

/** What the mapper keeps: the objects it built, the rows it could not map, and its reads. */
export interface Mapper {
  readonly identityMap: Readonly<Partial<Record<CompositionId, Composition>>>;
  readonly unmapped: readonly CompositionId[];
  readonly reads: number;
}

/** What a find returned: the object, or null for a row it could not map, and the mapper after. */
export interface Found {
  readonly mapper: Mapper;
  readonly object: Composition | null;
  /** True when the identity map already held the object, so no row was read. */
  readonly fromMap: boolean;
}

/** What a whole-library save wrote, which rows it left out, and the storage afterwards. */
export interface WholeSave {
  readonly storage: LibraryStorage;
  readonly written: readonly CompositionId[];
  /** Rows storage held that the value no longer has, because no object stood for them. */
  readonly dropped: readonly CompositionId[];
}

export type DataMapperOperation =
  | { readonly kind: 'start' }
  | { readonly kind: 'load'; readonly id: CompositionId; readonly mapped: boolean }
  | { readonly kind: 'find'; readonly id: CompositionId }
  | { readonly kind: 'rename'; readonly id: CompositionId }
  | { readonly kind: 'update'; readonly id: CompositionId }
  | {
      readonly kind: 'saveAll';
      readonly written: readonly CompositionId[];
      readonly dropped: readonly CompositionId[];
    };

/** One moment of the run: what happened, and the mapper and the storage afterwards. */
export interface DataMapperStep {
  readonly operation: DataMapperOperation;
  readonly mapper: Mapper;
  readonly storage: LibraryStorage;
}

export const readParameters = (parameters: StudyParameters): DataMapperParameters => ({
  stepsFlank: numberParameter(parameters, 'stepsFlank'),
  stepsRidge: numberParameter(parameters, 'stepsRidge'),
  stepsDawn: numberParameter(parameters, 'stepsDawn'),
  formatRead: numberParameter(parameters, 'formatRead'),
  formatDawn: numberParameter(parameters, 'formatDawn'),
  eachRow: numberParameter(parameters, 'eachRow'),
});

export const emptyMapper: Mapper = { identityMap: {}, unmapped: [], reads: 0 };

/** The library as storage holds it before the session: three rows, two in this build's format. */
export const storedLibrary = (example: DataMapperParameters): LibraryStorage => ({
  rows: {
    flank: { format: example.formatRead, steps: example.stepsFlank, renames: 0 },
    ridge: { format: example.formatRead, steps: example.stepsRidge, renames: 0 },
    dawn: { format: example.formatDawn, steps: example.stepsDawn, renames: 0 },
  },
  writes: 0,
});

/** A row in the format this mapper reads becomes a composition; a row in any other is no object. */
export const mapRow = (row: StoredRow, formatRead: number): Composition | null =>
  row.format === formatRead ? { steps: row.steps, renames: row.renames } : null;

/** The row an object is written as, always in the format this build reads. */
export const rowOf = (object: Composition, formatRead: number): StoredRow => ({
  format: formatRead,
  steps: object.steps,
  renames: object.renames,
});

/**
 * Finds a composition: from the identity map when it was built before, otherwise by reading its
 * row and mapping it. A row the mapper cannot map is noted as unmapped and stands for no object.
 */
export function find(
  mapper: Mapper,
  storage: LibraryStorage,
  id: CompositionId,
  formatRead: number,
): Found {
  const held = mapper.identityMap[id];
  if (held) return { mapper, object: held, fromMap: true };
  const row = storage.rows[id];
  if (!row) throw new Error(`${id} has no row.`);
  const read = { ...mapper, reads: mapper.reads + 1 };
  const object = mapRow(row, formatRead);
  if (object === null)
    return { mapper: { ...read, unmapped: [...read.unmapped, id] }, object, fromMap: false };
  return {
    mapper: { ...read, identityMap: { ...read.identityMap, [id]: object } },
    object,
    fromMap: false,
  };
}

/**
 * The domain renames its composition. The identity map holds that same object, so it sees the
 * change; nothing touches storage, so the row keeps its earlier title.
 */
export function rename(mapper: Mapper, id: CompositionId): Mapper {
  const held = mapper.identityMap[id];
  if (!held) throw new Error(`${id} is not an object the mapper built.`);
  return {
    ...mapper,
    identityMap: { ...mapper.identityMap, [id]: { ...held, renames: held.renames + 1 } },
  };
}

/** Writes one object's own row, built from the object, and touches no other row. */
export function update(
  mapper: Mapper,
  storage: LibraryStorage,
  id: CompositionId,
  formatRead: number,
): LibraryStorage {
  const held = mapper.identityMap[id];
  if (!held) throw new Error(`${id} is not an object the mapper built.`);
  return { rows: { ...storage.rows, [id]: rowOf(held, formatRead) }, writes: storage.writes + 1 };
}

/**
 * Writes the whole library as one value, built from every object in the identity map, as a store
 * that keeps its library under one key must. A row with no object behind it is not in the value.
 */
export function saveAll(mapper: Mapper, storage: LibraryStorage, formatRead: number): WholeSave {
  const written = compositions.filter((id) => mapper.identityMap[id] !== undefined);
  const dropped = compositions.filter((id) => storage.rows[id] && !written.includes(id));
  const rows: Partial<Record<CompositionId, StoredRow>> = {};
  for (const id of written) rows[id] = rowOf(mapper.identityMap[id] as Composition, formatRead);
  return { storage: { rows, writes: storage.writes + 1 }, written, dropped };
}

/**
 * The example as the scene runs it: list the library through the mapper, open Hold the ridge a
 * second time, rename it, then save either that one row or the whole library.
 */
export function dataMapperRun(example: DataMapperParameters): readonly DataMapperStep[] {
  let storage = storedLibrary(example);
  let mapper = emptyMapper;
  const steps: DataMapperStep[] = [{ operation: { kind: 'start' }, mapper, storage }];
  const record = (operation: DataMapperOperation) => steps.push({ operation, mapper, storage });
  for (const id of compositions) {
    const found = find(mapper, storage, id, example.formatRead);
    mapper = found.mapper;
    record({ kind: 'load', id, mapped: found.object !== null });
  }
  const again = find(mapper, storage, 'ridge', example.formatRead);
  mapper = again.mapper;
  record(
    again.fromMap ? { kind: 'find', id: 'ridge' } : { kind: 'load', id: 'ridge', mapped: true },
  );
  mapper = rename(mapper, 'ridge');
  record({ kind: 'rename', id: 'ridge' });
  if (example.eachRow > 0) {
    storage = update(mapper, storage, 'ridge', example.formatRead);
    record({ kind: 'update', id: 'ridge' });
  } else {
    const saved = saveAll(mapper, storage, example.formatRead);
    storage = saved.storage;
    record({ kind: 'saveAll', written: saved.written, dropped: saved.dropped });
  }
  return steps;
}

/**
 * Where a composition stands after a step: an object that matches its row is `mapped`, one that has
 * changed since is `edited`, a row the mapper could not read is `unmapped`, and a row it has not yet
 * read is `stored`. A composition with neither row nor object has left the example.
 */
export function placeOf(
  step: DataMapperStep,
  id: CompositionId,
  formatRead: number,
): string | null {
  const row = step.storage.rows[id];
  const object = step.mapper.identityMap[id];
  if (object) {
    const written = row && row.format === formatRead && row.renames === object.renames;
    return written && row.steps === object.steps ? 'mapped' : 'edited';
  }
  if (!row) return null;
  return step.mapper.unmapped.includes(id) ? 'unmapped' : 'stored';
}

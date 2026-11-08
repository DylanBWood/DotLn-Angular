import type { StudyParameters } from '@dotln-angular/models';

import { booleanParameter, numberParameter } from '../parameters';

/** The example's inputs: the stored versions, how often one title changes, and a rival save. */
export interface UnitOfWorkParameters {
  readonly versionFlank: number;
  readonly versionRidge: number;
  /** How many times the session renames Hold the ridge before it saves. */
  readonly renames: number;
  /** True when another tab saves Hold the ridge after this session read it and before this save. */
  readonly otherTabSaves: boolean;
}

/** The three compositions of the example, by id. */
export const compositions = ['flank', 'ridge', 'night'] as const;
export type CompositionId = (typeof compositions)[number];

/** The register a held object is in: none of the three, which is clean, or new, dirty or removed. */
export type Register = 'clean' | 'new' | 'dirty' | 'removed';

/** One stored composition: how many times its title has changed, and the version its last write gave it. */
export interface StoredComposition {
  readonly edits: number;
  readonly version: number;
}

/** The store the session saves to: its rows by id, and the write calls it has served so far. */
export interface CompositionStore {
  readonly rows: Readonly<Partial<Record<CompositionId, StoredComposition>>>;
  readonly calls: number;
}

/** A composition as the session holds it: the version it was read at, and its edits since. */
export interface HeldComposition {
  readonly version: number;
  readonly edits: number;
}

/** What the unit of work remembers: every object the session holds, and the three registers. */
export interface UnitOfWork {
  readonly objects: Readonly<Partial<Record<CompositionId, HeldComposition>>>;
  readonly newObjects: readonly CompositionId[];
  readonly dirty: readonly CompositionId[];
  readonly removed: readonly CompositionId[];
}

/** What a commit sent, or why it sent nothing. */
export interface CommitResult {
  readonly inserts: readonly CompositionId[];
  readonly updates: readonly CompositionId[];
  readonly deletes: readonly CompositionId[];
  /** The object whose stored version no longer matched the version read; null when none. */
  readonly conflict: CompositionId | null;
}

export type UnitOfWorkOperation =
  | { readonly kind: 'start' }
  | { readonly kind: 'registerNew'; readonly id: CompositionId }
  | { readonly kind: 'registerDirty'; readonly id: CompositionId; readonly already: boolean }
  | { readonly kind: 'registerRemoved'; readonly id: CompositionId }
  | { readonly kind: 'otherSave'; readonly id: CompositionId }
  | { readonly kind: 'commit'; readonly result: CommitResult };

/** One moment of the run: what the session did, and the unit and the store afterwards. */
export interface UnitOfWorkStep {
  readonly operation: UnitOfWorkOperation;
  readonly unit: UnitOfWork;
  readonly store: CompositionStore;
  /** The write calls the session would have made by now had it written every change at once. */
  readonly immediateCalls: number;
}

export const readParameters = (parameters: StudyParameters): UnitOfWorkParameters => ({
  versionFlank: numberParameter(parameters, 'versionFlank'),
  versionRidge: numberParameter(parameters, 'versionRidge'),
  renames: numberParameter(parameters, 'renames'),
  otherTabSaves: booleanParameter(parameters, 'otherTabSaves'),
});

const without = (ids: readonly CompositionId[], id: CompositionId) =>
  ids.filter((each) => each !== id);

/** Reads stored rows into the session; an object read is clean, in no register. */
export function load(store: CompositionStore, ids: readonly CompositionId[]): UnitOfWork {
  const objects: Partial<Record<CompositionId, HeldComposition>> = {};
  for (const id of ids) {
    const row = store.rows[id];
    if (row) objects[id] = { version: row.version, edits: 0 };
  }
  return { objects, newObjects: [], dirty: [], removed: [] };
}

/** A new object joins the session and the new register; it has no stored version yet. */
export const registerNew = (unit: UnitOfWork, id: CompositionId): UnitOfWork => ({
  ...unit,
  objects: { ...unit.objects, [id]: { version: 0, edits: 0 } },
  newObjects: [...unit.newObjects, id],
});

/** A changed object joins the dirty register once; a new or already dirty one stays where it is. */
export function registerDirty(unit: UnitOfWork, id: CompositionId): UnitOfWork {
  const held = unit.objects[id];
  if (!held || unit.removed.includes(id)) throw new Error(`${id} cannot change now.`);
  const objects = { ...unit.objects, [id]: { ...held, edits: held.edits + 1 } };
  const listed = unit.newObjects.includes(id) || unit.dirty.includes(id);
  return { ...unit, objects, dirty: listed ? unit.dirty : [...unit.dirty, id] };
}

/** A removed object leaves the other registers; a new one is simply forgotten, never stored. */
export function registerRemoved(unit: UnitOfWork, id: CompositionId): UnitOfWork {
  if (unit.newObjects.includes(id)) {
    const { [id]: _forgotten, ...objects } = unit.objects;
    return { ...unit, objects, newObjects: without(unit.newObjects, id) };
  }
  return { ...unit, dirty: without(unit.dirty, id), removed: [...unit.removed, id] };
}

/** Another session's own commit of one changed row: the store's version moves on without this one. */
export function otherSave(store: CompositionStore, id: CompositionId): CompositionStore {
  const row = store.rows[id];
  if (!row) throw new Error(`${id} is not stored.`);
  return {
    rows: { ...store.rows, [id]: { edits: row.edits + 1, version: row.version + 1 } },
    calls: store.calls,
  };
}

/** The first changed or removed object whose stored version differs from the version read. */
const conflictIn = (unit: UnitOfWork, store: CompositionStore): CompositionId | null =>
  [...unit.dirty, ...unit.removed].find(
    (id) => store.rows[id]?.version !== unit.objects[id]?.version,
  ) ?? null;

/**
 * Writes every registered change in one call: inserts first, then updates, then deletes, each
 * update and delete only if the row still has the version the session read. One mismatch rolls
 * the whole call back, so the store and the registers stay exactly as they were.
 */
export function commit(
  unit: UnitOfWork,
  store: CompositionStore,
): { readonly unit: UnitOfWork; readonly store: CompositionStore; readonly result: CommitResult } {
  const conflict = conflictIn(unit, store);
  const result = { inserts: unit.newObjects, updates: unit.dirty, deletes: unit.removed, conflict };
  if (conflict !== null) return { unit, store: { ...store, calls: store.calls + 1 }, result };
  const rows: Partial<Record<CompositionId, StoredComposition>> = { ...store.rows };
  const objects: Partial<Record<CompositionId, HeldComposition>> = { ...unit.objects };
  for (const id of [...unit.newObjects, ...unit.dirty]) {
    const held = unit.objects[id] as HeldComposition;
    const stored = store.rows[id];
    const version = held.version + 1;
    rows[id] = { edits: (stored?.edits ?? 0) + (stored ? held.edits : 0), version };
    objects[id] = { version, edits: 0 };
  }
  for (const id of unit.removed) {
    delete rows[id];
    delete objects[id];
  }
  return {
    unit: { objects, newObjects: [], dirty: [], removed: [] },
    store: { rows, calls: store.calls + 1 },
    result,
  };
}

/**
 * The example as the session runs it: read two stored compositions, create a third, rename one
 * `renames` times, delete another, perhaps let another tab save first, then commit once.
 */
export function unitOfWorkRun(example: UnitOfWorkParameters): readonly UnitOfWorkStep[] {
  let store: CompositionStore = {
    rows: {
      flank: { edits: 0, version: example.versionFlank },
      ridge: { edits: 0, version: example.versionRidge },
    },
    calls: 0,
  };
  let unit = load(store, ['flank', 'ridge']);
  let immediateCalls = 0;
  const steps: UnitOfWorkStep[] = [{ operation: { kind: 'start' }, unit, store, immediateCalls }];
  const record = (operation: UnitOfWorkOperation, writesNow: number) => {
    immediateCalls += writesNow;
    steps.push({ operation, unit, store, immediateCalls });
  };
  unit = registerNew(unit, 'night');
  record({ kind: 'registerNew', id: 'night' }, 1);
  for (let rename = 0; rename < example.renames; rename++) {
    const already = unit.dirty.includes('ridge');
    unit = registerDirty(unit, 'ridge');
    record({ kind: 'registerDirty', id: 'ridge', already }, 1);
  }
  unit = registerRemoved(unit, 'flank');
  record({ kind: 'registerRemoved', id: 'flank' }, 1);
  if (example.otherTabSaves) {
    store = otherSave(store, 'ridge');
    record({ kind: 'otherSave', id: 'ridge' }, 0);
  }
  const committed = commit(unit, store);
  unit = committed.unit;
  store = committed.store;
  record({ kind: 'commit', result: committed.result }, 0);
  return steps;
}

/** The register each held object is in after a step: `clean` for one in none of the three. */
export function registerOf(unit: UnitOfWork, id: CompositionId): Register | null {
  if (!unit.objects[id]) return null;
  if (unit.newObjects.includes(id)) return 'new';
  if (unit.dirty.includes(id)) return 'dirty';
  return unit.removed.includes(id) ? 'removed' : 'clean';
}

import type { StudyParameters } from '@dotln-angular/models';

import { numberParameter } from '../parameters';

/** The example's inputs: each row's line, which is its id, whether keys go through an identity map, and the stop. */
export interface ForeignKeyParameters {
  readonly lineDataMapper: number;
  readonly lineIdentityMap: number;
  readonly lineUnitOfWork: number;
  /** 1 when the loader resolves keys through an identity map; 0 when every key reads its row afresh. */
  readonly identityMap: number;
  /** How many reads this model allows a loader that has not finished before it stops it. */
  readonly readLimit: number;
}

/** The three catalog rows of the example, in the order the drawing lists them. */
export const catalogRows = ['dataMapper', 'identityMap', 'unitOfWork'] as const;
export type RowId = (typeof catalogRows)[number];

/** A stored row: its line in the map, which is its id, and the keys of the rows it relates to. */
export interface CatalogRow {
  readonly id: RowId;
  readonly line: number;
  /** Foreign keys, kept on this row in the order its relations are listed. */
  readonly keys: readonly number[];
}

/** An object built from a row: which row, which copy of it, and the objects its keys became. */
export interface RowObject {
  readonly row: RowId;
  /** 1 for the first object built from the row; more only when nothing remembered the first. */
  readonly copy: number;
  /** The objects its keys resolved to so far, as positions in the loader's list of objects. */
  readonly references: readonly number[];
}

/** An object whose keys are still being followed, and the position of the next key on its row. */
export interface Pending {
  readonly object: number;
  readonly next: number;
}

/** What the loader holds: every object it built, its identity map, its unfinished objects and its reads. */
export interface Loader {
  readonly objects: readonly RowObject[];
  /** The object built for each row, by position; empty when the loader keeps no identity map. */
  readonly identityMap: Readonly<Partial<Record<RowId, number>>>;
  /** Objects whose keys are being followed, the innermost last. */
  readonly pending: readonly Pending[];
  readonly reads: number;
}

/** How one key became a reference: by loading its row, by finding it built, or by loading it again. */
export type Resolution = 'load' | 'found' | 'reload';

/** One key followed: whose key, which row it names, how it resolved, and the rows that finished. */
export interface FollowedKey {
  readonly from: RowId;
  readonly key: number;
  readonly to: RowId;
  readonly how: Resolution;
  /** Rows whose last key became a reference at this step, innermost first. */
  readonly resolved: readonly RowId[];
}

/** A key followed, with the loader afterwards. */
export interface Followed extends FollowedKey {
  readonly loader: Loader;
}

export type ForeignKeyOperation =
  | { readonly kind: 'start' }
  | { readonly kind: 'open'; readonly row: RowId }
  | ({ readonly kind: 'follow' } & FollowedKey)
  | { readonly kind: 'stopped' };

/** One moment of the run: what the loader did, and the loader afterwards. */
export interface ForeignKeyStep {
  readonly operation: ForeignKeyOperation;
  readonly loader: Loader;
}

export const readParameters = (parameters: StudyParameters): ForeignKeyParameters => ({
  lineDataMapper: numberParameter(parameters, 'lineDataMapper'),
  lineIdentityMap: numberParameter(parameters, 'lineIdentityMap'),
  lineUnitOfWork: numberParameter(parameters, 'lineUnitOfWork'),
  identityMap: numberParameter(parameters, 'identityMap'),
  readLimit: numberParameter(parameters, 'readLimit'),
});

export const emptyLoader: Loader = { objects: [], identityMap: {}, pending: [], reads: 0 };

/** The three rows as the catalog stores them, each keeping the keys of the other two in its own order. */
export const catalogOf = (example: ForeignKeyParameters): readonly CatalogRow[] => [
  {
    id: 'dataMapper',
    line: example.lineDataMapper,
    keys: [example.lineIdentityMap, example.lineUnitOfWork],
  },
  {
    id: 'identityMap',
    line: example.lineIdentityMap,
    keys: [example.lineUnitOfWork, example.lineDataMapper],
  },
  {
    id: 'unitOfWork',
    line: example.lineUnitOfWork,
    keys: [example.lineIdentityMap, example.lineDataMapper],
  },
];

/** The row a key names, refusing a key whose row the catalog does not have. */
export function rowByKey(catalog: readonly CatalogRow[], key: number): CatalogRow {
  const row = catalog.find(({ line }) => line === key);
  if (!row) throw new Error(`No row has the key ${key}.`);
  return row;
}

const rowOf = (catalog: readonly CatalogRow[], id: RowId): CatalogRow => {
  const row = catalog.find((candidate) => candidate.id === id);
  if (!row) throw new Error(`The catalog has no ${id}.`);
  return row;
};

/**
 * Reads a row and builds its object, entered in the identity map before any of its keys is
 * followed, so that a key leading back to it finds it there. The new object's keys are pending.
 */
export function load(loader: Loader, row: CatalogRow, useMap: boolean): Loader {
  const index = loader.objects.length;
  const copy = loader.objects.filter((object) => object.row === row.id).length + 1;
  const register = useMap && loader.identityMap[row.id] === undefined;
  return {
    objects: [...loader.objects, { row: row.id, copy, references: [] }],
    identityMap: register ? { ...loader.identityMap, [row.id]: index } : loader.identityMap,
    pending: [...loader.pending, { object: index, next: 0 }],
    reads: loader.reads + 1,
  };
}

/** The loader once its finished objects are off the stack, and the rows they were built from. */
interface Finished {
  readonly loader: Loader;
  readonly resolved: readonly RowId[];
}

/** Takes finished objects off the top of the pending stack, innermost first. */
function finish(loader: Loader, catalog: readonly CatalogRow[]): Finished {
  const pending = [...loader.pending];
  const resolved: RowId[] = [];
  for (let top = pending.at(-1); top !== undefined; top = pending.at(-1)) {
    const { row } = loader.objects[top.object];
    if (top.next < rowOf(catalog, row).keys.length) break;
    pending.pop();
    resolved.push(row);
  }
  return { loader: { ...loader, pending }, resolved };
}

/**
 * Follows the next key of the innermost unfinished object. Through the identity map, a key whose
 * row is built already becomes a reference to that object without a read; any other key loads its
 * row, whose own keys are then followed before this object's next one.
 */
export function follow(loader: Loader, catalog: readonly CatalogRow[], useMap: boolean): Followed {
  const top = loader.pending.at(-1);
  if (top === undefined) throw new Error('No object has a key left to follow.');
  const from = loader.objects[top.object];
  const key = rowOf(catalog, from.row).keys[top.next];
  const target = rowByKey(catalog, key);
  const known = useMap ? loader.identityMap[target.id] : undefined;
  const how: Resolution =
    known !== undefined
      ? 'found'
      : loader.objects.some(({ row }) => row === target.id)
        ? 'reload'
        : 'load';
  const reference = known ?? loader.objects.length;
  const objects = loader.objects.map((object, index) =>
    index === top.object ? { ...object, references: [...object.references, reference] } : object,
  );
  const advanced: Loader = {
    ...loader,
    objects,
    pending: [...loader.pending.slice(0, -1), { ...top, next: top.next + 1 }],
  };
  const next = known === undefined ? load(advanced, target, useMap) : advanced;
  const finished = finish(next, catalog);
  return {
    loader: finished.loader,
    from: from.row,
    key,
    to: target.id,
    how,
    resolved: finished.resolved,
  };
}

/**
 * The example as the loader runs it: open Data Mapper, then follow keys depth first until every
 * object is resolved, or until the read limit stops a loader that would otherwise never finish.
 */
export function foreignKeyRun(example: ForeignKeyParameters): readonly ForeignKeyStep[] {
  const catalog = catalogOf(example);
  const useMap = example.identityMap > 0;
  let loader = load(emptyLoader, rowOf(catalog, 'dataMapper'), useMap);
  const steps: ForeignKeyStep[] = [
    { operation: { kind: 'start' }, loader: emptyLoader },
    { operation: { kind: 'open', row: 'dataMapper' }, loader },
  ];
  while (loader.pending.length > 0 && loader.reads < example.readLimit) {
    const { loader: after, ...operation } = follow(loader, catalog, useMap);
    loader = after;
    steps.push({ operation: { kind: 'follow', ...operation }, loader });
  }
  if (loader.pending.length > 0) steps.push({ operation: { kind: 'stopped' }, loader });
  return steps;
}

/**
 * Where a row stands after a step: `stored` while no object stands for it, `resolving` while any
 * object built from it still has keys to follow, and `resolved` once every one of them is done.
 */
export function placeOf(loader: Loader, row: RowId): string {
  const built = loader.objects.flatMap((object, index) => (object.row === row ? [index] : []));
  if (built.length === 0) return 'stored';
  return loader.pending.some(({ object }) => built.includes(object)) ? 'resolving' : 'resolved';
}

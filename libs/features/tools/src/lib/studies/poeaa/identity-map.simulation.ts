import type { StudyParameters } from '@dotln-angular/models';

import { numberParameter } from '../parameters';

/** The example's inputs: how many maps the page's lookups go through, and how often the reader returns. */
export interface IdentityMapParameters {
  /** 1 when the reading and the nearby list share one loader's map; 2 when the list has its own. */
  readonly maps: number;
  /** How many times the reader goes back to Unit of Work before reloading the page. */
  readonly revisits: number;
}

/** The two studies of the example, by id. */
export const studies = ['unitOfWork', 'identityMap'] as const;
export type StudyId = (typeof studies)[number];

/** Who asks for a study: the open reading, or the list of nearby concepts beside it. */
export type Caller = 'reading' | 'nearby';

/** A study as the store holds it: a draft until its reviewers' check lands. */
export interface StoredStudy {
  readonly checked: boolean;
}

/** The store the loader reads, with the number of reads it has served so far. */
export interface StudyStore {
  readonly rows: Readonly<Record<StudyId, StoredStudy>>;
  readonly reads: number;
}

/** The object one read builds: which study, what it said then, and which read of the store built it. */
export interface LoadedStudy {
  readonly id: StudyId;
  readonly checked: boolean;
  readonly read: number;
}

/** One identity map: the object it holds under each id it has read. */
export type IdentityMap = Readonly<Partial<Record<StudyId, LoadedStudy>>>;

/** A reading session: one map shared by every caller, or one map for each caller. */
export interface Session {
  readonly maps: readonly IdentityMap[];
}

/** What one lookup did: the session and store afterwards, the object returned and whether it hit. */
export interface Lookup {
  readonly session: Session;
  readonly store: StudyStore;
  readonly study: LoadedStudy;
  readonly hit: boolean;
}

export type IdentityMapOperation =
  | { readonly kind: 'start' }
  | {
      readonly kind: 'find';
      readonly caller: Caller;
      readonly id: StudyId;
      readonly hit: boolean;
      /** Which of the session's maps answered: 0 for the first, 1 for the nearby list's own. */
      readonly map: number;
      readonly study: LoadedStudy;
    }
  | { readonly kind: 'check'; readonly id: StudyId }
  | { readonly kind: 'newSession' };

/** One moment of the run: what happened, and the session and the store afterwards. */
export interface IdentityMapStep {
  readonly operation: IdentityMapOperation;
  readonly session: Session;
  readonly store: StudyStore;
  /** Lookups answered from a map so far, over the whole run. */
  readonly hits: number;
  /** Lookups made so far: the reads a loader with no map would have made. */
  readonly lookups: number;
}

export const readParameters = (parameters: StudyParameters): IdentityMapParameters => ({
  maps: numberParameter(parameters, 'maps'),
  revisits: numberParameter(parameters, 'revisits'),
});

/** A new session's maps, all empty: one shared by every caller, or a second for the nearby list. */
export function startSession(maps: number): Session {
  if (maps !== 1 && maps !== 2) throw new Error('The example keeps one map or two.');
  return { maps: Array.from({ length: maps }, (): IdentityMap => ({})) };
}

/** The map a caller asks: the nearby list has its own only when the session keeps two. */
export const mapIndexOf = (session: Session, caller: Caller): number =>
  caller === 'nearby' && session.maps.length > 1 ? 1 : 0;

/**
 * Looks a study up by id. A map that already holds the id answers with the object it holds, and
 * nothing is read; otherwise the store is read once, and the object built from that read is kept
 * under the id before it is returned.
 */
export function find(session: Session, store: StudyStore, caller: Caller, id: StudyId): Lookup {
  const index = mapIndexOf(session, caller);
  const held = session.maps[index][id];
  if (held) return { session, store, study: held, hit: true };
  const read = store.reads + 1;
  const study: LoadedStudy = { id, checked: store.rows[id].checked, read };
  const maps = session.maps.map((map, each) => (each === index ? { ...map, [id]: study } : map));
  return { session: { maps }, store: { ...store, reads: read }, study, hit: false };
}

/** The reviewers' check lands in the store; no map that already holds the study hears of it. */
export const checkStudy = (store: StudyStore, id: StudyId): StudyStore => ({
  ...store,
  rows: { ...store.rows, [id]: { checked: true } },
});

/** How many objects the session holds for a study: none, one, or one in each of two maps. */
export const copiesOf = (session: Session, id: StudyId): number =>
  session.maps.filter((map) => map[id] !== undefined).length;

/**
 * The example as the page runs it: the reading opens Unit of Work, its check lands in the store,
 * the reader follows a link to Identity Map, whose nearby list asks for Unit of Work, the reader
 * goes back to Unit of Work `revisits` times, then reloads and opens Unit of Work once more.
 */
export function identityMapRun(example: IdentityMapParameters): readonly IdentityMapStep[] {
  let store: StudyStore = {
    rows: { unitOfWork: { checked: false }, identityMap: { checked: false } },
    reads: 0,
  };
  let session = startSession(example.maps);
  let hits = 0;
  let lookups = 0;
  const steps: IdentityMapStep[] = [
    { operation: { kind: 'start' }, session, store, hits, lookups },
  ];
  const record = (operation: IdentityMapOperation) =>
    steps.push({ operation, session, store, hits, lookups });
  const lookUp = (caller: Caller, id: StudyId) => {
    const map = mapIndexOf(session, caller);
    const result = find(session, store, caller, id);
    session = result.session;
    store = result.store;
    hits += result.hit ? 1 : 0;
    lookups += 1;
    record({ kind: 'find', caller, id, hit: result.hit, map, study: result.study });
  };
  lookUp('reading', 'unitOfWork');
  store = checkStudy(store, 'unitOfWork');
  record({ kind: 'check', id: 'unitOfWork' });
  lookUp('reading', 'identityMap');
  lookUp('nearby', 'unitOfWork');
  for (let visit = 0; visit < example.revisits; visit++) lookUp('reading', 'unitOfWork');
  session = startSession(example.maps);
  record({ kind: 'newSession' });
  lookUp('reading', 'unitOfWork');
  return steps;
}

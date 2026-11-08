import type { StudyParameters } from '@dotln-angular/models';

import { booleanParameter, numberParameter } from '../parameters';

/** The example's inputs: the ids of the two stored compositions, and how the import box saves. */
export interface ServiceLayerParameters {
  readonly flankId: number;
  readonly ridgeId: number;
  /** True when the import box writes storage with its own code instead of calling saveComposition. */
  readonly importBypasses: boolean;
  /** True when the exported composition the import box takes belongs to another scene. */
  readonly importForeign: boolean;
}

/** The three compositions the clients save, one row each in the drawing. */
export const drafts = ['night', 'dawn', 'river'] as const;
export type DraftName = (typeof drafts)[number];

/** Every composition of the example: two stored at the start, and the three the clients save. */
export type CompositionName = 'flank' | 'ridge' | DraftName;

/** The two tabs of the soldier scene open in one browser. */
export type TabId = 'a' | 'b';

/** The two kinds of client that save a composition. */
export type ClientKind = 'saveButton' | 'importBox';

/** A composition in the stored list, or in a tab's copy of it, with the id the domain gave it. */
export interface SavedComposition {
  readonly name: CompositionName;
  readonly id: number;
}

/** A composition a client holds before it is saved; an exported one may come from another scene. */
export interface Draft {
  readonly name: DraftName;
  readonly ownScene: boolean;
}

/** One client's request to save: from which tab, by which kind of client, and what. */
export interface SaveCall {
  readonly tab: TabId;
  readonly client: ClientKind;
  readonly draft: Draft;
}

/** What one tab's saveComposition holds from the domain's verdict until it announces the save. */
export interface PendingSave {
  readonly composition: SavedComposition;
  /** The stored list as the operation read it, which the write extends. */
  readonly read: readonly SavedComposition[];
}

/** Browser storage, the two tabs and the operations in progress, after one step. */
export interface ServiceLayerState {
  /** The list under the scene's storage key. */
  readonly stored: readonly SavedComposition[];
  /** How many times that list has been written. */
  readonly writes: number;
  /** The list each tab's saved panel shows: what the tab read when it opened, or was last told. */
  readonly listed: Readonly<Record<TabId, readonly SavedComposition[]>>;
  readonly pending: Readonly<Partial<Record<TabId, PendingSave>>>;
  /** The drafts the domain refused. */
  readonly refused: readonly DraftName[];
}

/** The domain's answer to a save: refused, or accepted with the id the composition takes. */
export type Verdict =
  | { readonly kind: 'accepted'; readonly composition: SavedComposition }
  | { readonly kind: 'refused' };

export interface CheckOperation {
  readonly kind: 'check';
  readonly call: SaveCall;
  /** The stored list the service read for this call. */
  readonly read: readonly SavedComposition[];
  readonly verdict: Verdict;
}

export interface WriteOperation {
  readonly kind: 'write' | 'announce';
  readonly call: SaveCall;
}

/** The import's own save, outside the service: the list it extended, and what storage lost. */
export interface DirectWriteOperation {
  readonly kind: 'writeDirect';
  readonly call: SaveCall;
  readonly held: readonly SavedComposition[];
  readonly lost: readonly CompositionName[];
}

export type ServiceOperation =
  { readonly kind: 'start' } | CheckOperation | WriteOperation | DirectWriteOperation;

/** One moment of the run: what happened, and storage and the tabs afterwards. */
export interface ServiceLayerStep {
  readonly operation: ServiceOperation;
  readonly state: ServiceLayerState;
}

/** Where a saved composition stands; null once storage has lost it. */
export type SaveStage = 'draft' | 'accepted' | 'stored' | 'announced' | 'refused';

export const readParameters = (parameters: StudyParameters): ServiceLayerParameters => ({
  flankId: numberParameter(parameters, 'flankId'),
  ridgeId: numberParameter(parameters, 'ridgeId'),
  importBypasses: booleanParameter(parameters, 'importBypasses'),
  importForeign: booleanParameter(parameters, 'importForeign'),
});

/** The highest id in a list, or 0 for an empty one. */
export const highestId = (list: readonly SavedComposition[]) =>
  Math.max(0, ...list.map(({ id }) => id));

/**
 * The domain's rules for a save. A composition from another scene is refused; an accepted one
 * takes the id one past the highest stored, so a gap in the ids is never filled again.
 */
export function check(draft: Draft, stored: readonly SavedComposition[]): Verdict {
  if (!draft.ownScene) return { kind: 'refused' };
  return { kind: 'accepted', composition: { name: draft.name, id: highestId(stored) + 1 } };
}

/** saveComposition's first part: read storage afresh, never the tab's own copy, and ask the domain. */
export function readAndCheck(
  state: ServiceLayerState,
  call: SaveCall,
): { readonly state: ServiceLayerState; readonly operation: CheckOperation } {
  const read = state.stored;
  const verdict = check(call.draft, read);
  const next =
    verdict.kind === 'refused'
      ? { ...state, refused: [...state.refused, call.draft.name] }
      : {
          ...state,
          pending: { ...state.pending, [call.tab]: { composition: verdict.composition, read } },
        };
  return { state: next, operation: { kind: 'check', call, read, verdict } };
}

function pendingOf(state: ServiceLayerState, call: SaveCall): PendingSave {
  const pending = state.pending[call.tab];
  if (!pending) throw new Error(`Tab ${call.tab} has no save in progress.`);
  return pending;
}

/** The one write: the list as read, plus the accepted composition, in a single setItem. */
export function writePending(state: ServiceLayerState, call: SaveCall): ServiceLayerStep {
  const { read, composition } = pendingOf(state, call);
  return {
    state: { ...state, stored: [...read, composition], writes: state.writes + 1 },
    operation: { kind: 'write', call },
  };
}

/** Only after the write are the tab's listeners told, once: its saved panel shows the new list. */
export function announce(state: ServiceLayerState, call: SaveCall): ServiceLayerStep {
  const { read, composition } = pendingOf(state, call);
  if (!state.stored.some(({ name }) => name === composition.name))
    throw new Error(`${composition.name} is announced before it is written.`);
  const { [call.tab]: _announced, ...others } = state.pending;
  return {
    state: {
      ...state,
      listed: { ...state.listed, [call.tab]: [...read, composition] },
      pending: others,
    },
    operation: { kind: 'announce', call },
  };
}

/**
 * The import box's own save code, which does not call saveComposition: it extends the list its tab
 * holds, gives the id from that list, asks no domain and tells no listener.
 */
export function writeDirect(state: ServiceLayerState, call: SaveCall): ServiceLayerStep {
  const held = state.listed[call.tab];
  const list = [...held, { name: call.draft.name, id: highestId(held) + 1 }];
  const lost = state.stored
    .filter(({ name }) => !list.some((kept) => kept.name === name))
    .map(({ name }) => name);
  return {
    state: { ...state, stored: list, writes: state.writes + 1 },
    operation: { kind: 'writeDirect', call, held, lost },
  };
}

/** The three requests of the example, in order: two Save buttons, then tab A's import box. */
export const saveCalls = (example: ServiceLayerParameters): readonly SaveCall[] => [
  { tab: 'a', client: 'saveButton', draft: { name: 'night', ownScene: true } },
  { tab: 'b', client: 'saveButton', draft: { name: 'dawn', ownScene: true } },
  {
    tab: 'a',
    client: 'importBox',
    draft: { name: 'river', ownScene: !example.importForeign },
  },
];

/** Both tabs open on the same stored list, with nothing saved yet. */
export function startState(example: ServiceLayerParameters): ServiceLayerState {
  const stored: readonly SavedComposition[] = [
    { name: 'flank', id: example.flankId },
    { name: 'ridge', id: example.ridgeId },
  ];
  return { stored, writes: 0, listed: { a: stored, b: stored }, pending: {}, refused: [] };
}

/**
 * The example as the clients run it: each request goes through saveComposition's check, write and
 * announcement in turn, except an import that bypasses the service and writes storage itself.
 */
export function serviceLayerRun(example: ServiceLayerParameters): readonly ServiceLayerStep[] {
  let state = startState(example);
  const steps: ServiceLayerStep[] = [{ operation: { kind: 'start' }, state }];
  const record = (step: ServiceLayerStep) => {
    state = step.state;
    steps.push(step);
  };
  for (const call of saveCalls(example)) {
    if (call.client === 'importBox' && example.importBypasses) {
      record(writeDirect(state, call));
      continue;
    }
    const checked = readAndCheck(state, call);
    record(checked);
    if (checked.operation.verdict.kind === 'refused') continue;
    record(writePending(state, call));
    record(announce(state, call));
  }
  return steps;
}

/** Where a draft stands after a step: listed and stored is announced; listed but not stored is lost. */
export function stageOf(state: ServiceLayerState, name: DraftName): SaveStage | null {
  if (state.refused.includes(name)) return 'refused';
  const stored = state.stored.some((each) => each.name === name);
  const listed = Object.values(state.listed).some((list) =>
    list.some((each) => each.name === name),
  );
  if (stored) return listed ? 'announced' : 'stored';
  if (Object.values(state.pending).some((pending) => pending?.composition.name === name))
    return 'accepted';
  return listed ? null : 'draft';
}

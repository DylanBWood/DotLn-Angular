import type { StudyParameters } from '@dotln-angular/models';

import { booleanParameter, numberParameter } from '../parameters';

/** The example's inputs: the numbers of the two stored keys, and whether a save reads storage first. */
export interface IdentityFieldParameters {
  readonly keyFlank: number;
  readonly keyRidge: number;
  /** True when each save reads the stored list again before choosing, as the scene's save does. */
  readonly rereads: boolean;
}

/** The four compositions of the example, by id. */
export const compositions = ['flank', 'ridge', 'dawn', 'night'] as const;
export type CompositionId = (typeof compositions)[number];

/** The two tabs open on the scene: the one the reader watches, and another. */
export const tabs = ['here', 'other'] as const;
export type TabId = (typeof tabs)[number];

/** A composition in a list with the number of its key, which the scene writes as `composition-<number>`. */
export interface KeyedComposition {
  readonly id: CompositionId;
  readonly key: number;
}

/** One tab: the list it holds, and the compositions made there but not yet saved, which have no key. */
export interface Tab {
  readonly list: readonly KeyedComposition[];
  readonly drafts: readonly CompositionId[];
}

/** Browser storage's list, and the two tabs that read and write it. */
export interface Scene {
  readonly storage: readonly KeyedComposition[];
  readonly tabs: Readonly<Record<TabId, Tab>>;
}

/** What one save did: the scene afterwards, the list it chose from and the key it took. */
export interface Saved {
  readonly scene: Scene;
  readonly read: readonly KeyedComposition[];
  readonly key: number;
}

export type IdentityFieldOperation =
  | { readonly kind: 'start' }
  | {
      readonly kind: 'compose';
      readonly made: readonly { readonly tab: TabId; readonly id: CompositionId }[];
    }
  | {
      readonly kind: 'save';
      readonly tab: TabId;
      readonly id: CompositionId;
      readonly reread: boolean;
      readonly read: readonly KeyedComposition[];
      readonly key: number;
    }
  | {
      readonly kind: 'open';
      readonly tab: TabId;
      readonly key: number;
      readonly found: CompositionId | null;
    };

/** One moment of the run: what happened, and the storage and tabs afterwards. */
export interface IdentityFieldStep {
  readonly operation: IdentityFieldOperation;
  readonly scene: Scene;
}

export const readParameters = (parameters: StudyParameters): IdentityFieldParameters => ({
  keyFlank: numberParameter(parameters, 'keyFlank'),
  keyRidge: numberParameter(parameters, 'keyRidge'),
  rereads: booleanParameter(parameters, 'rereads'),
});

const withTab = (scene: Scene, tab: TabId, change: Tab): Scene => ({
  ...scene,
  tabs: { ...scene.tabs, [tab]: change },
});

/** A composition just made: the tab holds it, with no key, until it is saved. */
export const compose = (scene: Scene, tab: TabId, id: CompositionId): Scene =>
  withTab(scene, tab, { ...scene.tabs[tab], drafts: [...scene.tabs[tab].drafts, id] });

/** The highest key number in a list, or 0 for an empty one. */
export const highestKey = (list: readonly KeyedComposition[]): number =>
  Math.max(0, ...list.map(({ key }) => key));

/** One past the highest key number in a list, as the scene chooses its next key. */
export const nextKey = (list: readonly KeyedComposition[]): number => highestKey(list) + 1;

/**
 * Saves a draft: it reads storage again first when asked, or else uses the list its tab holds,
 * takes the next key from that list, stores the key with the composition and writes the whole
 * list back, as the scene's save does, so storage then holds exactly that tab's list.
 */
export function save(scene: Scene, tab: TabId, id: CompositionId, reread: boolean): Saved {
  const held = scene.tabs[tab];
  if (!held.drafts.includes(id)) throw new Error(`${id} is not a draft of that tab.`);
  const read = reread ? scene.storage : held.list;
  const key = nextKey(read);
  const list = [...read, { id, key }];
  const drafts = held.drafts.filter((each) => each !== id);
  return { scene: { ...withTab(scene, tab, { list, drafts }), storage: list }, read, key };
}

/** Opening by key in a tab finds the first composition in its list with that key, or none. */
export const open = (scene: Scene, tab: TabId, key: number): CompositionId | null =>
  scene.tabs[tab].list.find((each) => each.key === key)?.id ?? null;

/** Every composition each list holds with its key, storage first, each pair once. */
function pairsIn(scene: Scene): readonly KeyedComposition[] {
  const all = [...scene.storage, ...tabs.flatMap((tab) => scene.tabs[tab].list)];
  return all.filter(
    (pair, index) => all.findIndex(({ id, key }) => id === pair.id && key === pair.key) === index,
  );
}

/** The key a composition holds, wherever it is kept; null for a draft or one not made yet. */
export const keyOf = (scene: Scene, id: CompositionId): number | null =>
  pairsIn(scene).find((pair) => pair.id === id)?.key ?? null;

/** The other compositions that hold the same key as this one, anywhere. */
export function sharersOf(scene: Scene, id: CompositionId): readonly CompositionId[] {
  const key = keyOf(scene, id);
  if (key === null) return [];
  const others = pairsIn(scene).filter((pair) => pair.key === key && pair.id !== id);
  return compositions.filter((each) => others.some((pair) => pair.id === each));
}

/** How many keys two or more compositions hold at once. */
export function collisionsIn(scene: Scene): number {
  const keys = pairsIn(scene).map(({ key }) => key);
  return new Set(keys.filter((key, index) => keys.indexOf(key) !== index)).size;
}

/** Whether storage still holds a composition. */
export const isStored = (scene: Scene, id: CompositionId): boolean =>
  scene.storage.some((each) => each.id === id);

/**
 * The example as the two tabs run it: both read the stored list, each composes one composition,
 * the other tab saves first, then this tab, and each tab opens the key the first save chose.
 */
export function identityFieldRun(example: IdentityFieldParameters): readonly IdentityFieldStep[] {
  if (example.keyFlank === example.keyRidge) throw new Error('The stored keys must differ.');
  const stored: readonly KeyedComposition[] = [
    { id: 'flank', key: example.keyFlank },
    { id: 'ridge', key: example.keyRidge },
  ];
  let scene: Scene = {
    storage: stored,
    tabs: { here: { list: stored, drafts: [] }, other: { list: stored, drafts: [] } },
  };
  const steps: IdentityFieldStep[] = [{ operation: { kind: 'start' }, scene }];
  scene = compose(compose(scene, 'other', 'dawn'), 'here', 'night');
  const made = [
    { tab: 'other', id: 'dawn' },
    { tab: 'here', id: 'night' },
  ] as const;
  steps.push({ operation: { kind: 'compose', made }, scene });
  const saveDraft = (tab: TabId, id: CompositionId): number => {
    const reread = example.rereads;
    const { scene: after, read, key } = save(scene, tab, id, reread);
    scene = after;
    steps.push({ operation: { kind: 'save', tab, id, reread, read, key }, scene });
    return key;
  };
  const dawnKey = saveDraft('other', 'dawn');
  saveDraft('here', 'night');
  for (const tab of tabs)
    steps.push({
      operation: { kind: 'open', tab, key: dawnKey, found: open(scene, tab, dawnKey) },
      scene,
    });
  return steps;
}

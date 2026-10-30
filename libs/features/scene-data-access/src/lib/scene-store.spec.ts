import { TestBed } from '@angular/core/testing';
import { Dispatcher } from '@ngrx/signals/events';

import { scenePageEvents } from '@dotln-angular/events';
import type { Composition, Trial } from '@dotln-angular/scene-engine';

import { provideSceneStoreTestKit } from '../../testing/src';
import { SceneStore } from './scene-store';
import { encodeExport, isComposition, parseExport, restoreStoredScene } from './stored-scene';

const key = 'dotln-angular.scene';

const step = { at: 3, toolId: 'aifg-a:145', kind: 'steer.blend', selection: ['a'], params: {} };

const composition: Composition = {
  id: 'composition-1',
  title: 'Flocking',
  sceneId: 'the-twenty',
  seed: 1,
  steps: [step],
  note: 'pulls together',
  trials: [],
};

const trial: Trial = {
  id: 'trial-1',
  sceneId: 'the-twenty',
  seed: 1,
  from: 0,
  frames: 10,
  sampleEvery: 5,
  focus: ['a'],
  branchA: { label: 'before', steps: [] },
  branchB: { label: 'after', steps: [step] },
  metrics: {
    cohesionRadius: { a: [1], b: [2] },
    collisions: { a: [0], b: [0] },
    headingVariance: { a: [0], b: [0] },
    timeToObjective: { a: [null], b: [null] },
    stalledUnits: { a: [0], b: [0] },
    anchorToMean: { a: [null], b: [null] },
    slotError: { a: [null], b: [null] },
    assignmentCost: { a: [null], b: [null] },
  },
  firstDivergenceFrame: 4,
};

function setUp(stored?: string) {
  const kit = provideSceneStoreTestKit();
  if (stored !== undefined) kit.values.set(key, stored);
  TestBed.configureTestingModule({ providers: [...kit.providers] });
  const store = TestBed.inject(SceneStore);
  TestBed.tick();
  return { kit, store, dispatcher: TestBed.inject(Dispatcher) };
}

describe('SceneStore persistence', () => {
  it('writes nothing until the operator saves', () => {
    const { kit, dispatcher } = setUp();
    dispatcher.dispatch(scenePageEvents.stepApplied(step));
    dispatcher.dispatch(scenePageEvents.noteChanged('a thought'));
    TestBed.tick();
    expect(kit.writes).toEqual([]);
  });

  it('persists a saved composition under its own key and nowhere else', () => {
    const { kit, dispatcher } = setUp();
    dispatcher.dispatch(scenePageEvents.compositionSaved(composition));
    TestBed.tick();
    expect(kit.writes.length).toBeGreaterThan(0);
    for (const { key: written } of kit.writes) expect(written.startsWith(key)).toBe(true);
    expect(JSON.parse(kit.values.get(key) ?? '')).toEqual({
      version: 1,
      compositions: [composition],
    });
  });

  it('finds a saved composition again on the next load', () => {
    const { store } = setUp(JSON.stringify({ version: 1, compositions: [composition] }));
    expect(store.compositions()).toEqual([composition]);
    expect(store.storedIgnored()).toBe(false);
  });

  it.each([
    ['does not parse', '{not json'],
    ['has an older shape', JSON.stringify({ compositions: [{ name: 'old' }] })],
    ['has a future version', JSON.stringify({ version: 2, compositions: [] })],
    ['holds a broken composition', JSON.stringify({ version: 1, compositions: [{ id: 'x' }] })],
  ])('ignores a stored value that %s and never rewrites it', (_label, stored) => {
    const { kit, store, dispatcher } = setUp(stored);
    expect(store.compositions()).toEqual([]);
    expect(store.storedIgnored()).toBe(true);
    dispatcher.dispatch(scenePageEvents.stepApplied(step));
    TestBed.tick();
    expect(kit.writes).toEqual([]);
    expect(kit.values.get(key)).toBe(stored);
  });

  it('writes once for a save, and not again for what follows it', () => {
    const { kit, dispatcher } = setUp();
    dispatcher.dispatch(scenePageEvents.compositionSaved(composition));
    TestBed.tick();
    expect(kit.writes).toHaveLength(1);
    dispatcher.dispatch(scenePageEvents.stepApplied(step));
    dispatcher.dispatch(scenePageEvents.noteChanged('a thought'));
    TestBed.tick();
    expect(kit.writes).toHaveLength(1);
  });

  it('keeps what another tab saved when it reads storage before saving', () => {
    const { kit, store, dispatcher } = setUp();
    const theirs = { ...composition, id: 'composition-1', title: 'Theirs' };
    kit.values.set(key, JSON.stringify({ version: 1, compositions: [theirs] }));
    store.readFromStorage();
    dispatcher.dispatch(scenePageEvents.compositionSaved({ ...composition, id: 'composition-2' }));
    TestBed.tick();
    const stored = restoreStoredScene(JSON.parse(kit.values.get(key) ?? ''));
    expect(stored?.compositions.map(({ id }) => id)).toEqual(['composition-1', 'composition-2']);
  });

  it('keeps the compositions it can read when one is broken, and says so', () => {
    const stored = { version: 1, compositions: [composition, { id: 'x' }] };
    const { kit, store } = setUp(JSON.stringify(stored));
    expect(store.compositions()).toEqual([composition]);
    expect(store.storedIgnored()).toBe(true);
    expect(kit.writes).toEqual([]);
  });

  it('says so when a save does not reach storage, and clears that on the next', () => {
    let full = true;
    const values = new Map<string, string>();
    const storage = {
      getItem: (name: string) => values.get(name) ?? null,
      setItem: (name: string, value: string) => {
        if (full) throw new Error('quota');
        values.set(name, value);
      },
      removeItem: (name: string) => {
        values.delete(name);
      },
    };
    const kit = provideSceneStoreTestKit(storage);
    TestBed.configureTestingModule({ providers: [...kit.providers] });
    const store = TestBed.inject(SceneStore);
    const dispatcher = TestBed.inject(Dispatcher);
    TestBed.tick();
    dispatcher.dispatch(scenePageEvents.compositionSaved(composition));
    TestBed.tick();
    expect(store.compositions()).toEqual([composition]);
    expect(store.saveFailed()).toBe(true);
    full = false;
    dispatcher.dispatch(scenePageEvents.compositionSaved({ ...composition, id: 'composition-2' }));
    TestBed.tick();
    expect(store.saveFailed()).toBe(false);
  });

  it('replaces an ignored value only when the operator saves', () => {
    const { kit, store, dispatcher } = setUp('{not json');
    dispatcher.dispatch(scenePageEvents.compositionSaved(composition));
    TestBed.tick();
    expect(store.storedIgnored()).toBe(false);
    expect(restoreStoredScene(JSON.parse(kit.values.get(key) ?? ''))?.compositions).toEqual([
      composition,
    ]);
  });
});

describe('SceneStore state', () => {
  it('appends steps and forks where the branch stands', () => {
    const { store, dispatcher } = setUp();
    dispatcher.dispatch(scenePageEvents.stepApplied(step));
    dispatcher.dispatch(scenePageEvents.branchForked());
    dispatcher.dispatch(scenePageEvents.stepApplied({ ...step, at: 9 }));
    expect(store.steps()).toHaveLength(2);
    expect(store.forkIndex()).toBe(1);
  });

  it('keeps a compared trial, and closing one discards it', () => {
    const { store, dispatcher } = setUp();
    dispatcher.dispatch(scenePageEvents.trialCompared(trial));
    expect(store.trial()).toEqual(trial);
    dispatcher.dispatch(scenePageEvents.trialKept());
    expect(store.trial()).toBeNull();
    expect(store.keptTrials()).toEqual([trial]);
    dispatcher.dispatch(scenePageEvents.trialCompared(trial));
    dispatcher.dispatch(scenePageEvents.trialClosed());
    expect(store.keptTrials()).toEqual([trial]);
  });

  it('opens a composition into the live branch', () => {
    const { store, dispatcher } = setUp();
    dispatcher.dispatch(scenePageEvents.compositionOpened({ ...composition, trials: [trial] }));
    expect(store.steps()).toEqual(composition.steps);
    expect(store.note()).toBe('pulls together');
    expect(store.keptTrials()).toEqual([trial]);
  });

  it('clears the live branch on reset and leaves saved compositions alone', () => {
    const { store, dispatcher } = setUp();
    dispatcher.dispatch(scenePageEvents.compositionSaved(composition));
    dispatcher.dispatch(scenePageEvents.stepApplied(step));
    dispatcher.dispatch(scenePageEvents.noteChanged('gone next'));
    dispatcher.dispatch(scenePageEvents.runReset());
    expect(store.steps()).toEqual([]);
    expect(store.note()).toBe('');
    expect(store.compositions()).toEqual([composition]);
  });
});

describe('composition validation', () => {
  it('accepts a composition carrying a kept trial', () => {
    expect(isComposition({ ...composition, trials: [trial] })).toBe(true);
  });

  it('refuses a step with no tool, and a trial missing a metric', () => {
    expect(isComposition({ ...composition, steps: [{ ...step, toolId: '' }] })).toBe(false);
    const { metrics } = trial;
    const incomplete = { ...metrics, slotError: undefined };
    expect(isComposition({ ...composition, trials: [{ ...trial, metrics: incomplete }] })).toBe(
      false,
    );
  });

  it.each([
    ['a weight past what the engine can multiply', { 'seek-weight': 1e300 }],
    ['a time to target of nothing', { 'time-to-target': 0 }],
    ['an infinite spacing', { 'slot-spacing': Infinity }],
    ['a value that is not a number', { 'seek-weight': Number.NaN }],
    ['a lag limit below nothing', { 'anchor-lag-limit': -1 }],
  ])('refuses %s', (_label, params) => {
    expect(isComposition({ ...composition, steps: [{ ...step, params }] })).toBe(false);
  });

  it('refuses a step past the last frame a comparison will run to, not one an hour in', () => {
    expect(isComposition({ ...composition, steps: [{ ...step, at: 1_000_000_000 }] })).toBe(false);
    expect(isComposition({ ...composition, steps: [{ ...step, at: 216_001 }] })).toBe(true);
  });
});

describe('export and import', () => {
  it('reads back what it wrote', () => {
    expect(parseExport(encodeExport(composition), composition.sceneId)).toEqual(composition);
  });

  it.each([
    ['text that is not JSON', 'not json'],
    ['a value with no schema', JSON.stringify({ composition })],
    [
      'a composition that is not one',
      encodeExport({ ...composition, steps: [{ id: 'x' }] } as never),
    ],
    ['a number too large to hold', encodeExport(composition).replace('"seed":1', '"seed":1e999')],
  ])('refuses %s', (_label, text) => {
    expect(parseExport(text, composition.sceneId)).toBeNull();
  });

  it('refuses a composition of another scene', () => {
    expect(parseExport(encodeExport(composition), 'another-scene')).toBeNull();
  });
});

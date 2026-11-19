import { TestBed } from '@angular/core/testing';
import { Dispatcher } from '@ngrx/signals/events';

import { scenePageEvents } from '@dotln-angular/events';
import type { Composition, Trial } from '@dotln-angular/scene-engine';
import { runBranch } from '@dotln-angular/scene-engine';
import { createTestScene, createTestUnit } from '@dotln-angular/scene-engine/testing';

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

// The eight series a kept trial carried before the route metrics were added.
const firstSeries = {
  cohesionRadius: { a: [1, 1.5], b: [2, 1] },
  collisions: { a: [0, 0], b: [0, 0] },
  headingVariance: { a: [0, 0], b: [0, 0] },
  timeToObjective: { a: [null, null], b: [null, null] },
  stalledUnits: { a: [0, 0], b: [0, 0] },
  anchorToMean: { a: [null, null], b: [null, null] },
  slotError: { a: [null, null], b: [null, null] },
  assignmentCost: { a: [null, null], b: [null, null] },
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
    ...firstSeries,
    pathLength: { a: [12, 10], b: [null, null] },
    replans: { a: [0, 1], b: [0, 0] },
    blockedUnits: { a: [0, 0], b: [0, 0] },
    shots: { a: [0, 2], b: [0, 2] },
    hits: { a: [0, 0], b: [0, 1] },
    accuracy: { a: [null, 0], b: [null, 0.5] },
    downUnits: { a: [0, 0], b: [0, 0] },
  },
  firstDivergenceFrame: 4,
};

// A trial kept before a metric existed, as browser storage and an export still hold it.
const olderTrial = { ...trial, metrics: firstSeries };

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

  it('reads a kept trial saved before the route metrics with each of them as a series of nulls', () => {
    const older = { ...composition, trials: [olderTrial] };
    const restored = restoreStoredScene({ version: 1, compositions: [older] });
    expect(restored?.complete).toBe(true);
    const { metrics } = restored?.compositions[0].trials[0] ?? trial;
    expect(metrics.pathLength).toEqual({ a: [null, null], b: [null, null] });
    expect(metrics.replans).toEqual({ a: [null, null], b: [null, null] });
    expect(metrics.blockedUnits).toEqual({ a: [null, null], b: [null, null] });
    expect(metrics.cohesionRadius).toEqual(firstSeries.cohesionRadius);
  });

  it('still refuses a trial missing one of the first eight, or holding a series that is not one', () => {
    const { slotError: _missing, ...seven } = firstSeries;
    expect(isComposition({ ...composition, trials: [{ ...olderTrial, metrics: seven }] })).toBe(
      false,
    );
    const worded = { ...trial.metrics, pathLength: { a: ['far'], b: [null] } };
    expect(isComposition({ ...composition, trials: [{ ...trial, metrics: worded }] })).toBe(false);
  });

  it('refuses a step past the last frame a comparison will run to, not one an hour in', () => {
    expect(isComposition({ ...composition, steps: [{ ...step, at: 1_000_000_000 }] })).toBe(false);
    expect(isComposition({ ...composition, steps: [{ ...step, at: 216_001 }] })).toBe(true);
  });
});

describe('export and import', () => {
  it('restores and imports a routed trial from before the shot series existed', () => {
    const {
      shots: _shots,
      hits: _hits,
      accuracy: _accuracy,
      downUnits: _down,
      ...previous
    } = trial.metrics;
    const saved = { ...composition, trials: [{ ...trial, metrics: previous }] };
    const restored = restoreStoredScene({ version: 1, compositions: [saved] })?.compositions[0];
    const imported = parseExport(
      JSON.stringify({ schema: 'scene-composition-v0', composition: saved }),
      composition.sceneId,
    );
    for (const value of [restored, imported]) {
      const series = value?.trials[0].metrics;
      for (const name of ['shots', 'hits', 'accuracy', 'downUnits'] as const)
        expect(series?.[name]).toEqual({ a: [null, null], b: [null, null] });
      expect(series?.pathLength).toEqual(previous.pathLength);
    }
  });

  it('keeps the marked roster entry and plays a fire step at its recorded tick', () => {
    const fire = {
      at: 4,
      toolId: 'aifg-a:161',
      kind: 'combat.fire',
      selection: ['a'],
      params: { target: 2 },
    };
    const reopened = parseExport(
      encodeExport({ ...composition, steps: [fire] }),
      composition.sceneId,
    );
    expect(reopened?.steps).toEqual([fire]);
    const board = createTestScene([
      createTestUnit('a', { position: { x: 10, y: 10 } }),
      createTestUnit('b', { position: { x: 20, y: 10 } }),
    ]);
    const frames = runBranch(board, reopened?.steps ?? [], 5);
    expect(frames[4].bullets).toHaveLength(0);
    expect(frames[5].bullets[0].owner).toBe('a');
  });
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

  it('imports a composition whose kept trial was saved before the route metrics', () => {
    const older = { ...composition, trials: [olderTrial] } as unknown as Composition;
    const imported = parseExport(encodeExport(older), composition.sceneId);
    expect(imported?.trials[0].metrics.replans).toEqual({ a: [null, null], b: [null, null] });
  });

  it('imports a composition carrying field steps and replays them as written', () => {
    const wall = {
      at: 12,
      toolId: 'field.wall',
      kind: 'field.wall',
      selection: [],
      params: { x1: 40, y1: 0, x2: 40, y2: 50, thickness: 1, shape: 1 },
    };
    const walled = { ...composition, steps: [wall, step] };
    expect(parseExport(encodeExport(walled), composition.sceneId)?.steps).toEqual([wall, step]);
  });
});

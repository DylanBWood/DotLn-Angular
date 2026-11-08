import { loadModelStudy, studyTranslate, tokensOf } from '../../../../testing/src';
import { codeBlocks, fillValues } from '../study-text';
import {
  commit,
  type CompositionStore,
  load,
  model,
  readParameters,
  registerDirty,
  registerNew,
  registerRemoved,
  unitOfWorkRun,
} from './unit-of-work.model';

const record = await loadModelStudy('poeaa:246', 'states');
const parameters = record.example.parameters;
const example = { versionFlank: 3, versionRidge: 5, renames: 2, otherTabSaves: false };

const stored = (): CompositionStore => ({
  rows: { flank: { edits: 0, version: 3 }, ridge: { edits: 0, version: 5 } },
  calls: 0,
});

it('runs the example the record names, from the record’s own parameters', () => {
  expect(parameters).toEqual({ ...example, otherTabSaves: 0 });
  expect(readParameters(parameters)).toEqual(example);
  expect(record.pseudocode.executable?.module).toBe(record.visual.model);
  expect(codeBlocks(record.pseudocode.ordinary)).toHaveLength(record.mechanism.steps.length);
});

it('registers a change once, however often it is made, and writes nothing before the commit', () => {
  let unit = load(stored(), ['flank', 'ridge']);
  unit = registerNew(unit, 'night');
  unit = registerDirty(unit, 'ridge');
  unit = registerDirty(unit, 'ridge');
  unit = registerRemoved(unit, 'flank');
  expect(unit.newObjects).toEqual(['night']);
  expect(unit.dirty).toEqual(['ridge']);
  expect(unit.removed).toEqual(['flank']);
  // A new object deleted before the commit is forgotten, never inserted.
  const forgotten = registerRemoved(registerNew(load(stored(), []), 'night'), 'night');
  expect(forgotten.newObjects).toEqual([]);
  expect(forgotten.removed).toEqual([]);
  expect(forgotten.objects.night).toBeUndefined();
});

it('writes every registered change in one call, then empties the registers', () => {
  const steps = unitOfWorkRun(example);
  const last = steps[steps.length - 1];
  expect(last.operation).toEqual({
    kind: 'commit',
    result: { inserts: ['night'], updates: ['ridge'], deletes: ['flank'], conflict: null },
  });
  expect(last.store.calls).toBe(1);
  expect(last.store.rows).toEqual({
    ridge: { edits: 2, version: 6 },
    night: { edits: 0, version: 1 },
  });
  expect([last.unit.newObjects, last.unit.dirty, last.unit.removed]).toEqual([[], [], []]);
  // Writing each change at once: one insert, two updates and one delete, four calls in all.
  expect(last.immediateCalls).toBe(4);
  expect(steps.slice(0, -1).every(({ store }) => store.calls === 0)).toBe(true);
});

it('refuses the whole commit when another tab saved a changed object first', () => {
  const steps = unitOfWorkRun({ ...example, otherTabSaves: true });
  const rival = steps[steps.length - 2];
  const last = steps[steps.length - 1];
  expect(rival.operation).toEqual({ kind: 'otherSave', id: 'ridge' });
  expect(last.operation).toMatchObject({ kind: 'commit', result: { conflict: 'ridge' } });
  // The call is made and rolled back: the store keeps the rival's version, and nothing of ours.
  expect(last.store.rows).toEqual(rival.store.rows);
  expect(last.store.rows.ridge?.version).toBe(6);
  expect(last.unit).toEqual(rival.unit);
  const direct = commit(rival.unit, rival.store);
  expect(direct.store.rows).toEqual(rival.store.rows);
});

it('draws each object in its register and names every register in the text equivalent', () => {
  const run = model(parameters, studyTranslate);
  const frames = run.states.frames;
  expect(frames).toHaveLength(6);
  const at = (step: number) =>
    Object.fromEntries(frames[step].placements.map(({ object, node }) => [object, node]));
  expect(at(0)).toEqual({ flank: 'clean', ridge: 'clean' });
  expect(at(1)).toEqual({ flank: 'clean', ridge: 'clean', night: 'new' });
  expect(at(4)).toEqual({ flank: 'removed', ridge: 'dirty', night: 'new' });
  expect(at(5)).toEqual({ ridge: 'clean', night: 'clean' });
  // The second rename leaves the registers as they were: a loop back into Dirty.
  expect(frames[3].moves).toEqual([
    { object: 'ridge', from: 'dirty', to: 'dirty', transition: 'registerDirtyAgain' },
  ]);
  expect(frames[5].moves.map(({ object, transition }) => [object, transition])).toEqual([
    ['flank', 'commitDelete'],
    ['ridge', 'commitUpdate'],
    ['night', 'commitInsert'],
  ]);
  expect(fillValues(record.visual.textEquivalent, frames[4].values)).toBe(
    'Step 4: Flank left moves from Clean to Removed by registerRemoved. Where each composition stands: Clean: none; New: Night march; Dirty: Hold the ridge; Removed: Flank left. Store calls so far: 0.',
  );
  expect(frames[5].values['calls']).toBe('1');
  expect(frames[5].note).toBe(
    'The save commits once: a single call carries insert Night march, update Hold the ridge, delete Flank left, and every register is empty again.',
  );
});

it('keeps the drawing’s rows and notes in step with the run, including a refused commit', () => {
  const refused = model({ ...parameters, otherTabSaves: 1 }, studyTranslate);
  const last = refused.states.frames[refused.states.frames.length - 1];
  expect(last.moves).toEqual([]);
  expect(last.note).toContain('rolled back');
  expect(last.placements.find(({ object }) => object === 'ridge')?.note).toBe(
    'holds version 5; the store has 6',
  );
  // The refused commit leaves all three compositions where they were, under their token letters.
  const keys = tokensOf(refused.states);
  expect(last.placements.map(({ object }) => keys[object])).toEqual(['F', 'R', 'N']);
  // With no renames, nothing becomes dirty and the commit sends no update.
  const untouched = unitOfWorkRun({ ...example, renames: 0 });
  expect(untouched[untouched.length - 1].operation).toMatchObject({
    result: { updates: [], conflict: null },
  });
});

it('compares one commit with a call for every change, and names the moments in order', () => {
  const run = model(parameters, studyTranslate);
  const [unit, immediate] = run.comparison?.timeline.series ?? [];
  expect(unit.values).toEqual([0, 0, 0, 0, 0, 1]);
  expect(immediate.values).toEqual([0, 1, 2, 3, 4, 4]);
  expect(run.moments.map(({ label, step }) => [label, step])).toEqual([
    ['New', 1],
    ['Dirty', 2],
    ['Removed', 4],
    ['Commit', 5],
  ]);
  expect(run.comparison?.findings[0]).toBe(
    'By the save, writing at once has made 4 calls; the unit of work has made 1.',
  );
});

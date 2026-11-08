import { loadStatesStudy, studyTranslate } from '../../../../testing/src';
import { registerDrawing } from '../../composites/study-visuals/states/states-register';
import { codeBlocks, fillValues } from '../study-text';
import {
  dataMapperRun,
  emptyMapper,
  find,
  model,
  rename,
  saveAll,
  storedLibrary,
  update,
} from './data-mapper.model';

const record = await loadStatesStudy('poeaa:240');
const parameters = record.example.parameters;
const example = {
  stepsFlank: 4,
  stepsRidge: 6,
  stepsDawn: 3,
  formatRead: 1,
  formatDawn: 2,
  eachRow: 1,
};

it('runs the example the record names, from the record’s own parameters', () => {
  expect(parameters).toEqual(example);
  expect(record.pseudocode.executable?.module).toBe(record.visual.model);
  expect(codeBlocks(record.pseudocode.ordinary)).toHaveLength(record.mechanism.steps.length);
});

it('maps a readable row once, hands back the same object on a second find, and maps no unreadable row', () => {
  const storage = storedLibrary(example);
  const first = find(emptyMapper, storage, 'ridge', example.formatRead);
  expect(first).toMatchObject({ fromMap: false, object: { steps: 6, renames: 0 } });
  expect(first.mapper.reads).toBe(1);
  const again = find(first.mapper, storage, 'ridge', example.formatRead);
  expect(again.fromMap).toBe(true);
  expect(again.object).toBe(first.object);
  expect(again.mapper.reads).toBe(1);
  const dawn = find(again.mapper, storage, 'dawn', example.formatRead);
  expect(dawn.object).toBeNull();
  expect(dawn.mapper.unmapped).toEqual(['dawn']);
  expect(dawn.mapper.identityMap.dawn).toBeUndefined();
  expect(dawn.mapper.reads).toBe(2);
});

it('changes the object without touching storage, then writes only that object’s row', () => {
  const storage = storedLibrary(example);
  let mapper = emptyMapper;
  for (const id of ['flank', 'ridge', 'dawn'] as const)
    mapper = find(mapper, storage, id, example.formatRead).mapper;
  mapper = rename(mapper, 'ridge');
  expect(mapper.identityMap.ridge?.renames).toBe(1);
  expect(storage.rows.ridge?.renames).toBe(0);
  const written = update(mapper, storage, 'ridge', example.formatRead);
  expect(written.writes).toBe(1);
  expect(written.rows.ridge).toEqual({ format: 1, steps: 6, renames: 1 });
  // Flank left's and Dawn patrol's rows are the very rows that were there before.
  expect(written.rows.flank).toBe(storage.rows.flank);
  expect(written.rows.dawn).toBe(storage.rows.dawn);
});

it('keeps the unreadable row through a save of each row, and loses it to a save of the whole library', () => {
  const steps = dataMapperRun(example);
  const last = steps[steps.length - 1];
  expect(steps.map(({ operation }) => operation.kind)).toEqual([
    'start',
    'load',
    'load',
    'load',
    'find',
    'rename',
    'update',
  ]);
  expect(last.storage.rows.dawn).toEqual({ format: 2, steps: 3, renames: 0 });
  expect(Object.keys(last.storage.rows)).toHaveLength(3);
  expect(last.mapper.reads).toBe(3);
  // Nothing is written before the save.
  expect(steps.slice(0, -1).every(({ storage }) => storage.writes === 0)).toBe(true);

  const whole = dataMapperRun({ ...example, eachRow: 0 });
  const saved = whole[whole.length - 1];
  expect(saved.operation).toEqual({
    kind: 'saveAll',
    written: ['flank', 'ridge'],
    dropped: ['dawn'],
  });
  expect(saved.storage.rows.dawn).toBeUndefined();
  expect(saved.storage.writes).toBe(1);
  // The same mapper saving the whole library directly: one write, Dawn patrol left out.
  const before = whole[whole.length - 2];
  expect(saveAll(before.mapper, before.storage, example.formatRead)).toEqual({
    storage: saved.storage,
    written: ['flank', 'ridge'],
    dropped: ['dawn'],
  });
  // When every row is readable, the whole-library save has nothing to lose.
  const allReadable = dataMapperRun({ ...example, eachRow: 0, formatDawn: 1 });
  expect(allReadable[allReadable.length - 1].operation).toMatchObject({ dropped: [] });
  expect(Object.keys(allReadable[allReadable.length - 1].storage.rows)).toHaveLength(3);
});

it('draws each composition in its place and names every place in the text equivalent', () => {
  const run = model(parameters, studyTranslate);
  const frames = run.states.frames;
  expect(frames).toHaveLength(7);
  const at = (step: number) =>
    Object.fromEntries(frames[step].placements.map(({ object, node }) => [object, node]));
  expect(at(0)).toEqual({ flank: 'stored', ridge: 'stored', dawn: 'stored' });
  expect(at(3)).toEqual({ flank: 'mapped', ridge: 'mapped', dawn: 'unmapped' });
  expect(at(5)).toEqual({ flank: 'mapped', ridge: 'edited', dawn: 'unmapped' });
  expect(at(6)).toEqual({ flank: 'mapped', ridge: 'mapped', dawn: 'unmapped' });
  // The second find is a loop back into Mapped: the identity map answers, and no row is read.
  expect(frames[4].moves).toEqual([
    { object: 'ridge', from: 'mapped', to: 'mapped', transition: 'find' },
  ]);
  expect(frames[4].values['reads']).toBe('3');
  expect(frames[6].moves).toEqual([
    { object: 'ridge', from: 'edited', to: 'mapped', transition: 'update' },
  ]);
  expect(fillValues(record.visual.textEquivalent, frames[3].values)).toBe(
    'Step 3: Dawn patrol moves from Row only to Unmapped by load. Where each composition stands: Row only: none; Mapped: Flank left, Hold the ridge; Edited: none; Unmapped: Dawn patrol. Rows read 3; writes to storage 0; rows in storage 3.',
  );
  expect(frames[3].placements.find(({ object }) => object === 'dawn')?.note).toBe(
    'row in format 2; this build reads 1',
  );
});

it('draws the whole-library save writing Dawn patrol out of storage', () => {
  const whole = model({ ...parameters, eachRow: 0 }, studyTranslate);
  const last = whole.states.frames[whole.states.frames.length - 1];
  expect(last.moves.map(({ object, transition }) => [object, transition])).toEqual([
    ['flank', 'saveAllRewrite'],
    ['ridge', 'saveAllUpdate'],
    ['dawn', 'saveAllDrop'],
  ]);
  expect(last.placements.map(({ object }) => object)).toEqual(['flank', 'ridge']);
  expect(last.values['rows']).toBe('2');
  expect(last.note).toBe(
    'The save writes the whole library as one value, built from the objects in the identity map: Flank left, Hold the ridge. Dawn patrol has no object, so its row is not in the value, and storage no longer has it.',
  );
  const drawing = registerDrawing(whole.states, whole.states.frames.length - 1);
  expect(drawing.ghosts.map(({ id }) => id)).toEqual(['dawn']);
});

it('names the moments in order, and drops the unmapped one when every row is readable', () => {
  const run = model(parameters, studyTranslate);
  expect(run.moments.map(({ label, step }) => [label, step])).toEqual([
    ['Mapped', 1],
    ['Unmapped', 3],
    ['Identity map', 4],
    ['Edited', 5],
    ['Save', 6],
  ]);
  const readable = model({ ...parameters, formatDawn: 1 }, studyTranslate);
  expect(readable.moments.map(({ label }) => label)).not.toContain('Unmapped');
  expect(readable.states.frames[3].placements.find(({ object }) => object === 'dawn')?.node).toBe(
    'mapped',
  );
});

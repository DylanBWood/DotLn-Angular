import { loadStatesStudy, studyTranslate } from '../../../../testing/src';
import { registerDrawing } from '../../composites/study-visuals/states/states-register';
import { codeBlocks, fillValues } from '../study-text';
import {
  addRow,
  type CompositionTable,
  deleteRow,
  fill,
  matches,
  model,
  recordSetRun,
  type RecordSetStep,
  rivalSave,
  setValue,
  writeRow,
} from './record-set.model';

const record = await loadStatesStudy('poeaa:452');
const parameters = record.example.parameters;
const example = { rivalSaves: 0, continueOnError: 0 };

const stored = (): CompositionTable => ({
  rows: {
    wood: { title: 0, note: 0 },
    bridge: { title: 0, note: 0 },
    ford: { title: 0, note: 0 },
  },
  statements: 0,
});
const lastOf = (steps: readonly RecordSetStep[]) => steps[steps.length - 1];
const statesOf = (step: RecordSetStep) =>
  Object.fromEntries(step.set.rows.map(({ id, state }) => [id, state]));

it('runs the example the record names, from the record’s own parameters', () => {
  expect(parameters).toEqual(example);
  expect(record.pseudocode.executable?.module).toBe(record.visual.model);
  expect(codeBlocks(record.pseudocode.ordinary)).toHaveLength(record.mechanism.steps.length);
  expect(record.pseudocode.rxjs).toBeNull();
});

it('keeps each row’s originals beside its changes, and a deleted row in the table', () => {
  let set = fill(stored(), ['wood', 'bridge', 'ford']);
  expect(
    set.rows.every(({ state, current, original }) => state === 'unchanged' && current === original),
  ).toBe(true);
  set = setValue(set, 'wood', 'note', 1);
  set = deleteRow(set, 'ford');
  set = addRow(set, 'raid', 2);
  const [wood, , ford, raid] = set.rows;
  expect(wood).toMatchObject({
    state: 'modified',
    current: { title: 0, note: 1 },
    original: { title: 0, note: 0 },
  });
  expect(ford).toMatchObject({ state: 'deleted', original: { title: 0, note: 0 } });
  expect(raid).toMatchObject({ state: 'added', original: null });
  // An added row deleted before the write-back simply goes; there is nothing stored to delete.
  expect(deleteRow(set, 'raid').rows.map(({ id }) => id)).toEqual(['wood', 'bridge', 'ford']);
});

it('writes every changed row back in table order, one statement each, and accepts them', () => {
  const steps = recordSetRun(example);
  expect(steps).toHaveLength(9);
  expect(steps.slice(5).map(({ operation }) => operation)).toEqual([
    { kind: 'write', id: 'wood', statement: 'update', matched: true },
    { kind: 'write', id: 'bridge', statement: 'update', matched: true },
    { kind: 'write', id: 'ford', statement: 'delete', matched: true },
    { kind: 'write', id: 'raid', statement: 'insert', matched: true },
  ]);
  // Nothing reaches the store before the write-back.
  expect(steps.slice(0, 5).every(({ table }) => table.statements === 0)).toBe(true);
  const last = lastOf(steps);
  expect(last.table).toEqual({
    rows: {
      wood: { title: 0, note: 1 },
      bridge: { title: 2, note: 0 },
      raid: { title: 3, note: 3 },
    },
    statements: 4,
  });
  expect(statesOf(last)).toEqual({ wood: 'unchanged', bridge: 'unchanged', raid: 'unchanged' });
  expect(last.set.rows.every(({ current, original }) => current === original)).toBe(true);
});

it('refuses a row whose stored values moved on in any column, not only the one it changed', () => {
  let set = fill(stored(), ['wood', 'bridge', 'ford']);
  set = setValue(set, 'bridge', 'title', 1);
  const table = rivalSave(stored(), 'bridge', 'note', 2);
  const [, bridge] = set.rows;
  expect(matches(bridge, stored())).toBe(true);
  expect(matches(bridge, table)).toBe(false);
  const written = writeRow(set, table, 'bridge');
  expect(written.matched).toBe(false);
  expect(written.table.rows).toEqual(table.rows);
  expect(written.table.statements).toBe(1);
  expect(written.set.rows[1]).toMatchObject({ state: 'modified', refused: true });
});

it('leaves a partial write when the adapter stops at a refused row', () => {
  const steps = recordSetRun({ ...example, rivalSaves: 1 });
  expect(steps).toHaveLength(8);
  const last = lastOf(steps);
  expect(last.operation).toEqual({
    kind: 'write',
    id: 'bridge',
    statement: 'update',
    matched: false,
  });
  expect(last.stopped).toBe(true);
  // The note of Screen the wood is stored; the rename, the deletion and the new row are not.
  expect(last.table).toEqual({
    rows: {
      wood: { title: 0, note: 1 },
      bridge: { title: 0, note: 4 },
      ford: { title: 0, note: 0 },
    },
    statements: 2,
  });
  expect(statesOf(last)).toEqual({
    wood: 'unchanged',
    bridge: 'modified',
    ford: 'deleted',
    raid: 'added',
  });
  const goesOn = lastOf(recordSetRun({ rivalSaves: 1, continueOnError: 1 }));
  expect(goesOn.stopped).toBe(false);
  expect(goesOn.table).toEqual({
    rows: {
      wood: { title: 0, note: 1 },
      bridge: { title: 0, note: 4 },
      raid: { title: 3, note: 3 },
    },
    statements: 4,
  });
  expect(statesOf(goesOn)).toEqual({ wood: 'unchanged', bridge: 'modified', raid: 'unchanged' });
  expect(goesOn.set.rows.find(({ id }) => id === 'bridge')?.refused).toBe(true);
});

it('draws each row in its state and names the moves in the text equivalent', () => {
  const run = model(parameters, studyTranslate);
  const frames = run.states.frames;
  expect(frames).toHaveLength(9);
  const at = (step: number) =>
    Object.fromEntries(frames[step].placements.map(({ object, node }) => [object, node]));
  expect(at(0)).toEqual({ wood: 'unchanged', bridge: 'unchanged', ford: 'unchanged' });
  expect(at(4)).toEqual({ wood: 'modified', bridge: 'modified', ford: 'deleted', raid: 'added' });
  expect(at(8)).toEqual({ wood: 'unchanged', bridge: 'unchanged', raid: 'unchanged' });
  expect(frames[7].moves).toEqual([
    { object: 'ford', from: 'deleted', to: null, transition: 'acceptDelete' },
  ]);
  expect(registerDrawing(run.states, 7).ghosts.map(({ id }) => id)).toEqual(['ford']);
  expect(fillValues(record.visual.textEquivalent, frames[4].values)).toBe(
    'Step 4: Dawn raid enters Added by add. The rows: Unchanged: none; Modified: Screen the wood, Hold the bridge; Added: Dawn raid; Deleted: Cross the ford. Statements sent so far: 0; rows refused: 0.',
  );
  expect(frames[4].placements.map(({ note }) => note)).toEqual([
    'note changed; original kept',
    'title changed; original kept',
    'marked for deletion; originals kept',
    'new; no originals',
  ]);
  expect(frames[8].values['sent']).toBe('4');
  // An insert is guarded by its id being free, not by originals, which an added row lacks.
  expect(frames[8].worked?.lines.slice(-2)).toEqual([
    'Statement 4: insert Dawn raid where no stored row has its id',
    'No stored row had its id: the row is inserted and accepted',
  ]);
});

it('shows the refusal in the drawing, its note and its worked lines', () => {
  const refused = model({ ...parameters, rivalSaves: 1 }, studyTranslate);
  const frames = refused.states.frames;
  const last = frames[frames.length - 1];
  expect(last.moves).toEqual([
    { object: 'bridge', from: 'modified', to: 'modified', transition: 'refuseUpdate' },
  ]);
  expect(frames[5].placements.find(({ object }) => object === 'bridge')?.note).toBe(
    'title changed; the stored note has moved on',
  );
  expect(last.placements.find(({ object }) => object === 'bridge')?.note).toBe(
    'refused: the stored note no longer matches',
  );
  expect(last.note).toBe(
    'The adapter sends statement 2, an update of Hold the bridge, but the stored note no longer equals the original, so no row matches. The adapter stops here: the changes before it are already stored, and these are never sent: Cross the ford, Dawn raid.',
  );
  expect(last.worked?.lines).toContain('No stored row matched: the row is refused');
  expect(last.values['refused']).toBe('1');
  expect(refused.moments.map(({ label, step }) => [label, step])).toEqual([
    ['Modified', 1],
    ['Added', 4],
    ['Rival save', 5],
    ['First write', 6],
    ['Refused', 7],
  ]);
  expect(model(parameters, studyTranslate).moments.map(({ label, step }) => [label, step])).toEqual(
    [
      ['Modified', 1],
      ['Added', 4],
      ['First write', 5],
      ['Last write', 8],
    ],
  );
});

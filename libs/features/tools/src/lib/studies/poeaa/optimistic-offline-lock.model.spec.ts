import { loadModelStudy, studyTranslate, tokensOf } from '../../../../testing/src';
import { codeBlocks, fillValues } from '../study-text';
import {
  model,
  optimisticRun,
  type OptimisticStep,
  read,
  readParameters,
  reload,
  save,
  type StoredComposition,
} from './optimistic-offline-lock.model';

const record = await loadModelStudy('poeaa:370', 'states');
const parameters = record.example.parameters;
const example = { version: 4, openB: 2, minutesA: 12, minutesB: 15, tabASaves: true };

const lastOf = (steps: readonly OptimisticStep[]) => steps[steps.length - 1];
const refusedTabs = (steps: readonly OptimisticStep[]) =>
  steps.flatMap(({ operation }) =>
    operation.kind === 'save' && !operation.accepted ? [operation.tab] : [],
  );

it('runs the example the record names, from the record’s own parameters', () => {
  expect(parameters).toEqual({ ...example, tabASaves: 1 });
  expect(readParameters(parameters)).toEqual(example);
  expect(record.pseudocode.executable?.module).toBe(record.visual.model);
  expect(codeBlocks(record.pseudocode.ordinary)).toHaveLength(record.mechanism.steps.length);
});

it('holds nothing when a tab reads, and writes only while storage holds the version read', () => {
  const stored: StoredComposition = { version: 4 };
  const tabA = read(stored, 0);
  const tabB = read(stored, 2);
  // Both tabs open the same version: reading takes no lock, so neither is stopped.
  expect([tabA, tabB].map(({ state, version }) => [state, version])).toEqual([
    ['editing', 4],
    ['editing', 4],
  ]);
  const first = save(tabA, stored, 12);
  expect(first).toMatchObject({ accepted: true, stored: { version: 5 } });
  // Tab B's write is conditioned on version 4, which storage no longer holds: nothing is written.
  const second = save(tabB, first.stored, 17);
  expect(second.accepted).toBe(false);
  expect(second.stored).toBe(first.stored);
  expect(second.session).toMatchObject({ state: 'refused', version: 4, lost: 15 });
  // Reloading reads the new version, and the redone save goes through.
  const redone = reload(second.session, second.stored, 17);
  expect(redone).toMatchObject({ state: 'editing', version: 5, since: 17 });
  expect(save(redone, second.stored, 32)).toMatchObject({ accepted: true, stored: { version: 6 } });
});

it('refuses the later save of the example and counts the work it throws away', () => {
  const steps = optimisticRun(example);
  expect(steps.map(({ minute, operation }) => [minute, operation.kind, operation.tab])).toEqual([
    [0, 'read', 'tabA'],
    [2, 'read', 'tabB'],
    [12, 'save', 'tabA'],
    [17, 'save', 'tabB'],
    [17, 'reload', 'tabB'],
    [32, 'save', 'tabB'],
  ]);
  expect(steps[3].operation).toEqual({
    kind: 'save',
    tab: 'tabB',
    held: 4,
    found: 5,
    accepted: false,
    refusedMinutes: 15,
  });
  // The refused save leaves storage exactly as Tab A's save left it.
  expect(steps[3].stored).toEqual(steps[2].stored);
  expect(lastOf(steps)).toMatchObject({ stored: { version: 6 }, refusals: 1, lost: 15 });
});

it('fails where the limits say: longer work loses more, and the first to save wins', () => {
  const lostWith = (minutesB: number) => lastOf(optimisticRun({ ...example, minutesB })).lost;
  expect(lostWith(15)).toBe(15);
  expect(lostWith(30)).toBe(30);
  // Saving first, not opening first, decides: Tab A opened earlier and is the one refused.
  const early = optimisticRun({ ...example, minutesB: 5 });
  expect(refusedTabs(early)).toEqual(['tabA']);
  expect(lastOf(early)).toMatchObject({ minute: 24, lost: 12, stored: { version: 6 } });
  // With Tab A closed unsaved nothing collides, and Tab B's first save goes through.
  const closed = optimisticRun({ ...example, tabASaves: false });
  expect(refusedTabs(closed)).toEqual([]);
  expect(lastOf(closed)).toMatchObject({
    minute: 17,
    stored: { version: 5 },
    refusals: 0,
    lost: 0,
  });
  expect(Object.keys(lastOf(closed).sessions)).toEqual(['tabB']);
});

it('draws each tab in its state at the telling moments, and says so in the text equivalent', () => {
  const run = model(parameters, studyTranslate);
  const frames = run.states.frames;
  expect(frames).toHaveLength(6);
  const at = (step: number) =>
    Object.fromEntries(frames[step].placements.map(({ object, node }) => [object, node]));
  expect(at(1)).toEqual({ tabA: 'editing', tabB: 'editing' });
  expect(at(2)).toEqual({ tabA: 'saved', tabB: 'editing' });
  expect(at(3)).toEqual({ tabA: 'saved', tabB: 'refused' });
  expect(at(5)).toEqual({ tabA: 'saved', tabB: 'saved' });
  expect(frames[3].moves).toEqual([
    { object: 'tabB', from: 'editing', to: 'refused', transition: 'saveRefused' },
  ]);
  expect(frames[4].moves).toEqual([
    { object: 'tabB', from: 'refused', to: 'editing', transition: 'reload' },
  ]);
  // Before Tab B saves, its row already shows that storage has moved past the version it holds.
  expect(frames[2].placements.find(({ object }) => object === 'tabB')?.note).toBe(
    'read version 4; storage has 5',
  );
  expect(fillValues(record.visual.textEquivalent, frames[3].values)).toBe(
    'Minute 17, step 3: Tab B moves from Editing to Refused by save [stale]. The tabs: Editing: none; Saved: Tab A; Refused: Tab B. Browser storage holds version 5; saves refused so far: 1; minutes of work thrown away: 15.',
  );
  expect(frames[3].worked?.lines).toContain(
    'They differ: nothing is written, and 15 minutes of changes are refused',
  );
  // Both tabs stand in the example at the refusal, and only Tab B moves.
  const keys = tokensOf(run.states);
  const moving = new Set(frames[3].moves.map(({ object }) => object));
  expect(frames[3].placements.map(({ object }) => [keys[object], moving.has(object)])).toEqual([
    ['A', false],
    ['B', true],
  ]);
  expect(run.moments.map(({ label, step }) => [label, step])).toEqual([
    ['Both open', 1],
    ['Tab A saves', 2],
    ['Tab B refused', 3],
    ['Tab B saves again', 5],
  ]);
  expect(fillValues(record.example.description, frames[0].values)).toContain('Both tabs save.');
});

it('lets a tab closed unsaved leave without a trace, and the other save first time', () => {
  const run = model({ ...parameters, tabASaves: 0 }, studyTranslate);
  const frames = run.states.frames;
  expect(frames).toHaveLength(4);
  expect(frames[2].moves).toEqual([
    { object: 'tabA', from: 'editing', to: null, transition: 'close' },
  ]);
  expect(frames[2].moves.filter(({ to }) => to === null).map(({ object }) => object)).toEqual([
    'tabA',
  ]);
  expect(frames[3].placements).toEqual([
    { object: 'tabB', node: 'saved', note: 'wrote version 5' },
  ]);
  expect(frames[3].values['refusals']).toBe('0');
});

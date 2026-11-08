import { loadStatesStudy, studyTranslate } from '../../../../testing/src';
import { registerDrawing } from '../../composites/study-visuals/states/states-register';
import { codeBlocks, fillValues } from '../study-text';
import {
  checkStudy,
  copiesOf,
  find,
  identityMapRun,
  model,
  startSession,
  type StudyStore,
} from './identity-map.model';

const record = await loadStatesStudy('poeaa:254');
const parameters = record.example.parameters;
const example = { maps: 1, revisits: 1 };

const drafts = (): StudyStore => ({
  rows: { unitOfWork: { checked: false }, identityMap: { checked: false } },
  reads: 0,
});

it('runs the example the record names, from the record’s own parameters', () => {
  expect(parameters).toEqual(example);
  expect(record.pseudocode.executable?.module).toBe(record.visual.model);
  expect(codeBlocks(record.pseudocode.ordinary)).toHaveLength(record.mechanism.steps.length);
});

it('reads only on a miss, and answers a hit with the very object the miss kept', () => {
  const missed = find(startSession(1), drafts(), 'reading', 'unitOfWork');
  expect(missed.hit).toBe(false);
  expect(missed.store.reads).toBe(1);
  const hit = find(missed.session, missed.store, 'nearby', 'unitOfWork');
  expect(hit.hit).toBe(true);
  expect(hit.store.reads).toBe(1);
  // Both callers now hold one object between them, not two equal copies.
  expect(hit.study).toBe(missed.study);
});

it('keeps answering with what it read after the store changes, until a new session', () => {
  const missed = find(startSession(1), drafts(), 'reading', 'unitOfWork');
  const store = checkStudy(missed.store, 'unitOfWork');
  const stale = find(missed.session, store, 'reading', 'unitOfWork');
  expect(stale.hit).toBe(true);
  expect(stale.study.checked).toBe(false);
  expect(store.rows.unitOfWork.checked).toBe(true);
  const fresh = find(startSession(1), store, 'reading', 'unitOfWork');
  expect(fresh.hit).toBe(false);
  expect(fresh.study.checked).toBe(true);
});

it('gives a caller with a map of its own a second object that disagrees with the first', () => {
  const steps = identityMapRun({ ...example, maps: 2 });
  const nearby = steps[4];
  expect(nearby.operation).toMatchObject({ kind: 'find', caller: 'nearby', hit: false, map: 1 });
  expect(nearby.store.reads).toBe(3);
  const [reading, own] = nearby.session.maps;
  expect(reading.unitOfWork?.checked).toBe(false);
  expect(own.unitOfWork?.checked).toBe(true);
  expect(own.unitOfWork).not.toBe(reading.unitOfWork);
  expect(copiesOf(nearby.session, 'unitOfWork')).toBe(2);
  // With one shared map the same lookup is a hit and the reads stay at two.
  const shared = identityMapRun(example)[4];
  expect(shared.operation).toMatchObject({ kind: 'find', caller: 'nearby', hit: true });
  expect(shared.store.reads).toBe(2);
});

it('counts every read and hit of the run, and reads the checked study after the reload', () => {
  const steps = identityMapRun(example);
  expect(steps.map(({ store }) => store.reads)).toEqual([0, 1, 1, 2, 2, 2, 2, 3]);
  expect(steps.map(({ hits }) => hits)).toEqual([0, 0, 0, 0, 1, 2, 2, 2]);
  expect(steps.map(({ lookups }) => lookups)).toEqual([0, 1, 1, 2, 3, 4, 4, 5]);
  const last = steps[steps.length - 1];
  expect(last.operation).toMatchObject({ kind: 'find', hit: false, study: { checked: true } });
  expect(() => startSession(3)).toThrow('one map or two');
});

it('draws each study in its column and says at each lookup whether it hit or missed', () => {
  const run = model(parameters, studyTranslate);
  const frames = run.states.frames;
  expect(frames).toHaveLength(8);
  const at = (step: number) =>
    Object.fromEntries(frames[step].placements.map(({ object, node }) => [object, node]));
  expect(at(0)).toEqual({ unitOfWork: 'stored', identityMap: 'stored' });
  expect(at(1)).toEqual({ unitOfWork: 'mapped', identityMap: 'stored' });
  expect(at(4)).toEqual({ unitOfWork: 'mapped', identityMap: 'mapped' });
  expect(at(6)).toEqual({ unitOfWork: 'stored', identityMap: 'stored' });
  expect(frames[1].moves).toEqual([
    { object: 'unitOfWork', from: 'stored', to: 'mapped', transition: 'miss' },
  ]);
  // A hit is a loop back into the same column.
  expect(frames[4].moves).toEqual([
    { object: 'unitOfWork', from: 'mapped', to: 'mapped', transition: 'hit' },
  ]);
  expect(fillValues(record.visual.textEquivalent, frames[4].values)).toBe(
    'Step 4: Unit of Work stays in Mapped by find: a hit. The nearby list asks for poeaa:246: a hit, because its map already holds the object built by read 1, so nothing is read and that same object comes back. Where each study stands: Store only: none; Mapped: Unit of Work, Identity Map; Two copies: none. Store reads so far: 2; hits: 1.',
  );
  expect(frames[1].values['lookup']).toBe(
    "The reading asks for poeaa:246: a miss, because this session's map holds nothing under that id, so the loader makes read 1 of the store and keeps the object under poeaa:246.",
  );
  expect(frames[2].values['lookup']).toBe('No lookup at this step.');
  expect(frames[2].placements.find(({ object }) => object === 'unitOfWork')?.note).toBe(
    'held as draft; stored as checked',
  );
});

it('draws the second copy when the nearby list keeps its own map, and the reload empties both', () => {
  const run = model({ ...parameters, maps: 2 }, studyTranslate);
  const frames = run.states.frames;
  expect(frames[4].moves).toEqual([
    { object: 'unitOfWork', from: 'mapped', to: 'twice', transition: 'missElsewhere' },
  ]);
  expect(frames[4].placements.find(({ object }) => object === 'unitOfWork')?.note).toBe(
    "the reading's copy draft; the list's checked",
  );
  expect(frames[4].note).toContain('they disagree');
  expect(frames[6].moves.map(({ object, transition }) => [object, transition])).toEqual([
    ['unitOfWork', 'endTwice'],
    ['identityMap', 'endMapped'],
  ]);
  const drawing = registerDrawing(run.states, 4);
  expect(drawing.tokens.map(({ key, state }) => [key, state])).toEqual([
    ['U', 'moving'],
    ['I', 'resting'],
  ]);
  expect(drawing.arrows).toHaveLength(1);
});

it('compares the map’s reads with a read for every lookup, and names the moments in order', () => {
  const run = model(parameters, studyTranslate);
  const [mapped, unmapped] = run.comparison?.timeline.series ?? [];
  expect(mapped.values).toEqual([0, 1, 1, 2, 2, 2, 2, 3]);
  expect(unmapped.values).toEqual([0, 1, 1, 2, 3, 4, 4, 5]);
  expect(run.comparison?.findings[0]).toBe(
    'By the last step the map has made 3 reads for 5 lookups, 2 of them hits.',
  );
  expect(run.moments.map(({ label, step }) => [label, step])).toEqual([
    ['Miss', 1],
    ['Store changes', 2],
    ['Hit', 4],
    ['New session', 6],
  ]);
  const twice = model({ ...parameters, maps: 2 }, studyTranslate);
  expect(twice.moments.map(({ label, step }) => [label, step])).toEqual([
    ['Miss', 1],
    ['Store changes', 2],
    ['Second copy', 4],
    ['Hit', 5],
    ['New session', 6],
  ]);
});

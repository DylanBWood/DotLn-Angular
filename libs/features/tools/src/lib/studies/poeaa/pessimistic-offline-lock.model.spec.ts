import { loadStatesStudy, studyTranslate } from '../../../../testing/src';
import { registerDrawing } from '../../composites/study-visuals/states/states-register';
import { codeBlocks, fillValues } from '../study-text';
import {
  lostBy,
  model,
  pessimisticRun,
  type PessimisticStep,
  requestLock,
  saveUnderLock,
  waitedBy,
} from './pessimistic-offline-lock.model';

const record = await loadStatesStudy('poeaa:377');
const parameters = record.example.parameters;
const example = { version: 4, openB: 2, minutesA: 12, minutesB: 15, tabASaves: 1, timeout: 20 };

const lastOf = (steps: readonly PessimisticStep[]) => steps[steps.length - 1];

it('runs the example the record names, from the record’s own parameters', () => {
  expect(parameters).toEqual(example);
  expect(record.pseudocode.executable?.module).toBe(record.visual.model);
  expect(codeBlocks(record.pseudocode.ordinary)).toHaveLength(record.mechanism.steps.length);
});

it('grants the lock to one tab at a time, refuses at once, and lets a run-out lock be taken over', () => {
  const first = requestLock(null, 'tabA', 0, 20);
  expect(first).toEqual({ lock: { owner: 'tabA', expires: 20 }, granted: true, tookOver: null });
  // Tab B is turned away there and then, not queued behind Tab A.
  expect(requestLock(first.lock, 'tabB', 2, 20)).toEqual({
    lock: first.lock,
    granted: false,
    tookOver: null,
  });
  // From the minute the lock runs out, a waiting tab may take it over.
  expect(requestLock(first.lock, 'tabB', 20, 20)).toEqual({
    lock: { owner: 'tabB', expires: 40 },
    granted: true,
    tookOver: first.lock,
  });
  // Only the owner saves; the save writes the next version and releases the lock in one step.
  expect(saveUnderLock(4, first.lock, 'tabA')).toEqual({ stored: 5, lock: null, accepted: true });
  expect(saveUnderLock(4, first.lock, 'tabB')).toEqual({
    stored: 4,
    lock: first.lock,
    accepted: false,
  });
  // A lock that ran out but that no other tab took is still its owner's.
  expect(saveUnderLock(4, { owner: 'tabB', expires: 10 }, 'tabB').accepted).toBe(true);
});

it('turns Tab B away at the door, so it waits instead of losing its work', () => {
  const steps = pessimisticRun(example);
  expect(steps.map(({ minute, operation }) => [minute, operation.kind, operation.tab])).toEqual([
    [0, 'open', 'tabA'],
    [2, 'open', 'tabB'],
    [12, 'save', 'tabA'],
    [12, 'retry', 'tabB'],
    [27, 'save', 'tabB'],
  ]);
  expect(steps[1]).toMatchObject({
    operation: { kind: 'open', tab: 'tabB', granted: false },
    sessions: { tabB: { state: 'waiting', version: null } },
  });
  // Tab B reads only once Tab A has saved, so it starts from the version Tab A wrote.
  expect(steps[3].sessions.tabB).toMatchObject({ state: 'holding', version: 5, waited: 10 });
  expect(lastOf(steps)).toMatchObject({ stored: 6, lock: null });
  expect([waitedBy(lastOf(steps)), lostBy(lastOf(steps))]).toEqual([10, 0]);
});

it('fails where the limits say: an abandoned lock holds Tab B up, and a short one costs Tab A', () => {
  const abandoned = pessimisticRun({ ...example, tabASaves: 0 });
  // The closed tab still owns the lock until it runs out, and Tab B waits for that, not for work.
  expect(abandoned[2]).toMatchObject({
    minute: 12,
    operation: { kind: 'close', tab: 'tabA' },
    lock: { owner: 'tabA', expires: 20 },
  });
  expect(abandoned[3]).toMatchObject({
    minute: 20,
    operation: { kind: 'retry', tab: 'tabB', waited: 18, tookOver: { owner: 'tabA' } },
  });
  expect(lastOf(abandoned)).toMatchObject({ minute: 35, stored: 5 });
  expect(waitedBy(lastOf(abandoned))).toBe(18);
  // A lock shorter than Tab A's work is taken over while Tab A still works, and its save refused.
  const short = pessimisticRun({ ...example, timeout: 5 });
  expect(short[2]).toMatchObject({ minute: 5, operation: { kind: 'retry', tab: 'tabB' } });
  expect(short[3].operation).toEqual({
    kind: 'save',
    tab: 'tabA',
    accepted: false,
    refusedMinutes: 12,
  });
  expect(lostBy(lastOf(short))).toBe(12);
  expect(lastOf(short)).toMatchObject({ stored: 5, operation: { tab: 'tabB', accepted: true } });
});

it('draws each tab in its state at the telling moments, and says so in the text equivalent', () => {
  const run = model(parameters, studyTranslate);
  const frames = run.states.frames;
  expect(frames).toHaveLength(5);
  const at = (step: number) =>
    Object.fromEntries(frames[step].placements.map(({ object, node }) => [object, node]));
  expect(at(0)).toEqual({ tabA: 'holding' });
  expect(at(1)).toEqual({ tabA: 'holding', tabB: 'waiting' });
  expect(at(3)).toEqual({ tabA: 'saved', tabB: 'holding' });
  expect(at(4)).toEqual({ tabA: 'saved', tabB: 'saved' });
  expect(frames[1].moves).toEqual([
    { object: 'tabB', from: null, to: 'waiting', transition: 'lockRefused' },
  ]);
  expect(frames[3].moves).toEqual([
    { object: 'tabB', from: 'waiting', to: 'holding', transition: 'granted' },
  ]);
  expect(frames[2].placements.find(({ object }) => object === 'tabB')?.note).toBe(
    'turned away; the lock is free now',
  );
  expect(fillValues(record.visual.textEquivalent, frames[1].values)).toBe(
    'Minute 2, step 1: Tab B enters Waiting by lock [held]. The tabs: Waiting: Tab B; Holds lock: Tab A; Saved: none; Expired: none. The lock on Hold the ridge: held by Tab A until minute 20. Minutes spent waiting so far: 0; minutes of work thrown away: 0.',
  );
  expect(frames[3].values['waited']).toBe('10');
  expect(run.moments.map(({ label, step }) => [label, step])).toEqual([
    ['Tab B turned away', 1],
    ['Tab A saves', 2],
    ['Tab B gets the lock', 3],
    ['Tab B saves', 4],
  ]);
});

it('draws an abandoned lock: Tab A stays in Holds lock after its tab closes, until it is taken over', () => {
  const run = model({ ...parameters, tabASaves: 0 }, studyTranslate);
  const frames = run.states.frames;
  expect(frames[2].moves).toEqual([
    { object: 'tabA', from: 'holding', to: 'holding', transition: 'close' },
  ]);
  expect(frames[2].note).toBe(
    'Tab A is closed without saving or releasing. Its lock stays taken until minute 20, keeping the other tab out.',
  );
  expect(frames[3].moves).toEqual([
    { object: 'tabA', from: 'holding', to: 'expired', transition: 'timeOut' },
    { object: 'tabB', from: 'waiting', to: 'holding', transition: 'granted' },
  ]);
  expect(registerDrawing(run.states, 3).arrows.map(({ id }) => id)).toEqual(['tabA', 'tabB']);
  expect(frames[3].worked?.lines).toContain(
    "Tab A's lock ran out at minute 20: Tab B takes it over until minute 40",
  );
  expect(fillValues(record.mechanism.steps[1].text, frames[3].values)).toContain(
    'Minutes spent waiting so far: 18.',
  );
});

import { loadStatesStudy, studyTranslate } from '../../../../testing/src';
import { registerDrawing } from '../../composites/study-visuals/states/states-register';
import { codeBlocks, fillValues } from '../study-text';
import { arrive, translate } from './gateway.model';
import {
  expectationOf,
  judge,
  model,
  release,
  runCase,
  stubAnswer,
  suiteRun,
  type SuiteStep,
  tally,
} from './service-stub.model';

const record = await loadStatesStudy('poeaa:448');
const parameters = record.example.parameters;
const example = {
  dynamicStub: 1,
  refusalStatus: 503,
  timeoutMs: 30,
  stubDelayMs: 200,
  fixtureVersion: 1,
  liveVersion: 1,
};

const statesAfter = (steps: readonly SuiteStep[], index: number) =>
  Object.fromEntries(Object.entries(steps[index].cases).map(([id, { state }]) => [id, state]));

it('runs the example the record names, from the record’s own parameters', () => {
  expect(parameters).toEqual(example);
  expect(record.pseudocode.executable?.module).toBe(record.visual.model);
  expect(codeBlocks(record.pseudocode.ordinary)).toHaveLength(record.mechanism.steps.length);
});

it('answers each case in the API’s terms and lets the production gateway translate it', () => {
  expect(stubAnswer('recorded', example)).toEqual({ kind: 'response', status: 200, version: 1 });
  expect(stubAnswer('refusal', example)).toEqual({ kind: 'response', status: 503, version: 1 });
  expect(stubAnswer('network', example)).toEqual({ kind: 'unreachable' });
  // The stub holds the timeout case's board for 200 ms; the gateway stops waiting at 30.
  const held = runCase('timeout', example);
  expect(held.answer).toEqual({ kind: 'response', status: 200, version: 1 });
  expect(held.seen).toEqual({ kind: 'silence', waitedMs: 30 });
  expect(held.seen).toEqual(arrive(stubAnswer('timeout', example), 200, 30));
  expect(held.outcome).toEqual(translate({ kind: 'silence', waitedMs: 30 }));
  expect(held.waitedMs).toBe(30);
  expect(runCase('refusal', example).outcome).toEqual(expectationOf('refusal', example));
  expect(runCase('network', example).outcome).toEqual({
    kind: 'failure',
    error: 'network',
    status: null,
  });
  expect(() =>
    judge(
      { state: 'queued', answer: null, seen: null, outcome: null, waitedMs: 0 },
      expectationOf('recorded', example),
    ),
  ).toThrow();
});

it('passes every case in memory, with no call to the live API until release', () => {
  const steps = suiteRun(example);
  expect(steps).toHaveLength(10);
  const done = steps[8];
  expect(statesAfter(steps, 8)).toEqual({
    recorded: 'passed',
    refusal: 'passed',
    network: 'passed',
    timeout: 'passed',
  });
  expect(steps.slice(0, -1).every(({ liveCalls }) => liveCalls === 0)).toBe(true);
  expect(tally(done)).toEqual({ passed: 4, failed: 0, waitedMs: 30 });
  const last = steps[9];
  expect(last.operation).toEqual({ kind: 'release', id: 'recorded' });
  expect(last.liveCalls).toBe(1);
  // Only the recorded case meets the live API; the others keep what the stub gave them.
  expect(last.cases.refusal).toBe(done.cases.refusal);
  expect(last.cases.network).toBe(done.cases.network);
  expect(last.cases.timeout).toBe(done.cases.timeout);
  expect(last.cases.recorded.state).toBe('passed');
});

it('fails the failure paths with a static stub, which has one answer for every case', () => {
  const steps = suiteRun({ ...example, dynamicStub: 0 });
  expect(statesAfter(steps, 8)).toEqual({
    recorded: 'passed',
    refusal: 'failed',
    network: 'failed',
    timeout: 'failed',
  });
  for (const id of ['refusal', 'network', 'timeout'] as const)
    expect(steps[8].cases[id].outcome).toEqual({ kind: 'board', version: 1 });
  expect(tally(steps[8])).toEqual({ passed: 1, failed: 3, waitedMs: 0 });
});

it('passes against the stub and fails at release when the live contract has moved on', () => {
  const drifted = { ...example, liveVersion: 2 };
  const steps = suiteRun(drifted);
  expect(tally(steps[8])).toEqual({ passed: 4, failed: 0, waitedMs: 30 });
  expect(steps[9].cases.recorded).toMatchObject({
    state: 'failed',
    outcome: { kind: 'board', version: 2 },
  });
  expect(release(steps[8].cases.recorded, example).state).toBe('passed');
  const run = model({ ...parameters, liveVersion: 2 }, studyTranslate);
  const last = run.states.frames[9];
  expect(last.moves).toEqual([
    { object: 'recorded', from: 'passed', to: 'failed', transition: 'liveBreaks' },
  ]);
  expect(last.placements[0].note).toBe('live: expected a board, version 1; got a board, version 2');
  expect(last.values['liveCalls']).toBe('1');
});

it('fails the staged timeout once the case waits longer than the stub holds its answer', () => {
  const steps = suiteRun({ ...example, timeoutMs: 300 });
  expect(steps[7].cases.timeout).toMatchObject({
    answer: { kind: 'response', status: 200, version: 1 },
    seen: { kind: 'response', status: 200, version: 1 },
    outcome: { kind: 'board', version: 1 },
    waitedMs: 200,
  });
  expect(steps[8].cases.timeout.state).toBe('failed');
});

it('draws each case in the column of where it stands, and reads the suite aloud', () => {
  const run = model(parameters, studyTranslate);
  const frames = run.states.frames;
  expect(frames).toHaveLength(10);
  const at = (step: number) =>
    Object.fromEntries(frames[step].placements.map(({ object, node }) => [object, node]));
  expect(at(0)).toEqual({
    recorded: 'queued',
    refusal: 'queued',
    network: 'queued',
    timeout: 'queued',
  });
  expect(at(3)).toEqual({
    recorded: 'passed',
    refusal: 'answered',
    network: 'queued',
    timeout: 'queued',
  });
  expect(frames[3].moves).toEqual([
    { object: 'refusal', from: 'queued', to: 'answered', transition: 'answer' },
  ]);
  expect(frames[4].moves).toEqual([
    { object: 'refusal', from: 'answered', to: 'passed', transition: 'pass' },
  ]);
  // A live call that confirms the case loops over the Passed column.
  expect(frames[9].moves).toEqual([
    { object: 'recorded', from: 'passed', to: 'passed', transition: 'liveHolds' },
  ]);
  expect(frames[7].note).toBe(
    'The Timeout case asks for a timeout. The stub holds its answer for 200 ms, the gateway stops waiting at 30 ms, and makes that a timeout.',
  );
  expect(fillValues(record.visual.textEquivalent, frames[8].values)).toBe(
    'Step 8: Timeout moves from Stub answered to Passed by assert. The cases: To run: none; Stub answered: none; Passed: Recorded board, Refusal, Lost connection, Timeout; Failed: none. Passed 4, failed 0; calls to the live API: 0.',
  );
  expect(frames[3].placements[1].note).toBe('got an HTTP 503 failure');
  expect(frames[7].worked?.lines).toEqual([
    'Scenario on the request: timeout',
    'The stub reads it',
    'Stub answers after 200 ms: status 200 with a board of version 1',
    'Wait: 30 ms against a limit of 30 ms',
    'The limit passes first: the gateway sees nothing within 30 ms and raises its own timeout',
    'The gateway translates it to a timeout',
    'Passed 3, failed 0; waited on the stub 30 ms; calls to the live API: 0',
  ]);
  expect(run.moments.map(({ label, step }) => [label, step])).toEqual([
    ['Recorded board', 1],
    ['Refusal', 3],
    ['Timeout', 7],
    ['Suite done', 8],
    ['Release', 9],
  ]);
  const drawing = registerDrawing(run.states, 8);
  expect(drawing.tokens.map(({ key, state }) => [key, state])).toEqual([
    ['D', 'resting'],
    ['R', 'resting'],
    ['L', 'resting'],
    ['T', 'moving'],
  ]);
  const staticRun = model({ ...parameters, dynamicStub: 0 }, studyTranslate);
  expect(staticRun.states.frames[4].moves).toEqual([
    { object: 'refusal', from: 'answered', to: 'failed', transition: 'fail' },
  ]);
  expect(staticRun.states.frames[4].placements[1].note).toBe(
    'expected an HTTP 503 failure; got a board, version 1',
  );
});

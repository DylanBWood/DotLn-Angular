import { loadModelStudy, studyTranslate, tokensOf } from '../../../../testing/src';
import type { StatesStudyModel } from '../study-model';
import { codeBlocks, fillValues } from '../study-text';
import {
  arrive,
  ask,
  gatewayRun,
  get,
  load,
  model,
  send,
  serve,
  translate,
  untranslated,
} from './gateway.model';

const record = await loadModelStudy('poeaa:408', 'states');
const parameters = record.example.parameters;
const example = { timeoutMs: 10000, answerMs: 400, status: 200, servedVersion: 1, pageVersion: 1 };

const placements = (run: StatesStudyModel, step: number) =>
  Object.fromEntries(run.states.frames[step].placements.map(({ object, node }) => [object, node]));

it('runs the example the record names, from the record’s own parameters', () => {
  expect(parameters).toEqual(example);
  expect(record.pseudocode.executable?.module).toBe(record.visual.model);
  expect(codeBlocks(record.pseudocode.ordinary)).toHaveLength(record.mechanism.steps.length);
});

it('keeps each rule in its own part: the store asks, the front names, the back addresses and limits', () => {
  const asked = ask();
  expect(asked).toEqual({ at: 'store', path: null, url: null, limitMs: null });
  // The store's call carries the intention only.
  expect(load(asked)).toEqual({ at: 'front', path: null, url: null, limitMs: null });
  const named = get(load(asked));
  expect(named).toEqual({ at: 'back', path: '/uifa-board-v1', url: null, limitMs: null });
  expect(send(named, example.timeoutMs)).toEqual({
    at: 'api',
    path: '/uifa-board-v1',
    url: '/api/uifa-board-v1',
    limitMs: 10000,
  });
  expect(() => send(asked, example.timeoutMs)).toThrow();
});

it('translates every answer into the app’s terms, and checks nothing but status, time and connection', () => {
  expect(translate({ kind: 'response', status: 200, version: 1 })).toEqual({
    kind: 'board',
    version: 1,
  });
  expect(translate({ kind: 'response', status: 503, version: 1 })).toEqual({
    kind: 'failure',
    error: 'http',
    status: 503,
  });
  expect(translate({ kind: 'unreachable' })).toEqual({
    kind: 'failure',
    error: 'network',
    status: null,
  });
  expect(translate({ kind: 'silence', waitedMs: 10000 })).toEqual({
    kind: 'failure',
    error: 'timeout',
    status: null,
  });
  // A connection lost before any answer is status 0, raised by the transport.
  expect(serve({ ...example, status: 0 })).toEqual({ kind: 'unreachable' });
  // An answer later than the limit is never seen: the back raises its own timeout.
  expect(arrive(serve(example), 12400, 10000)).toEqual({ kind: 'silence', waitedMs: 10000 });
  expect(arrive(serve(example), 400, 10000)).toEqual(serve(example));
  // The contract version is not checked: a version-2 board crosses as a board.
  expect(translate({ kind: 'response', status: 200, version: 2 })).toEqual({
    kind: 'board',
    version: 2,
  });
  expect(untranslated({ kind: 'board', version: 2 }, 1)).toBe(1);
  expect(untranslated({ kind: 'board', version: 1 }, 1)).toBe(0);
});

it('delivers a board through the front, and a version the page cannot draw as loadSuccess too', () => {
  const steps = gatewayRun(example);
  expect(steps.map(({ operation }) => operation)).toEqual([
    'start',
    'load',
    'get',
    'send',
    'answer',
    'receive',
    'translate',
    'return',
    'deliver',
  ]);
  expect(steps[steps.length - 1].reply).toMatchObject({
    at: 'store',
    outcome: { kind: 'board', version: 1 },
  });
  const leaked = gatewayRun({ ...example, servedVersion: 2 });
  expect(leaked[leaked.length - 1].reply?.outcome).toEqual({ kind: 'board', version: 2 });
  const run = model({ ...parameters, servedVersion: 2 }, studyTranslate);
  const last = run.states.frames[run.states.frames.length - 1];
  expect(last.moves).toEqual([
    { object: 'reply', from: 'front', to: 'store', transition: 'succeed' },
  ]);
  expect(last.values['untranslated']).toBe('1');
  expect(last.values['outcome']).toBe('a board of version 2, which the page cannot draw');
});

it('abandons the request at the limit and raises the timeout in the back, never at the API', () => {
  const steps = gatewayRun({ ...example, answerMs: 12400 });
  expect(steps.map(({ operation }) => operation)).toEqual([
    'start',
    'load',
    'get',
    'send',
    'abandon',
    'translate',
    'return',
    'deliver',
  ]);
  expect(steps.every(({ reply }) => reply?.at !== 'api')).toBe(true);
  expect(steps[4]).toEqual({
    operation: 'abandon',
    request: null,
    reply: { at: 'back', raw: { kind: 'silence', waitedMs: 10000 }, outcome: null },
  });
  expect(steps[steps.length - 1].reply?.outcome).toEqual({
    kind: 'failure',
    error: 'timeout',
    status: null,
  });
  const run = model({ ...parameters, answerMs: 12400 }, studyTranslate);
  expect(run.states.frames[4].moves).toEqual([
    { object: 'request', from: 'api', to: null, transition: 'abandon' },
    { object: 'reply', from: null, to: 'back', transition: 'raise' },
  ]);
  // The request is the one object that leaves the example at the abandon.
  expect(
    run.states.frames[4].moves.filter(({ to }) => to === null).map(({ object }) => object),
  ).toEqual(['request']);
  expect(run.moments.map(({ label, step }) => [label, step])).toEqual([
    ['Load', 1],
    ['Send', 3],
    ['Abandon', 4],
    ['Translate', 5],
    ['Deliver', 7],
  ]);
  expect(run.states.frames[7].note).toBe(
    'The store records loadFailure. It learns the kind of failure and nothing about the transport.',
  );
  expect(run.states.frames[7].moves).toEqual([
    { object: 'reply', from: 'front', to: 'store', transition: 'fail' },
  ]);
  // A connection lost before any answer is raised the same way: in the back, the request abandoned.
  const lost = gatewayRun({ ...example, status: 0 });
  expect(lost[4]).toEqual({
    operation: 'abandon',
    request: null,
    reply: { at: 'back', raw: { kind: 'unreachable' }, outcome: null },
  });
  expect(lost[lost.length - 1].reply?.outcome).toEqual({
    kind: 'failure',
    error: 'network',
    status: null,
  });
});

it('draws the request and the reply in the column of the part that holds each, and reads it aloud', () => {
  const run = model(parameters, studyTranslate);
  const frames = run.states.frames;
  expect(frames).toHaveLength(9);
  expect(placements(run, 0)).toEqual({ request: 'store' });
  expect(placements(run, 3)).toEqual({ request: 'api' });
  expect(placements(run, 4)).toEqual({ reply: 'api' });
  expect(placements(run, 8)).toEqual({ reply: 'store' });
  expect(frames[4].moves).toEqual([
    { object: 'request', from: 'api', to: null, transition: 'answered' },
    { object: 'reply', from: null, to: 'api', transition: 'answer' },
  ]);
  // Translation changes the reply's terms, not its place: a loop over the back's column.
  expect(frames[6].moves).toEqual([
    { object: 'reply', from: 'back', to: 'back', transition: 'translate' },
  ]);
  expect(frames[3].placements[0].note).toBe('GET /api/uifa-board-v1; waits 10000 ms');
  expect(frames[5].placements[0].note).toBe('HTTP 200 after 400 ms; body version 1');
  expect(frames[6].placements[0].note).toBe('board, version 1');
  expect(fillValues(record.visual.textEquivalent, frames[3].values)).toBe(
    'Step 3: Request moves from Gateway back to HTTP API by send. The parts: Board store: none; Gateway front: none; Gateway back: none; HTTP API: Request. The store holds nothing yet.',
  );
  expect(fillValues(record.visual.textEquivalent, frames[8].values)).toBe(
    'Step 8: Reply moves from Gateway front to Board store by loadSuccess. The parts: Board store: Reply; Gateway front: none; Gateway back: none; HTTP API: none. The store holds a board of version 1.',
  );
  expect(frames[6].worked?.lines).toEqual([
    'Status 200 is 2xx: a board',
    'Version check: none, so version 1 crosses as it came',
    'The page draws version 1: it can draw this board',
    'Terms of the API that crossed untranslated: 0',
  ]);
  // The reply, token 2, is the one object in the example at the translation, and it is the one that moves.
  expect(frames[6].placements.map(({ object }) => object)).toEqual(['reply']);
  expect(frames[6].moves.map(({ object }) => object)).toEqual(['reply']);
  expect(tokensOf(run.states)['reply']).toBe('2');
});

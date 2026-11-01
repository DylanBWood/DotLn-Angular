import { loadFlowStudy } from '../../../../testing/src';
import { expectMarbleExample } from '../rxjs/marble-testing';
import type { MarbleExample } from '../rxjs/marbles';
import type { FlowFrame, FlowStudyModel } from '../study-model';
import { placeholdersIn } from '../study-text';
import { example, flow, model, queueWithLimit, timeToLive } from './message-expiration';

const path = 'libs/features/tools/src/lib/studies/eip/message-expiration.ts';

/** The example run from the record's own parameters, which this module always draws as a flow. */
async function drawn(): Promise<FlowStudyModel> {
  const run = model((await loadFlowStudy('eip:91')).example.parameters);
  if (run.family !== 'flow') throw new Error('The study is drawn as a flow.');
  return run;
}

/** Each message that crosses a link at a step, as `link key`. */
const hopsOf = (frame: FlowFrame) => frame.hops.map(({ link, key }) => `${link} ${key}`);
/** The letters a node holds after a step. */
const heldBy = (frame: FlowFrame, node: string) => (frame.held[node] ?? []).map(({ key }) => key);

it('runs the verification queue against the marbles both drawings show', () => {
  expectMarbleExample(example);
});

it('attaches the record to the Message Expiration row, with this module and its limit', async () => {
  const record = await loadFlowStudy('eip:91');
  expect(record.visual.model).toBe(path);
  expect(record.pseudocode.executable).toEqual({ kind: 'rxjs', module: path });
  expect(record.example.parameters).toEqual({ timeToLive });
  const { diagram, initialStep } = await drawn();
  expect(initialStep).toBe(0);
  expect(diagram?.marbles.lines.map(({ label }) => label)).toEqual([
    'request$',
    'verification(31)',
    'verification(33)',
    'toVerifier$',
    'deadLetter$',
  ]);
});

it('moves one request at a time, and none straight through the queue', async () => {
  const { frames } = (await drawn()).flow;
  expect(frames.map(({ step }) => step)).toEqual(Array.from({ length: 11 }, (_, step) => step));
  expect(frames.map((frame) => hopsOf(frame))).toEqual([
    [],
    ['send a'],
    ['take a'],
    ['send b'],
    [],
    ['send c'],
    [],
    [],
    ['expire b'],
    ['take c'],
    [],
  ]);
});

it('keeps b and c waiting in the queue while the verifier works on a', async () => {
  const { frames } = (await drawn()).flow;
  expect(heldBy(frames[1], 'queue')).toEqual(['a']);
  expect(heldBy(frames[2], 'queue')).toEqual([]);
  expect(heldBy(frames[2], 'verifier')).toEqual(['a']);
  expect(heldBy(frames[5], 'queue')).toEqual(['b', 'c']);
  // Each request is good until its send step plus the time to live: b until 7, c until 9.
  expect(frames[5].states['queue']).toBe(`b until ${3 + timeToLive}, c until ${5 + timeToLive}`);
  // At step 7 b has used its whole limit, and nothing has happened to it yet.
  expect(frames[7].states['queue']).toBe(`b until ${3 + timeToLive} (now), c until 9`);
});

it('sends the request past its limit to the dead letter channel and verifies the young one', async () => {
  const run = await drawn();
  const { frames } = run.flow;
  // The verifier is free at step 8: b, good until 7, expires; c, good until 9, waits one step.
  expect(frames[8].values['moves']).toBe(
    'b (verify order 32) moves from Request queue to Dead letter',
  );
  expect(heldBy(frames[8], 'dead')).toEqual(['b']);
  expect(heldBy(frames[8], 'queue')).toEqual(['c']);
  expect(frames[8].states['verifier']).toBe('finished 31; free');
  expect(frames[9].values['moves']).toBe(
    'c (verify order 33) moves from Request queue to Verifier',
  );
  expect(heldBy(frames[9], 'verifier')).toEqual(['c']);
  // b never reaches the verifier, and nothing else expires.
  const crossings = frames.flatMap(hopsOf);
  expect(crossings.filter((hop) => hop.startsWith('expire'))).toEqual(['expire b']);
  expect(crossings.filter((hop) => hop.startsWith('take'))).toEqual(['take a', 'take c']);
  expect(frames[10].values['delivered']).toBe(
    'toVerifier$: a (verify order 31), c (verify order 33); deadLetter$: b (verify order 32)',
  );
  // No verification is ever opened for b; the two that run keep the verifier busy in turn.
  const verifications = run.diagram?.marbles.lines.filter(({ role }) => role === 'inner') ?? [];
  expect(
    verifications.map(({ subscribedAt, unsubscribedAt }) => [subscribedAt, unsubscribedAt]),
  ).toEqual([
    [2, 8],
    [9, 10],
  ]);
  expect(run.moments.map(({ label, step }) => [label, step])).toEqual([
    ['First one verified', 2],
    ['Two waiting', 5],
    ["b's last good step", 7],
    ['b expires', 8],
    ['c verified', 9],
  ]);
});

it('writes a note for every step and keeps the two drawings on the same steps', async () => {
  const run = await drawn();
  expect(Object.keys(example.notes ?? {}).map(Number)).toEqual(
    run.flow.frames.map(({ step }) => step),
  );
  expect(run.flow.frames.map(({ step }) => step)).toEqual(
    run.diagram?.marbles.frames.map(({ frame }) => frame),
  );
  // Every value an output carries is one of the operator's requests, riding from request$.
  const outputs = run.diagram?.marbles.lines.filter(({ role }) => role === 'output') ?? [];
  const values = outputs.flatMap(({ events }) => events.filter(({ kind }) => kind === 'next'));
  expect(values.map(({ key, from }) => `${key} from ${from}`)).toEqual([
    'a from request$',
    'c from request$',
    'b from request$',
  ]);
  // Every state fits in its box, and every name reads at a narrow width.
  const states = run.flow.frames.flatMap(({ states: now }) => Object.values(now));
  expect(states.every((text) => text.length <= 40)).toBe(true);
  expect(flow.nodes.every(({ label }) => label.split(' ').every((word) => word.length <= 10))).toBe(
    true,
  );
});

it('loses the younger request instead when the limit is raised', () => {
  // With a limit of 6, b is good until step 9, so at step 8 it is still fresh and is verified
  // late; its verification runs to step 12, by when c, good until 11, has expired in its place,
  // so no verification is ever opened for c.
  const { 'verify order 33': _neverOpened, ...verifications } = example.inner ?? {};
  const longer: MarbleExample = {
    ...example,
    inner: {
      ...verifications,
      'verify order 32': {
        label: 'verification(32)',
        marbles: '---|',
        subscriptions: '---------^--!',
      },
    },
    outputs: {
      toVerifier$: {
        label: 'toVerifier$',
        marbles: '--a------b',
        values: { a: 'verify order 31', b: 'verify order 32' },
      },
      deadLetter$: {
        label: 'deadLetter$',
        marbles: '------------c',
        values: { c: 'verify order 33' },
      },
    },
    run: queueWithLimit(6),
    moments: [],
    notes: {},
    origins: {},
  };
  expectMarbleExample(longer);
});

it('supplies every value the record’s prose reads, at every step', async () => {
  const record = await loadFlowStudy('eip:91');
  const { frames } = (await drawn()).flow;
  const names = [
    ...placeholdersIn(record.visual.textEquivalent),
    ...placeholdersIn(record.example.description),
    ...record.mechanism.steps.flatMap(({ text }) => placeholdersIn(text)),
    ...record.limits.flatMap(placeholdersIn),
  ];
  expect(names.length).toBeGreaterThan(0);
  for (const frame of frames)
    for (const name of names) expect(frame.values[name], `${name} at ${frame.step}`).toBeDefined();
});

// The drawn example leaves the operator's channel open. The same pipeline over the same requests,
// the operator ending on the last one, expires and verifies the same requests at the same frames;
// the queue's output to the verifier completes when the last verification ends, and the dead
// letter channel, a channel of its own, stays open.
it('completes once the operator stops and the last verification ends; the dead letters stay', () => {
  expectMarbleExample({
    ...example,
    inputs: { request$: { ...example.inputs['request$'], marbles: '-a-b-(c|)' } },
    outputs: {
      toVerifier$: { ...example.outputs['toVerifier$'], marbles: '--a------c|' },
      deadLetter$: example.outputs['deadLetter$'],
    },
  });
});

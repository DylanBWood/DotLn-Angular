import type { StudyParameters } from '@dotln-angular/models';

import { loadFlowStudy } from '../../../../testing/src';
import { expectMarbleExample } from '../rxjs/marble-testing';
import type { FlowStudyModel, StudyModelFunction } from '../study-model';
import { placeholdersIn } from '../study-text';
import { example, flow, model } from './competing-consumers';
import * as topic from './publish-subscribe-channel';

/** A study's run, which a flow study's model always draws as a flow. */
function flowOf(study: StudyModelFunction, values: StudyParameters): FlowStudyModel {
  const run = study(values);
  if (run.family !== 'flow') throw new Error('The study is not drawn as a flow.');
  return run;
}

const modulePath = 'libs/features/tools/src/lib/studies/eip/competing-consumers.ts';
const parameters = { orders: '31 to 34', consumers: 3, work: '9, 5, 4 and 3' };
// The Publish-Subscribe Channel record's parameters, for running that study beside this one.
const topicParameters = { orders: '31 to 34', subscribers: 3, lateJoin: 7 };
const sessions = ['session1', 'session2', 'session3'];

/** Each delivery from the channel to a session over the whole run: step, letter and session. */
const deliveries = (run: FlowStudyModel, from: string) =>
  run.flow.frames.flatMap(({ step, hops }) =>
    hops.flatMap(({ key, link }) => {
      const to = run.flow.links.find(({ id }) => id === link);
      return to?.from === from ? [{ step, key, session: to.to }] : [];
    }),
  );

/** The letters a node holds after a step. */
const heldAt = (run: FlowStudyModel, step: number, node: string) =>
  (run.flow.frames[step].held[node] ?? []).map(({ key }) => key);

it('runs the queue example against the marbles both drawings show', () => {
  expectMarbleExample(example);
});

it('attaches the record to the Competing Consumers row and reads this module', async () => {
  const record = await loadFlowStudy('eip:211');
  expect(record.visual.model).toBe(modulePath);
  expect(record.pseudocode.executable).toEqual({ kind: 'rxjs', module: modulePath });
  expect(record.example.parameters).toEqual(parameters);
  const run = flowOf(model, record.example.parameters);
  expect(run.family).toBe('flow');
  expect(run.diagram?.marbles.lines.map(({ label }) => label)).toEqual([
    'orders$',
    'work(order 31)',
    'work(order 32)',
    'work(order 33)',
    'work(order 34)',
    'session1$',
    'session2$',
    'session3$',
  ]);
  // Every placeholder the prose names has a value at every step.
  const prose = [
    record.visual.textEquivalent,
    record.example.description,
    ...record.mechanism.steps.map(({ text }) => text),
    ...record.limits,
  ];
  for (const frame of run.flow.frames)
    for (const name of prose.flatMap(placeholdersIn)) expect(frame.values).toHaveProperty(name);
});

it('sends the same orders at the same frames to the same three sessions as the topic study', () => {
  expect(example.inputs['orders$']).toEqual(topic.example.inputs['orders$']);
  const receivers = (nodes: typeof flow.nodes) =>
    nodes.filter(({ stage }) => stage === 2).map(({ id, label }) => ({ id, label }));
  expect(receivers(flow.nodes)).toEqual(receivers(topic.flow.nodes));
  expect(Object.keys(example.outputs)).toEqual(Object.keys(topic.example.outputs));
  expect(receivers(flow.nodes)).toHaveLength(parameters.consumers);
  // Only the channel's delivery rule differs. At step 2, where order 31 first reaches the
  // sessions, the topic gives it to all three and the queue to one.
  const queue = flowOf(model, parameters);
  const copies = flowOf(topic.model, topicParameters);
  expect(deliveries(copies, 'topic').filter(({ step }) => step === 2)).toHaveLength(3);
  expect(deliveries(queue, 'queue').filter(({ step }) => step === 2)).toEqual([
    { step: 2, key: 'a', session: 'session1' },
  ]);
  // Over the whole run: four deliveries here against twelve copies there.
  expect(deliveries(queue, 'queue')).toHaveLength(4);
  expect(deliveries(copies, 'topic')).toHaveLength(12);
});

it('gives each order to exactly one session and takes every order', () => {
  const run = flowOf(model, parameters);
  const sent = run.flow.frames.flatMap(({ hops }) =>
    hops.filter(({ link }) => link === 'send').map(({ key }) => key),
  );
  expect(sent).toEqual(['a', 'b', 'c', 'd']);
  const taken = deliveries(run, 'queue');
  expect(taken.map(({ key }) => key).sort()).toEqual(sent);
  for (const key of sent) expect(taken.filter((delivery) => delivery.key === key)).toHaveLength(1);
  // Who takes which order, and when: each one step after it is sent, but order 34 later.
  expect(taken).toEqual([
    { step: 2, key: 'a', session: 'session1' },
    { step: 4, key: 'b', session: 'session2' },
    { step: 6, key: 'c', session: 'session3' },
    { step: 9, key: 'd', session: 'session2' },
  ]);
  for (const session of sessions)
    expect(taken.some((delivery) => delivery.session === session)).toBe(true);
  expect(run.flow.frames[12].values['held']).toBe(
    'Session 1 holds a; Session 2 holds b, d; Session 3 holds c',
  );
});

it('does one thing at each step: an order goes in, or one comes out', () => {
  const run = flowOf(model, parameters);
  for (const { step, hops } of run.flow.frames)
    expect(hops.length, `step ${step}`).toBeLessThanOrEqual(1);
  const sending = run.flow.frames.filter(({ hops }) => hops.some(({ link }) => link === 'send'));
  expect(sending.map(({ step }) => step)).toEqual([1, 3, 5, 7]);
});

it('holds an order while every session is busy and releases it to the first one free', () => {
  const run = flowOf(model, parameters);
  // Each order waits in the queue from the step it arrives until a session is given it.
  for (const [step, keys] of [
    [1, ['a']],
    [3, ['b']],
    [5, ['c']],
    [7, ['d']],
    [8, ['d']],
  ] as const)
    expect(heldAt(run, step, 'queue'), `step ${step}`).toEqual(keys);
  for (const step of [0, 2, 4, 6, 9, 10, 11, 12])
    expect(heldAt(run, step, 'queue'), `step ${step}`).toEqual([]);
  // At step 8 nothing moves: order 34 waits, as all three sessions are working.
  expect(run.flow.frames[8].hops).toEqual([]);
  for (const session of sessions)
    expect(run.flow.frames[8].states[session], session).toMatch(/^working on/);
  // At step 9 Session 1, first in a strict rotation, is still busy with order 31, and the queue
  // gives order 34 to Session 2, which has just finished.
  expect(run.flow.frames[9].states['session1']).toBe('working on 31');
  expect(run.flow.frames[9].states['session2']).toBe('working on 34');
  expect(run.flow.frames[9].values['moves']).toBe(
    'd (order 34) moves from Order queue to Session 2',
  );
});

it('works each order for its own time and finishes them out of sequence', () => {
  const lines = flowOf(model, parameters).diagram?.marbles.lines ?? [];
  const work = lines.filter(({ role }) => role === 'inner');
  // Each work stream runs from the frame its order is taken to the frame it completes.
  const lengths = work.map(
    ({ subscribedAt = 0, unsubscribedAt = 0 }) => unsubscribedAt - subscribedAt,
  );
  expect(lengths).toEqual([9, 5, 4, 3]);
  expect(`${lengths.slice(0, -1).join(', ')} and ${lengths[lengths.length - 1]}`).toBe(
    parameters.work,
  );
  expect(work.every(({ cancelled }) => !cancelled)).toBe(true);
  // Order 33 is finished before order 31, though order 31 was taken first.
  const finished = (label: string) => work.find((line) => line.label === label)?.unsubscribedAt;
  expect(finished('work(order 33)')).toBeLessThan(finished('work(order 31)') ?? 0);
});

it('opens at the start and names its moments', () => {
  const run = flowOf(model, parameters);
  expect(run.initialStep).toBe(0);
  expect(run.moments).toEqual([
    { label: 'Order 31 sent', step: 1 },
    { label: 'One session gets it', step: 2 },
    { label: 'Order 34 waits', step: 7 },
    { label: 'First free takes 34', step: 9 },
    { label: 'All done', step: 12 },
  ]);
  expect(run.flow.frames.map(({ step }) => step)).toEqual(
    Array.from({ length: 13 }, (_, step) => step),
  );
  expect(run.legend.map(({ tone }) => tone)).toEqual(['subject', 'other', 'actual', 'muted']);
});

// The drawn example leaves the planner's queue open. The same pipeline over the same orders, the
// planner ending on its last one, gives each order to the same one session at the same frame, and
// every session's stream completes when the queue has handed on its last order, at frame 9.
it('completes once the planner stops and the queue is empty: the same takers, then the end', () => {
  expectMarbleExample({
    ...example,
    inputs: {
      orders$: { ...example.inputs['orders$'], marbles: '-a-b-c-(d|)', subscriptions: '^------!' },
    },
    outputs: {
      session1$: { ...example.outputs['session1$'], marbles: '--a------|' },
      session2$: { ...example.outputs['session2$'], marbles: '----b----(d|)' },
      session3$: { ...example.outputs['session3$'], marbles: '------c--|' },
    },
  });
});

import { concatMap, delay } from 'rxjs';
import type { RunHelpers } from 'rxjs/testing';
import { TestScheduler } from 'rxjs/testing';

import { loadFlowStudy } from '../../../../testing/src';
import { expectMarbleExample } from '../rxjs/marble-testing';
import type { FlowStudyModel, StudyModel } from '../study-model';
import { placeholdersIn } from '../study-text';
import { example, flow, model } from './message-dispatcher';

const path = 'libs/features/tools/src/lib/studies/eip/message-dispatcher.ts';
const parameters = { performers: 3, inflightLimit: 1, orders: 'orders 29, 30 and 31' };

const flowOf = (study: StudyModel): FlowStudyModel => {
  if (study.family !== 'flow') throw new Error('The dispatcher is drawn as a flow.');
  return study;
};

const run = flowOf(model(parameters));
const { frames, nodes } = run.flow;
const requests = example.inputs['requests$'];

/** The frames at which a message crosses a link whose id starts with `prefix`, by its letter. */
const crossedAt = (key: string, prefix: string) =>
  frames
    .filter(({ hops }) => hops.some((hop) => hop.key === key && hop.link.startsWith(prefix)))
    .map(({ step }) => step);

/** The letters of the messages a node holds after a frame. */
const heldBy = (node: string, frame: number) =>
  frames[frame].held[node]?.map(({ key }) => key) ?? [];

/**
 * Work that finishes, for runs that look past the end of the example: each request's job as cold
 * marbles, taken up at once and ended by a bar.
 */
const finishing: Readonly<Record<string, string>> = {
  'implement order 31': 'i----|',
  'fix order 30': 'f---|',
  'review order 29': 'r--|',
  'verify order 31': 'v-|',
  'verify order 30': 'x-|',
};

const coldJobs = (cold: RunHelpers['cold']) =>
  Object.fromEntries(Object.entries(finishing).map(([id, marbles]) => [id, cold(marbles)]));

const scheduler = () => new TestScheduler((actual, expected) => expect(actual).toEqual(expected));

it('runs the dispatcher example against the marbles both drawings show', () => {
  expectMarbleExample(example);
});

it('attaches the record to the Message Dispatcher row and reads its code from this module', async () => {
  const record = await loadFlowStudy('eip:175');
  expect(record.visual.model).toBe(path);
  expect(record.pseudocode.executable).toEqual({ kind: 'rxjs', module: path });
  expect(record.example.parameters).toEqual(parameters);
  const drawn = flowOf(model(record.example.parameters));
  expect(drawn.diagram?.marbles.lines.map(({ label }) => label)).toEqual([
    'requests$',
    'executor on 31',
    'reviewer on 29',
    'executor on 30',
    'verifier on 31',
    'handed$',
  ]);
  // Every frame of the diagram is a step of the flow, and the flow opens before anything moves.
  expect(drawn.flow.frames.map(({ step }) => step)).toEqual(
    drawn.diagram?.marbles.frames.map(({ frame }) => frame),
  );
  expect(drawn.initialStep).toBe(0);
  const names = [
    record.visual.textEquivalent,
    record.example.description,
    ...record.mechanism.steps.map(({ text }) => text),
    ...record.limits,
  ].flatMap(placeholdersIn);
  for (const frame of drawn.flow.frames)
    for (const name of names) expect(frame.values[name], name).toBeDefined();
  expect(drawn.flow.frames[4].values['inflightLimit']).toBe('1');
});

it('hands each request to the performer for its kind of work, and to no other', () => {
  // Each request reaches the dispatcher the frame it is sent, and is read the frame after.
  expect(['i', 'f', 'r', 'v'].map((key) => crossedAt(key, 'take'))).toEqual([[1], [3], [5], [8]]);
  expect(['i', 'f', 'r', 'v'].map((key) => crossedAt(key, 'to-'))).toEqual([[2], [7], [6], [9]]);
  const handedTo = frames.flatMap(({ hops }) =>
    hops.filter(({ link }) => link.startsWith('to-')).map(({ key, link }) => `${key} ${link}`),
  );
  expect(handedTo).toEqual(['i to-executor', 'r to-reviewer', 'f to-executor', 'v to-verifier']);
  expect(frames[2].values['moves']).toBe(
    'i (implement order 31) moves from Dispatcher to Executor',
  );
  expect(frames[9].values['delivered']).toBe(
    'i (implement order 31), r (review order 29), f (fix order 30), v (verify order 31)',
  );
});

it('moves one request at a time, and pauses only where the dispatcher keeps one waiting', () => {
  expect(frames.map(({ hops }) => hops.length)).toEqual([0, 1, 1, 1, 0, 1, 1, 1, 1, 1]);
  expect(frames[4].states['dispatcher']).toBe('f waiting for the executor');
});

it('keeps f waiting for the busy executor, though the verifier and the reviewer are idle', () => {
  for (const frame of [4, 5, 6]) expect(heldBy('dispatcher', frame)).toContain('f');
  expect(frames[4].states['verifier']).toBe('idle');
  expect(frames[4].states['reviewer']).toBe('idle');
  expect(heldBy('executor', 4)).toEqual(['i']);
  // The queue is released the frame the executor finishes order 31.
  const executor = run.diagram?.marbles.lines.find(({ label }) => label === 'executor on 31');
  expect(executor).toMatchObject({ subscribedAt: 2, unsubscribedAt: 7, cancelled: false });
  expect(heldBy('dispatcher', 7)).toEqual([]);
  expect(heldBy('executor', 7)).toEqual(['f']);
});

it('lets r overtake f, which one queue for every request would not', () => {
  expect(crossedAt('f', 'take')[0]).toBeLessThan(crossedAt('r', 'take')[0]);
  expect(crossedAt('r', 'to-')[0]).toBeLessThan(crossedAt('f', 'to-')[0]);
  // Read in arrival order by one consumer, the review waits for both of the executor's jobs.
  scheduler().run(({ hot, cold, expectSubscriptions }) => {
    const jobs = coldJobs(cold);
    hot(requests.marbles, requests.values)
      .pipe(
        delay(1),
        concatMap((request) => jobs[String(request)]),
      )
      .subscribe();
    expectSubscriptions(jobs['review order 29'].subscriptions).toBe('-----------^--!');
  });
  // With the dispatcher and the same work, the reviewer starts it at once.
  const testScheduler = scheduler();
  testScheduler.run(({ hot, cold, expectSubscriptions }) => {
    const jobs = coldJobs(cold);
    const { handed$ } = example.run({
      inputs: { requests$: hot(requests.marbles, requests.values) },
      inner: jobs,
      scheduler: testScheduler,
    });
    handed$.subscribe();
    expectSubscriptions(jobs['review order 29'].subscriptions).toBe('------^--!');
    expectSubscriptions(jobs['fix order 30'].subscriptions).toBe('-------^---!');
  });
});

it('knows kinds of work, not orders: a verify sent during its own fix goes straight to the verifier', () => {
  const testScheduler = scheduler();
  testScheduler.run(({ hot, cold, expectSubscriptions }) => {
    const jobs = coldJobs(cold);
    const early$ = hot('-i-f-r--x', { ...requests.values, x: 'verify order 30' });
    const { handed$ } = example.run({
      inputs: { requests$: early$ },
      inner: jobs,
      scheduler: testScheduler,
    });
    handed$.subscribe();
    // The verifier checks order 30 from frame 9 while the executor is still fixing it until 11.
    expectSubscriptions(jobs['fix order 30'].subscriptions).toBe('-------^---!');
    expectSubscriptions(jobs['verify order 30'].subscriptions).toBe('---------^-!');
  });
});

it('names every token and box in its caption and stays legible at a narrow width', () => {
  for (const key of Object.keys(requests.values ?? {}))
    expect(flow.caption, key).toMatch(new RegExp(`(^|[\\s,:])${key}[\\s,]`));
  for (const { label } of nodes) expect(flow.caption, label).toContain(label);
  expect(new Set(nodes.map(({ stage }) => stage)).size).toBeLessThanOrEqual(4);
  expect(nodes.length).toBeLessThanOrEqual(8);
  for (const { label } of nodes) {
    const words = label.split(' ');
    expect(words.length).toBeLessThanOrEqual(2);
    for (const word of words) expect(word.length).toBeLessThanOrEqual(10);
  }
  expect(nodes.filter(({ tone }) => tone === 'subject').map(({ id }) => id)).toEqual([
    'dispatcher',
  ]);
  expect(nodes.find(({ id }) => id === 'requests')?.kind).toBe('channel');
  for (const { states } of frames)
    for (const text of Object.values(states)) expect(text.length).toBeLessThanOrEqual(40);
  expect(frames.map(({ note }) => note)).toEqual(frames.map(({ step }) => example.notes?.[step]));
  expect(run.moments.map(({ label, step }) => `${label} ${step}`)).toEqual([
    'Handed over 2',
    'Kept waiting 4',
    'Overtaken 6',
    'Queue released 7',
    'All busy 9',
  ]);
});

// The drawn example ends with every performer still busy and the request channel open. The same
// pipeline over the same requests, the channel ending on its last one and each piece of work
// ending as it starts, hands the same requests to the same performers at the same frames and then
// completes.
it('completes once the requests stop and the work is done: the same hand-overs, then the end', () => {
  const inner = example.inner ?? {};
  expectMarbleExample({
    ...example,
    inputs: { requests$: { ...example.inputs['requests$'], marbles: '-i-f-r--(v|)' } },
    inner: {
      ...inner,
      'review order 29': {
        ...inner['review order 29'],
        marbles: '(r|)',
        subscriptions: '------(^!)',
      },
      'fix order 30': { ...inner['fix order 30'], marbles: '(f|)', subscriptions: '-------(^!)' },
      'verify order 31': {
        ...inner['verify order 31'],
        marbles: '(v|)',
        subscriptions: '---------(^!)',
      },
    },
    outputs: { handed$: { ...example.outputs['handed$'], marbles: '--i---rf-(v|)' } },
  });
});

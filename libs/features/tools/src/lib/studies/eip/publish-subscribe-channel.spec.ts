import type { StudyParameters } from '@dotln-angular/models';

import { loadFlowStudy } from '../../../../testing/src';
import { flowFromMarbles } from '../flow';
import { expectMarbleExample } from '../rxjs/marble-testing';
import type { MarbleExample } from '../rxjs/marbles';
import type { FlowStudyModel, StudyModelFunction } from '../study-model';
import { placeholdersIn } from '../study-text';
import { example, flow, model } from './publish-subscribe-channel';

/** A study's run, which a flow study's model always draws as a flow. */
function flowOf(study: StudyModelFunction, values: StudyParameters): FlowStudyModel {
  const run = study(values);
  if (run.family !== 'flow') throw new Error('The study is not drawn as a flow.');
  return run;
}

const modulePath = 'libs/features/tools/src/lib/studies/eip/publish-subscribe-channel.ts';
const parameters = { orders: '31 to 34', subscribers: 3, lateJoin: 7 };
const sessions = ['session1', 'session2', 'session3'];

/** The letters that cross one link at each step, by step. */
const crossing = (run: FlowStudyModel, link: string) =>
  run.flow.frames.map(({ hops }) => hops.filter((hop) => hop.link === link).map(({ key }) => key));

/** Every letter that crosses one link over the whole run, in order. */
const received = (run: FlowStudyModel, link: string) => crossing(run, link).flat();

/** The steps at which anything crosses one link. */
const stepsOn = (run: FlowStudyModel, link: string) =>
  crossing(run, link).flatMap((keys, step) => (keys.length ? [step] : []));

/** The letters a node holds after a step. */
const heldAt = (run: FlowStudyModel, step: number, node: string) =>
  (run.flow.frames[step].held[node] ?? []).map(({ key }) => key);

it('runs the topic example against the marbles both drawings show', () => {
  expectMarbleExample(example);
});

it('attaches the record to the Publish-Subscribe Channel row and reads this module', async () => {
  const record = await loadFlowStudy('eip:65');
  expect(record.visual.model).toBe(modulePath);
  expect(record.pseudocode.executable).toEqual({ kind: 'rxjs', module: modulePath });
  expect(record.example.parameters).toEqual(parameters);
  const run = flowOf(model, record.example.parameters);
  expect(run.family).toBe('flow');
  expect(run.diagram?.marbles.lines.map(({ label }) => label)).toEqual([
    'orders$',
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

it('gives every subscriber a copy of every order the planner publishes once', () => {
  const run = flowOf(model, parameters);
  // The planner publishes each order once, onto the topic, on the odd steps.
  expect(received(run, 'publish')).toEqual(['a', 'b', 'c', 'd']);
  expect(stepsOn(run, 'publish')).toEqual([1, 3, 5, 7]);
  expect(run.diagram?.marbles.lines.find(({ id }) => id === 'orders$')).toMatchObject({
    subscribedAt: 0,
    cancelled: false,
  });
  // Every subscriber receives every order, on the step after the planner publishes it.
  expect(flow.links.filter(({ from }) => from === 'topic')).toHaveLength(parameters.subscribers);
  for (const session of sessions) {
    expect(received(run, `to-${session}`)).toEqual(['a', 'b', 'c', 'd']);
    expect(stepsOn(run, `to-${session}`)).toEqual([2, 4, 6, 8]);
  }
  // One publication, three copies: four orders become twelve deliveries.
  const copies = sessions.flatMap((session) => received(run, `to-${session}`));
  expect(copies).toHaveLength(4 * parameters.subscribers);
  expect(run.flow.frames[2].values['moves']).toBe(
    'a (order 31) moves from Order topic to Session 1; a (order 31) moves from Order topic to Session 2; a (order 31) moves from Order topic to Session 3',
  );
  for (const session of sessions)
    expect(heldAt(run, 8, session), session).toEqual(['a', 'b', 'c', 'd']);
});

it('does one thing at each step: an order goes in, or its copies come out', () => {
  const run = flowOf(model, parameters);
  for (const { step, hops } of run.flow.frames) {
    const publishing = hops.some(({ link }) => link === 'publish');
    const copying = hops.some(({ link }) => link !== 'publish');
    expect(publishing && copying, `step ${step}`).toBe(false);
  }
});

it('keeps nothing: the topic holds an order only until its copies go out', () => {
  const run = flowOf(model, parameters);
  expect([1, 3, 5, 7].map((step) => heldAt(run, step, 'topic'))).toEqual([
    ['a'],
    ['b'],
    ['c'],
    ['d'],
  ]);
  for (const step of [0, 2, 4, 6, 8])
    expect(heldAt(run, step, 'topic'), `step ${step}`).toEqual([]);
  expect(run.flow.frames[8].values['held']).toBe(
    'Session 1 holds a, b, c, d; Session 2 holds a, b, c, d; Session 3 holds a, b, c, d',
  );
});

it('opens at the start and names its moments', () => {
  const run = flowOf(model, parameters);
  expect(run.initialStep).toBe(0);
  expect(run.moments).toEqual([
    { label: 'Order 31 published', step: 1 },
    { label: 'A copy to every session', step: 2 },
    { label: 'Order 34 to all three', step: 8 },
  ]);
  expect(run.flow.frames.map(({ step }) => step)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  expect(run.legend.map(({ tone }) => tone)).toEqual(['subject', 'other', 'actual', 'muted']);
});

it('gives a session that subscribes late only what is published after it joins', () => {
  // The same topic and orders, with Session 3 subscribing after order 33's copies have gone out.
  const late: MarbleExample = {
    ...example,
    outputs: {
      ...example.outputs,
      session3$: {
        label: 'session3$',
        marbles: '--------d',
        values: { d: 'order 34' },
        subscriptions: `${'-'.repeat(parameters.lateJoin)}^`,
      },
    },
  };
  expectMarbleExample(late);
  // Session 3's box holds only what it received: nothing until d.
  const run = flowFromMarbles(
    late,
    {
      ...flow,
      held: Object.fromEntries(
        Object.entries(flow.held ?? {}).map(([at, holding]) => [
          at,
          'session3' in holding ? { ...holding, session3: Number(at) >= 8 ? ['d'] : [] } : holding,
        ]),
      ),
    },
    parameters,
  );
  expect(received(run, 'to-session3')).toEqual(['d']);
  expect([2, 4, 6].map((step) => heldAt(run, step, 'session3'))).toEqual([[], [], []]);
  expect(heldAt(run, 8, 'session3')).toEqual(['d']);
  expect(received(run, 'to-session1')).toEqual(['a', 'b', 'c', 'd']);
  expect(run.diagram?.marbles.lines.find(({ id }) => id === 'session3$')?.subscribedAt).toBe(
    parameters.lateJoin,
  );
  // The planner publishes exactly as before: a late subscriber changes nothing upstream.
  expect(received(run, 'publish')).toEqual(received(flowOf(model, parameters), 'publish'));
});

// The drawn example leaves the planner's topic open. The same pipeline over the same orders, the
// planner ending on its last one, gives every session the same copies at the same frames and then
// completes each session's stream.
it('completes once the planner stops: every session gets every copy, then the end', () => {
  const ended = '--a-b-c-(d|)';
  expectMarbleExample({
    ...example,
    inputs: {
      orders$: { ...example.inputs['orders$'], marbles: '-a-b-c-(d|)', subscriptions: '^------!' },
    },
    outputs: {
      session1$: { ...example.outputs['session1$'], marbles: ended },
      session2$: { ...example.outputs['session2$'], marbles: ended },
      session3$: { ...example.outputs['session3$'], marbles: ended },
    },
  });
});

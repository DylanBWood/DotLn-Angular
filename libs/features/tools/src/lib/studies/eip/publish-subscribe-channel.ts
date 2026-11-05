import { delay, share } from 'rxjs';

import { flowFromMarbles, type MarbleFlow } from '../flow';
import type { MarbleExample } from '../rxjs/marbles';
import type { StudyModelFunction } from '../study-model';

/** What the planner publishes, by the letter the marble strings use. */
const orders = {
  a: 'order 31',
  b: 'order 32',
  c: 'order 33',
  d: 'order 34',
} as const;

const outputs: MarbleExample['outputs'] = {
  session1$: {
    label: 'studyEip.publish-subscribe-channel.model.example.outputs.session1.label',
    marbles: '--a-b-c-d',
    values: orders,
    valueMessages: {
      a: 'studyEip.publish-subscribe-channel.model.example.outputs.session1.values.a',
      b: 'studyEip.publish-subscribe-channel.model.example.outputs.session1.values.b',
      c: 'studyEip.publish-subscribe-channel.model.example.outputs.session1.values.c',
      d: 'studyEip.publish-subscribe-channel.model.example.outputs.session1.values.d',
    },
  },
  session2$: {
    label: 'studyEip.publish-subscribe-channel.model.example.outputs.session2.label',
    marbles: '--a-b-c-d',
    values: orders,
    valueMessages: {
      a: 'studyEip.publish-subscribe-channel.model.example.outputs.session2.values.a',
      b: 'studyEip.publish-subscribe-channel.model.example.outputs.session2.values.b',
      c: 'studyEip.publish-subscribe-channel.model.example.outputs.session2.values.c',
      d: 'studyEip.publish-subscribe-channel.model.example.outputs.session2.values.d',
    },
  },
  session3$: {
    label: 'studyEip.publish-subscribe-channel.model.example.outputs.session3.label',
    marbles: '--a-b-c-d',
    values: orders,
    valueMessages: {
      a: 'studyEip.publish-subscribe-channel.model.example.outputs.session3.values.a',
      b: 'studyEip.publish-subscribe-channel.model.example.outputs.session3.values.b',
      c: 'studyEip.publish-subscribe-channel.model.example.outputs.session3.values.c',
      d: 'studyEip.publish-subscribe-channel.model.example.outputs.session3.values.d',
    },
  },
};

/** Count the declared protocol values; the marble assertion checks each delivery against the run. */
export const copyTotals = (
  sent: Readonly<Record<string, unknown>>,
  delivered: MarbleExample['outputs'],
) => ({
  orders: Object.keys(sent).length,
  subscribers: Object.keys(delivered).length,
  copies: Object.values(delivered).reduce(
    (sum, stream) => sum + Object.keys(stream.values ?? {}).length,
    0,
  ),
});

const totals = copyTotals(orders, outputs);

/**
 * The planner publishes four orders on a topic to which three sessions subscribe from the start.
 * Each order reaches the topic on one frame, and on the next the topic gives every session its own
 * copy and keeps none, so each session ends with all four. The Competing Consumers study sends the
 * same orders at the same frames to the same three sessions over a queue. The strings here are
 * what the spec beside this file asserts and what both drawings read.
 */
export const example: MarbleExample = {
  inputs: {
    orders$: {
      label: 'studyEip.publish-subscribe-channel.model.example.inputs.orders.label',
      // Hot: the planner publishes at its own pace, whether or not anyone is listening.
      hot: true,
      marbles: '-a-b-c-d',
      values: orders,
      // However many sessions listen, the planner's stream is subscribed to once.
      subscriptions: '^',

      valueMessages: {
        a: 'studyEip.publish-subscribe-channel.model.example.inputs.orders.values.a',
        b: 'studyEip.publish-subscribe-channel.model.example.inputs.orders.values.b',
        c: 'studyEip.publish-subscribe-channel.model.example.inputs.orders.values.c',
        d: 'studyEip.publish-subscribe-channel.model.example.inputs.orders.values.d',
      },
    },
  },
  operator: 'studyEip.publish-subscribe-channel.model.example.operator',
  outputs,
  run: ({ inputs: { orders$ } }) => {
    const copies$ = orders$.pipe(
      // delay(1): the topic hands an order on one step after the planner publishes it.
      delay(1),
      // share() is the channel: it copies each order to every subscriber and keeps none.
      share(),
    );
    // Each session is one subscriber to the topic, and the spec subscribes all three at frame 0.
    return { session1$: copies$, session2$: copies$, session3$: copies$ };
  },
  moments: [
    {
      label: 'studyEip.publish-subscribe-channel.model.example.moments.0.label',
      frame: 1,
    },
    {
      label: 'studyEip.publish-subscribe-channel.model.example.moments.1.label',
      frame: 2,
    },
    {
      label: 'studyEip.publish-subscribe-channel.model.example.moments.2.label',
      frame: 8,
    },
  ],
  notes: {
    0: 'studyEip.publish-subscribe-channel.model.example.notes.0',
    1: 'studyEip.publish-subscribe-channel.model.example.notes.1',
    2: 'studyEip.publish-subscribe-channel.model.example.notes.2',
    3: 'studyEip.publish-subscribe-channel.model.example.notes.3',
    4: {
      key: 'studyEip.publish-subscribe-channel.model.example.notes.4',
      params: { subscribers: totals.subscribers },
    },
    5: 'studyEip.publish-subscribe-channel.model.example.notes.5',
    6: {
      key: 'studyEip.publish-subscribe-channel.model.example.notes.6',
      params: { subscribers: totals.subscribers },
    },
    7: 'studyEip.publish-subscribe-channel.model.example.notes.7',
    8: {
      key: 'studyEip.publish-subscribe-channel.model.example.notes.8',
      params: { subscribers: totals.subscribers, orders: totals.orders, copies: totals.copies },
    },
  },
  caption: 'studyEip.publish-subscribe-channel.model.example.caption',

  parameterMessages: {
    orders: 'studyEip.publish-subscribe-channel.record.parameters.orders',
  },
};

/**
 * The planner, the topic the pattern is about, and the three sessions subscribed to it. An order
 * crosses into the topic on one step and its copies cross out to the sessions on the next.
 */
export const flow: MarbleFlow = {
  nodes: [
    {
      id: 'planner',
      label: 'studyEip.publish-subscribe-channel.model.flow.nodes.0.label',
      stage: 0,
      row: 1,
    },
    {
      id: 'topic',
      label: 'studyEip.publish-subscribe-channel.model.flow.nodes.1.label',
      stage: 1,
      row: 1,
      kind: 'channel',
      tone: 'subject',
    },
    {
      id: 'session1',
      label: 'studyEip.publish-subscribe-channel.model.flow.nodes.2.label',
      stage: 2,
      row: 0,
    },
    {
      id: 'session2',
      label: 'studyEip.publish-subscribe-channel.model.flow.nodes.3.label',
      stage: 2,
      row: 1,
    },
    {
      id: 'session3',
      label: 'studyEip.publish-subscribe-channel.model.flow.nodes.4.label',
      stage: 2,
      row: 2,
    },
  ],
  links: [
    { id: 'publish', from: 'planner', to: 'topic' },
    { id: 'to-session1', from: 'topic', to: 'session1' },
    { id: 'to-session2', from: 'topic', to: 'session2' },
    { id: 'to-session3', from: 'topic', to: 'session3' },
  ],
  routes: {
    orders$: 'publish',
    session1$: 'to-session1',
    session2$: 'to-session2',
    session3$: 'to-session3',
  },
  // Each box says what that box does; the tokens inside it say which orders it has.
  states: {
    0: {
      planner: 'studyEip.publish-subscribe-channel.model.flow.states.0.planner',
      topic: {
        key: 'studyEip.publish-subscribe-channel.model.flow.states.0.topic',
        params: { subscribers: totals.subscribers },
      },
      session1: 'studyEip.publish-subscribe-channel.model.flow.states.0.session1',
      session2: 'studyEip.publish-subscribe-channel.model.flow.states.0.session2',
      session3: 'studyEip.publish-subscribe-channel.model.flow.states.0.session3',
    },
  },
  // The topic has an order only from its arriving until its copies go out; a session keeps every
  // copy it receives.
  held: {
    1: { topic: ['a'] },
    2: { topic: [], session1: ['a'], session2: ['a'], session3: ['a'] },
    3: { topic: ['b'] },
    4: {
      topic: [],
      session1: ['a', 'b'],
      session2: ['a', 'b'],
      session3: ['a', 'b'],
    },
    5: { topic: ['c'] },
    6: {
      topic: [],
      session1: ['a', 'b', 'c'],
      session2: ['a', 'b', 'c'],
      session3: ['a', 'b', 'c'],
    },
    7: { topic: ['d'] },
    8: {
      topic: [],
      session1: ['a', 'b', 'c', 'd'],
      session2: ['a', 'b', 'c', 'd'],
      session3: ['a', 'b', 'c', 'd'],
    },
  },
  caption: {
    key: 'studyEip.publish-subscribe-channel.model.flow.caption',
    params: { subscribers: totals.subscribers },
  },
};

export const model: StudyModelFunction = (parameters, t) =>
  flowFromMarbles(example, flow, parameters, t);

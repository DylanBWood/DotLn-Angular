import { delay, share } from 'rxjs';

import { flowFromMarbles, type MarbleFlow } from '../flow';
import type { MarbleExample } from '../rxjs/marbles';
import type { StudyModelFunction } from '../study-model';

/** What the planner publishes, by the letter the marble strings use. */
const orders = { a: 'order 31', b: 'order 32', c: 'order 33', d: 'order 34' } as const;

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
      label: 'orders$',
      // Hot: the planner publishes at its own pace, whether or not anyone is listening.
      hot: true,
      marbles: '-a-b-c-d',
      values: orders,
      // However many sessions listen, the planner's stream is subscribed to once.
      subscriptions: '^',
    },
  },
  operator: 'orders$.pipe(delay(1), share())',
  outputs: {
    session1$: { label: 'session1$', marbles: '--a-b-c-d', values: orders },
    session2$: { label: 'session2$', marbles: '--a-b-c-d', values: orders },
    session3$: { label: 'session3$', marbles: '--a-b-c-d', values: orders },
  },
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
    { label: 'Order 31 published', frame: 1 },
    { label: 'A copy to every session', frame: 2 },
    { label: 'Order 34 to all three', frame: 8 },
  ],
  notes: {
    0: 'Sessions 1, 2 and 3 have subscribed to the Order topic. The planner has published nothing yet.',
    1: 'The planner publishes order 31 to the Order topic, once. It does not know who is subscribed.',
    2: 'The Order topic gives a copy of order 31 to Session 1, Session 2 and Session 3, and keeps no copy itself.',
    3: 'The planner publishes order 32 to the Order topic.',
    4: 'The Order topic gives a copy of order 32 to each of the three sessions. Each session now has its own copies of orders 31 and 32.',
    5: 'The planner publishes order 33 to the Order topic.',
    6: 'The Order topic gives a copy of order 33 to each of the three sessions.',
    7: 'The planner publishes order 34 to the Order topic, exactly as it published order 31.',
    8: 'The Order topic gives a copy of order 34 to each of the three sessions. Every session has received every order: four orders, twelve copies.',
  },
  caption:
    'Time runs in frames. orders$ is what the planner publishes: a, b, c and d are orders 31, 32, 33 and 34. Each lane below the band is one session, subscribed from frame 0, and every session receives every order one frame after the planner publishes it.',
};

/**
 * The planner, the topic the pattern is about, and the three sessions subscribed to it. An order
 * crosses into the topic on one step and its copies cross out to the sessions on the next.
 */
export const flow: MarbleFlow = {
  nodes: [
    { id: 'planner', label: 'Planner', stage: 0, row: 1 },
    { id: 'topic', label: 'Order topic', stage: 1, row: 1, kind: 'channel', tone: 'subject' },
    { id: 'session1', label: 'Session 1', stage: 2, row: 0 },
    { id: 'session2', label: 'Session 2', stage: 2, row: 1 },
    { id: 'session3', label: 'Session 3', stage: 2, row: 2 },
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
      planner: 'knows no subscriber',
      topic: 'copies each order to all three',
      session1: 'subscribed',
      session2: 'subscribed',
      session3: 'subscribed',
    },
  },
  // The topic has an order only from its arriving until its copies go out; a session keeps every
  // copy it receives.
  held: {
    1: { topic: ['a'] },
    2: { topic: [], session1: ['a'], session2: ['a'], session3: ['a'] },
    3: { topic: ['b'] },
    4: { topic: [], session1: ['a', 'b'], session2: ['a', 'b'], session3: ['a', 'b'] },
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
  caption:
    'Each token is one order: a is order 31, b 32, c 33 and d 34. The Planner is the role that files orders; the Order topic, drawn as a pipe, is the publish-subscribe channel; Sessions 1, 2 and 3 are three agent sessions subscribed to it. A token inside the topic is an order it is about to copy, and the tokens inside a session are the copies that session has received. The words in a box say what that box does. A token is green while it moves, and a box a token leaves or reaches is outlined in green. The Planner publishes an order on one step, and on the next the topic hands out its copies, one to every session.',
};

export const model: StudyModelFunction = (parameters) => flowFromMarbles(example, flow, parameters);

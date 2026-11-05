import {
  delay,
  endWith,
  filter,
  map,
  mergeMap,
  type Observable,
  share,
  startWith,
  Subject,
  zip,
} from 'rxjs';

import { flowFromMarbles, type MarbleFlow } from '../flow';
import type { MarbleExample } from '../rxjs/marbles';
import type { StudyModelFunction } from '../study-model';

/** What the planner sends, by the letter the marble strings use. */
const orders = {
  a: 'order 31',
  b: 'order 32',
  c: 'order 33',
  d: 'order 34',
} as const;

const outputs: MarbleExample['outputs'] = {
  session1$: {
    label: 'studyEip.competing-consumers.model.example.outputs.session1.label',
    marbles: '--a',
    values: { a: orders.a },
    valueMessages: {
      a: 'studyEip.competing-consumers.model.example.outputs.session1.values.a',
    },
  },
  session2$: {
    label: 'studyEip.competing-consumers.model.example.outputs.session2.label',
    marbles: '----b----d',
    values: { b: orders.b, d: orders.d },
    valueMessages: {
      b: 'studyEip.competing-consumers.model.example.outputs.session2.values.b',
      d: 'studyEip.competing-consumers.model.example.outputs.session2.values.d',
    },
  },
  session3$: {
    label: 'studyEip.competing-consumers.model.example.outputs.session3.label',
    marbles: '------c',
    values: { c: orders.c },
    valueMessages: {
      c: 'studyEip.competing-consumers.model.example.outputs.session3.values.c',
    },
  },
};

const orderCount = Object.keys(orders).length;
const receiverCount = Object.keys(outputs).length;
const deliveryCount = Object.values(outputs).reduce(
  (sum, stream) => sum + Object.keys(stream.values ?? {}).length,
  0,
);

/**
 * The planner sends the same four orders as in the Publish-Subscribe Channel study, at the same
 * frames and to the same three sessions, but over a queue. From the frame after an order arrives,
 * the queue gives it to the session that has been free longest, and to no other; that session
 * works on it for as long as the order's work lasts and is free again when the work completes.
 * The strings here are what the spec beside this file asserts and what both drawings read.
 */
export const example: MarbleExample = {
  inputs: {
    orders$: {
      label: 'studyEip.competing-consumers.model.example.inputs.orders.label',
      // Hot: the planner sends at its own pace, whether or not a session is free.
      hot: true,
      marbles: '-a-b-c-d',
      values: orders,
      subscriptions: '^',

      valueMessages: {
        a: 'studyEip.competing-consumers.model.example.inputs.orders.values.a',
        b: 'studyEip.competing-consumers.model.example.inputs.orders.values.b',
        c: 'studyEip.competing-consumers.model.example.inputs.orders.values.c',
        d: 'studyEip.competing-consumers.model.example.inputs.orders.values.d',
      },
    },
  },
  // The work on an order: it emits nothing and completes when the order is done. Order 31 is the
  // longest piece of work, so the session given it first is the last of the first three to finish.
  inner: {
    'order 31': {
      label: 'studyEip.competing-consumers.model.example.inner.order-31.label',
      marbles: '---------|',
      subscriptions: '--^--------!',
    },
    'order 32': {
      label: 'studyEip.competing-consumers.model.example.inner.order-32.label',
      marbles: '-----|',
      subscriptions: '----^----!',
    },
    'order 33': {
      label: 'studyEip.competing-consumers.model.example.inner.order-33.label',
      marbles: '----|',
      subscriptions: '------^---!',
    },
    'order 34': {
      label: 'studyEip.competing-consumers.model.example.inner.order-34.label',
      marbles: '---|',
      subscriptions: '---------^--!',
    },
  },
  operator: 'studyEip.competing-consumers.model.example.operator',
  outputs,
  run: ({ inputs, inner }) => {
    // The orders are strings; the cast names their type for zip.
    const orders$ = inputs['orders$'] as Observable<string>;
    // Working an order emits nothing, so its stream is typed as one that never emits.
    const work = (order: string) => inner[order] as Observable<never>;

    // A session is free when it starts listening and again each time its work completes.
    const finished$ = new Subject<string>();
    const free$ = finished$.pipe(startWith('Session 1', 'Session 2', 'Session 3'));
    // delay(1): the queue hands an order on no sooner than one step after it arrives.
    const queued$ = orders$.pipe(delay(1));
    // zip is the queue: it pairs the oldest waiting order with the oldest free session.
    const taken$ = zip(queued$, free$).pipe(share());
    // mergeMap is each consumer at work; endWith frees that session when its work completes.
    taken$
      .pipe(mergeMap(([order, session]) => work(order).pipe(endWith(session))))
      .subscribe(finished$);

    // filter is the delivery: a session receives only the orders paired with its name.
    const takenBy = (session: string) =>
      taken$.pipe(
        filter(([, by]) => by === session),
        map(([order]) => order),
      );
    return {
      session1$: takenBy('Session 1'),
      session2$: takenBy('Session 2'),
      session3$: takenBy('Session 3'),
    };
  },
  moments: [
    {
      label: 'studyEip.competing-consumers.model.example.moments.0.label',
      frame: 1,
    },
    {
      label: 'studyEip.competing-consumers.model.example.moments.1.label',
      frame: 2,
    },
    {
      label: 'studyEip.competing-consumers.model.example.moments.2.label',
      frame: 7,
    },
    {
      label: 'studyEip.competing-consumers.model.example.moments.3.label',
      frame: 9,
    },
    {
      label: 'studyEip.competing-consumers.model.example.moments.4.label',
      frame: 12,
    },
  ],
  notes: {
    0: 'studyEip.competing-consumers.model.example.notes.0',
    1: 'studyEip.competing-consumers.model.example.notes.1',
    2: 'studyEip.competing-consumers.model.example.notes.2',
    3: 'studyEip.competing-consumers.model.example.notes.3',
    4: 'studyEip.competing-consumers.model.example.notes.4',
    5: 'studyEip.competing-consumers.model.example.notes.5',
    6: {
      key: 'studyEip.competing-consumers.model.example.notes.6',
      params: { consumers: receiverCount },
    },
    7: 'studyEip.competing-consumers.model.example.notes.7',
    8: {
      key: 'studyEip.competing-consumers.model.example.notes.8',
      params: { consumers: receiverCount },
    },
    9: 'studyEip.competing-consumers.model.example.notes.9',
    10: 'studyEip.competing-consumers.model.example.notes.10',
    11: 'studyEip.competing-consumers.model.example.notes.11',
    12: {
      key: 'studyEip.competing-consumers.model.example.notes.12',
      params: { orders: orderCount, deliveries: deliveryCount },
    },
  },
  caption: 'studyEip.competing-consumers.model.example.caption',

  parameterMessages: {
    orders: 'studyEip.competing-consumers.record.parameters.orders',
    work: 'studyEip.competing-consumers.record.parameters.work',
  },
};

/**
 * The planner, the queue the pattern is about, and the three sessions drawing from it. An order
 * crosses into the queue on one step and out to the one session that takes it on a later step.
 */
export const flow: MarbleFlow = {
  nodes: [
    {
      id: 'planner',
      label: 'studyEip.competing-consumers.model.flow.nodes.0.label',
      stage: 0,
      row: 1,
    },
    {
      id: 'queue',
      label: 'studyEip.competing-consumers.model.flow.nodes.1.label',
      stage: 1,
      row: 1,
      kind: 'channel',
      tone: 'subject',
    },
    {
      id: 'session1',
      label: 'studyEip.competing-consumers.model.flow.nodes.2.label',
      stage: 2,
      row: 0,
    },
    {
      id: 'session2',
      label: 'studyEip.competing-consumers.model.flow.nodes.3.label',
      stage: 2,
      row: 1,
    },
    {
      id: 'session3',
      label: 'studyEip.competing-consumers.model.flow.nodes.4.label',
      stage: 2,
      row: 2,
    },
  ],
  links: [
    { id: 'send', from: 'planner', to: 'queue' },
    { id: 'to-session1', from: 'queue', to: 'session1' },
    { id: 'to-session2', from: 'queue', to: 'session2' },
    { id: 'to-session3', from: 'queue', to: 'session3' },
  ],
  // The work streams cross no link: they only say when a session is free again.
  routes: {
    orders$: 'send',
    session1$: 'to-session1',
    session2$: 'to-session2',
    session3$: 'to-session3',
  },
  // Each box says what that box does or is doing; the tokens inside it say which orders it has.
  states: {
    0: {
      planner: 'studyEip.competing-consumers.model.flow.states.0.planner',
      queue: 'studyEip.competing-consumers.model.flow.states.0.queue',
      session1: 'studyEip.competing-consumers.model.flow.states.0.session1',
      session2: 'studyEip.competing-consumers.model.flow.states.0.session2',
      session3: 'studyEip.competing-consumers.model.flow.states.0.session3',
    },
    2: {
      session1: 'studyEip.competing-consumers.model.flow.states.2.session1',
    },
    4: {
      session2: 'studyEip.competing-consumers.model.flow.states.4.session2',
    },
    6: {
      session3: 'studyEip.competing-consumers.model.flow.states.6.session3',
    },
    9: {
      session2: 'studyEip.competing-consumers.model.flow.states.9.session2',
    },
    10: {
      session3: 'studyEip.competing-consumers.model.flow.states.10.session3',
    },
    11: {
      session1: 'studyEip.competing-consumers.model.flow.states.11.session1',
    },
    12: {
      session2: 'studyEip.competing-consumers.model.flow.states.12.session2',
    },
  },
  // The queue has an order from its arriving until a session is given it; a session keeps every
  // order it has been given.
  held: {
    1: { queue: ['a'] },
    2: { queue: [], session1: ['a'] },
    3: { queue: ['b'] },
    4: { queue: [], session2: ['b'] },
    5: { queue: ['c'] },
    6: { queue: [], session3: ['c'] },
    7: { queue: ['d'] },
    9: { queue: [], session2: ['b', 'd'] },
  },
  caption: {
    key: 'studyEip.competing-consumers.model.flow.caption',
    params: { consumers: receiverCount },
  },
};

export const model: StudyModelFunction = (parameters, t) =>
  flowFromMarbles(example, flow, parameters, t);

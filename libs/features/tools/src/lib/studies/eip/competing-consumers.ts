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
const orders = { a: 'order 31', b: 'order 32', c: 'order 33', d: 'order 34' } as const;

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
      label: 'orders$',
      // Hot: the planner sends at its own pace, whether or not a session is free.
      hot: true,
      marbles: '-a-b-c-d',
      values: orders,
      subscriptions: '^',
    },
  },
  // The work on an order: it emits nothing and completes when the order is done. Order 31 is the
  // longest piece of work, so the session given it first is the last of the first three to finish.
  inner: {
    'order 31': { label: 'work(order 31)', marbles: '---------|', subscriptions: '--^--------!' },
    'order 32': { label: 'work(order 32)', marbles: '-----|', subscriptions: '----^----!' },
    'order 33': { label: 'work(order 33)', marbles: '----|', subscriptions: '------^---!' },
    'order 34': { label: 'work(order 34)', marbles: '---|', subscriptions: '---------^--!' },
  },
  operator: 'zip(queued$, free$): each order to one free session',
  outputs: {
    session1$: { label: 'session1$', marbles: '--a', values: { a: orders.a } },
    session2$: { label: 'session2$', marbles: '----b----d', values: { b: orders.b, d: orders.d } },
    session3$: { label: 'session3$', marbles: '------c', values: { c: orders.c } },
  },
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
    { label: 'Order 31 sent', frame: 1 },
    { label: 'One session gets it', frame: 2 },
    { label: 'Order 34 waits', frame: 7 },
    { label: 'First free takes 34', frame: 9 },
    { label: 'All done', frame: 12 },
  ],
  notes: {
    0: 'Sessions 1, 2 and 3 are listening on the Order queue, all free. The planner has sent nothing yet.',
    1: 'The planner sends order 31 to the Order queue, once. It does not know which session will take it.',
    2: 'The Order queue gives order 31 to Session 1, the first free session in line. Only Session 1 has it; Sessions 2 and 3 never see it.',
    3: 'The planner sends order 32 to the Order queue.',
    4: 'The Order queue gives order 32 to Session 2, the next free session. Session 1 is still working on order 31.',
    5: 'The planner sends order 33 to the Order queue.',
    6: 'The Order queue gives order 33 to Session 3, the last free session. All three are now working.',
    7: 'The planner sends order 34 to the Order queue. No session is free, so the order waits there.',
    8: 'Order 34 still waits in the Order queue, because all three sessions are still working.',
    9: 'Session 2 finishes order 32 first, and the Order queue gives it order 34 at once. Session 1 would be next in turn but is still working on order 31.',
    10: 'Session 3 finishes order 33 and is free. The Order queue is empty, so it is given nothing.',
    11: 'Session 1 finishes order 31, after order 33 although it started first.',
    12: 'Session 2 finishes order 34. Each of the four orders went to exactly one session: four orders, four deliveries.',
  },
  caption:
    'Time runs in frames. orders$ is what the planner sends: a, b, c and d are orders 31, 32, 33 and 34. Each work lane runs from the frame a session is given that order to the frame it finishes, a bar marking the end. Each lane below the band is what one session is given, and every order appears on exactly one of them.',
};

/**
 * The planner, the queue the pattern is about, and the three sessions drawing from it. An order
 * crosses into the queue on one step and out to the one session that takes it on a later step.
 */
export const flow: MarbleFlow = {
  nodes: [
    { id: 'planner', label: 'Planner', stage: 0, row: 1 },
    { id: 'queue', label: 'Order queue', stage: 1, row: 1, kind: 'channel', tone: 'subject' },
    { id: 'session1', label: 'Session 1', stage: 2, row: 0 },
    { id: 'session2', label: 'Session 2', stage: 2, row: 1 },
    { id: 'session3', label: 'Session 3', stage: 2, row: 2 },
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
      planner: 'knows no session',
      queue: 'gives each order to one session',
      session1: 'free',
      session2: 'free',
      session3: 'free',
    },
    2: { session1: 'working on 31' },
    4: { session2: 'working on 32' },
    6: { session3: 'working on 33' },
    9: { session2: 'working on 34' },
    10: { session3: 'free' },
    11: { session1: 'free' },
    12: { session2: 'free' },
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
  caption:
    'Each token is one order: a is order 31, b 32, c 33 and d 34. The Planner is the role that files orders; the Order queue, drawn as a pipe, is the point-to-point channel; Sessions 1, 2 and 3 are three agent sessions reading from it, the competing consumers. A token inside the queue is an order waiting for a free session, and the tokens inside a session are the orders that session has been given. The words in a box say what that box does or is doing. A token is green while it moves, and a box a token leaves or reaches is outlined in green. The Planner sends an order on one step, and from the next the queue gives it to one free session only.',
};

export const model: StudyModelFunction = (parameters) => flowFromMarbles(example, flow, parameters);

import { concatMap, delay, groupBy, mergeMap } from 'rxjs';

import { flowFromMarbles, type MarbleFlow } from '../flow';
import type { MarbleExample } from '../rxjs/marbles';
import type { StudyModelFunction } from '../study-model';

/** The performer for each kind of work: implementing and fixing are both the executor's. */
const performers = new Map([
  ['implement', 'executor'],
  ['fix', 'executor'],
  ['verify', 'verifier'],
  ['review', 'reviewer'],
]);

/** A request reads `<kind of work> order <n>`, and its performer comes from the kind alone. */
const roleOf = (request: unknown): string => {
  const role = performers.get(String(request).split(' ')[0]);
  if (role === undefined) throw new Error(`No performer takes ${String(request)}.`);
  return role;
};

/**
 * One dispatcher reads requests off a channel and hands each to the performer for its kind of
 * work, one request at a time per performer. A request for a busy performer waits in the
 * dispatcher, even while the other performers stand idle, and a later request for an idle one
 * goes past it. A performer's work on a request is an inner stream: it takes the request up at
 * once and ends when the work is done. One thing happens in each frame. The strings here are what
 * the spec beside this file asserts and what both drawings read.
 */
export const example: MarbleExample = {
  inputs: {
    // Requests are sent whether or not anything is reading the channel, so the source is hot.
    requests$: {
      label: 'requests$',
      hot: true,
      marbles: '-i-f-r--v',
      values: {
        i: 'implement order 31',
        f: 'fix order 30',
        r: 'review order 29',
        v: 'verify order 31',
      },
    },
  },
  inner: {
    'implement order 31': {
      label: 'executor on 31',
      marbles: 'i----|',
      values: { i: 'implement order 31' },
      subscriptions: '--^----!',
    },
    'review order 29': {
      label: 'reviewer on 29',
      marbles: 'r',
      values: { r: 'review order 29' },
      subscriptions: '------^',
    },
    'fix order 30': {
      label: 'executor on 30',
      marbles: 'f',
      values: { f: 'fix order 30' },
      subscriptions: '-------^',
    },
    'verify order 31': {
      label: 'verifier on 31',
      marbles: 'v',
      values: { v: 'verify order 31' },
      subscriptions: '---------^',
    },
  },
  operator: 'delay(1), groupBy(kind of work), then concatMap(perform) for each performer',
  outputs: {
    handed$: {
      label: 'handed$',
      marbles: '--i---rf-v',
      values: {
        i: 'implement order 31',
        f: 'fix order 30',
        r: 'review order 29',
        v: 'verify order 31',
      },
    },
  },
  run: ({ inputs: { requests$ }, inner }) => {
    // A performer's work on one request is the inner stream named after that request.
    const perform = (request: unknown) => inner[String(request)];
    const handed$ = requests$.pipe(
      // the dispatcher reads each request on the frame after it arrives
      delay(1),
      // the dispatcher chooses the performer by the kind of work the request asks for
      groupBy((request) => roleOf(request)),
      // performers of different kinds work side by side
      mergeMap((role$) =>
        // a performer works on one request at a time; later ones wait in its queue
        role$.pipe(concatMap((request) => perform(request))),
      ),
    );
    return { handed$ };
  },
  moments: [
    { label: 'Handed over', frame: 2 },
    { label: 'Kept waiting', frame: 4 },
    { label: 'Overtaken', frame: 6 },
    { label: 'Queue released', frame: 7 },
    { label: 'All busy', frame: 9 },
  ],
  notes: {
    0: 'No request has been sent. The dispatcher is the only reader of the Requests channel, and the executor, the verifier and the reviewer are all idle.',
    1: 'A request to implement order 31, i, comes down the Requests channel to the dispatcher.',
    2: "The dispatcher reads i: implementing is the executor's work and the executor is idle, so the dispatcher hands i to it.",
    3: 'A request to fix order 30, f, comes down the channel to the dispatcher.',
    4: "The dispatcher reads f: fixing is the executor's work too, and the executor is busy, so f waits in the dispatcher although the verifier and the reviewer are idle.",
    5: 'A request to review order 29, r, comes down the channel to the dispatcher.',
    6: 'The dispatcher reads r and hands it straight to the idle reviewer: r arrived after f but starts first.',
    7: 'The executor finishes order 31, and the dispatcher hands it f, the request that was waiting for it.',
    8: 'A request to verify order 31, v, comes down the channel to the dispatcher.',
    9: 'The dispatcher reads v and hands it straight to the idle verifier. Every performer is now busy and nothing waits.',
  },
  caption:
    "Time runs in frames, one event to a frame. requests$ is the Requests channel: i, f, r and v are the requests to implement order 31, fix order 30, review order 29 and verify order 31. Each lane below it is one performer's work on one request, opened when the dispatcher hands that request over; a bar is where the performer finishes. handed$ shows each request at the frame its performer takes it up.",
};

/** The dispatcher and its three performers, with each line of the example routed to its link. */
export const flow: MarbleFlow = {
  nodes: [
    { id: 'requests', label: 'Requests', stage: 0, row: 1, kind: 'channel' },
    { id: 'dispatcher', label: 'Dispatcher', stage: 1, row: 1, tone: 'subject' },
    { id: 'executor', label: 'Executor', stage: 2, row: 0 },
    { id: 'verifier', label: 'Verifier', stage: 2, row: 1 },
    { id: 'reviewer', label: 'Reviewer', stage: 2, row: 2 },
  ],
  links: [
    { id: 'take', from: 'requests', to: 'dispatcher' },
    { id: 'to-executor', from: 'dispatcher', to: 'executor' },
    { id: 'to-verifier', from: 'dispatcher', to: 'verifier' },
    { id: 'to-reviewer', from: 'dispatcher', to: 'reviewer' },
  ],
  // The output says which performer took each request up, so it routes by letter.
  routes: {
    requests$: 'take',
    handed$: { i: 'to-executor', f: 'to-executor', r: 'to-reviewer', v: 'to-verifier' },
  },
  states: {
    0: {
      dispatcher: 'nothing to hand out',
      executor: 'idle',
      verifier: 'idle',
      reviewer: 'idle',
    },
    1: { dispatcher: 'has i' },
    2: { dispatcher: 'nothing waiting', executor: 'implementing order 31' },
    3: { dispatcher: 'has f' },
    4: { dispatcher: 'f waiting for the executor' },
    5: { dispatcher: 'f waiting; has r' },
    6: { dispatcher: 'f waiting for the executor', reviewer: 'reviewing order 29' },
    7: { dispatcher: 'nothing waiting', executor: 'fixing order 30' },
    8: { dispatcher: 'has v' },
    9: { dispatcher: 'nothing waiting', verifier: 'verifying order 31' },
  },
  held: {
    1: { dispatcher: ['i'] },
    2: { dispatcher: [], executor: ['i'] },
    3: { dispatcher: ['f'] },
    5: { dispatcher: ['f', 'r'] },
    6: { dispatcher: ['f'], reviewer: ['r'] },
    7: { dispatcher: [], executor: ['f'] },
    8: { dispatcher: ['v'] },
    9: { dispatcher: [], verifier: ['v'] },
  },
  caption:
    'Each token is one request: i asks for order 31 to be implemented, f for order 30 to be fixed, r for order 29 to be reviewed and v for order 31 to be verified. Requests is the channel they arrive on, and the Dispatcher is its only reader: it chooses the performer for each request and keeps a request waiting while that performer is busy. The Executor implements and fixes orders, the Verifier checks them and the Reviewer gives them a final review; each works on one request at a time. The words in a box say what that box is doing or holding. A token is green while it moves and outlined while a box holds it, and a box a token leaves or reaches is outlined in green.',
};

export const model: StudyModelFunction = (parameters) => flowFromMarbles(example, flow, parameters);

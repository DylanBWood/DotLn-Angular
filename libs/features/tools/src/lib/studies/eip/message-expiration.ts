import { concat, concatMap, delay, EMPTY, map, of, Subject } from 'rxjs';

import { flowFromMarbles, type MarbleFlow } from '../flow';
import type { MarbleExample } from '../rxjs/marbles';
import type { StudyModelFunction } from '../study-model';

/**
 * How many steps a request to verify an order stays worth starting after the operator sends it.
 * The TestScheduler runs a step as one virtual millisecond. The record's parameter names the same
 * number, and the spec beside this file checks that they agree.
 */
export const timeToLive = 4;

/**
 * The queue in front of one verifier, for a given time to live. The example runs it with the one
 * above; a spec can run the same requests with another and see which request is lost instead.
 */
export const queueWithLimit =
  (timeToLive: number): MarbleExample['run'] =>
  ({ inputs: { request$ }, inner, scheduler }) => {
    // The verifier's work on one request carries no values: it only keeps the verifier busy from
    // the step the request reaches it until the work completes.
    const verification = (request: unknown) => inner[String(request)];
    // The dead letter channel. It hears of an expiry only while toVerifier$ is subscribed, and a
    // second subscriber to toVerifier$ would run the queue again and send each expiry twice.
    const deadLetter$ = new Subject<unknown>();
    const toVerifier$ = request$.pipe(
      // The time to live is set here: each request carries the step after which it is useless.
      map((request) => ({ request, expires: scheduler.now() + timeToLive })),
      // The queue: one request at a time, oldest first, each when the verifier is free.
      concatMap(({ request, expires }) => {
        // The expiry check, made when the request's turn comes, not when it was sent.
        if (scheduler.now() > expires) {
          // An expired request goes to the dead letter channel and never reaches the verifier.
          deadLetter$.next(request);
          return EMPTY;
        }
        // A fresh request reaches the verifier on the next step and keeps it busy until verified.
        return concat(of(request).pipe(delay(1)), verification(request));
      }),
    );
    return { toVerifier$, deadLetter$ };
  };

/**
 * The operator sends three requests to verify an order into the queue in front of one verifier.
 * The first reaches the verifier at once and keeps it busy; when it is free again, the oldest
 * waiting request is past its limit and goes to the dead letter channel, and the younger one is
 * verified. The strings here are what the spec beside this file asserts and what both drawings
 * read.
 */
export const example: MarbleExample = {
  inputs: {
    request$: {
      label: 'request$',
      marbles: '-a-b-c',
      values: { a: 'verify order 31', b: 'verify order 32', c: 'verify order 33' },
      hot: true,
    },
  },
  inner: {
    'verify order 31': {
      label: 'verification(31)',
      marbles: '------|',
      subscriptions: '--^-----!',
    },
    'verify order 33': {
      label: 'verification(33)',
      marbles: '-|',
      subscriptions: '---------^!',
    },
  },
  operator: `concatMap: past ${timeToLive} steps to deadLetter$, else to the verifier`,
  outputs: {
    toVerifier$: {
      label: 'toVerifier$',
      marbles: '--a------c',
      values: { a: 'verify order 31', c: 'verify order 33' },
    },
    deadLetter$: {
      label: 'deadLetter$',
      marbles: '--------b',
      values: { b: 'verify order 32' },
    },
  },
  run: queueWithLimit(timeToLive),
  moments: [
    { label: 'First one verified', frame: 2 },
    { label: 'Two waiting', frame: 5 },
    { label: "b's last good step", frame: 7 },
    { label: 'b expires', frame: 8 },
    { label: 'c verified', frame: 9 },
  ],
  notes: {
    0: 'The operator has three orders to be verified and has sent nothing yet. The Request queue is empty and the Verifier is free.',
    1: `The operator sends a, a request to verify order 31, to the Request queue, with a time limit of ${timeToLive} steps.`,
    2: 'The Verifier is free, so the Request queue hands a to it, and the Verifier starts verifying order 31.',
    3: `The operator sends b, a request to verify order 32, to the Request queue, with the same limit of ${timeToLive} steps. The Verifier is busy, so b waits.`,
    4: 'Nothing moves. b waits in the Request queue while the Verifier works on order 31.',
    5: 'The operator sends c, a request to verify order 33, to the Request queue, where it waits behind b.',
    6: 'Nothing moves. b and c both wait while the Verifier works on order 31.',
    7: `Nothing moves. b has now waited its whole limit of ${timeToLive} steps, and the Verifier is still busy with order 31.`,
    8: 'The Verifier finishes order 31 and is free. The oldest request waiting, b, is now past its limit, so the Request queue moves it to the Dead letter channel instead of handing it to the Verifier.',
    9: 'The Request queue hands c, still within its limit, to the Verifier, which starts verifying order 33.',
    10: 'The Verifier finishes order 33. Orders 31 and 33 were verified; order 32 never was, and the Dead letter channel keeps its request where someone can see it.',
  },
  // Every value the outputs carry is one of the operator's requests, so each rides from request$.
  origins: { 2: 'request$', 8: 'request$', 9: 'request$' },
  caption:
    'Time runs in frames, one step of the flow each. request$ is what the operator sends: a, b and c are requests to verify orders 31, 32 and 33. A verification lane runs from the frame the Verifier receives a request to the bar where it finishes; it carries no values and only keeps the Verifier busy, and there is none for b. toVerifier$ shows each request as it reaches the Verifier, one frame after the queue lets it go, and deadLetter$ each request that was past its limit when its turn came.',
};

/** The operator, the queue the pattern is about, and the two places a request can leave it for. */
export const flow: MarbleFlow = {
  nodes: [
    { id: 'operator', label: 'Operator', stage: 0 },
    { id: 'queue', label: 'Request queue', stage: 1, kind: 'channel', tone: 'subject' },
    { id: 'verifier', label: 'Verifier', stage: 2 },
    { id: 'dead', label: 'Dead letter', stage: 2, row: 1, kind: 'channel' },
  ],
  links: [
    { id: 'send', from: 'operator', to: 'queue' },
    { id: 'take', from: 'queue', to: 'verifier' },
    { id: 'expire', from: 'queue', to: 'dead' },
  ],
  routes: { request$: 'send', toVerifier$: 'take', deadLetter$: 'expire' },
  states: {
    0: { operator: '3 requests to send', queue: 'empty', verifier: 'free', dead: 'empty' },
    1: { operator: 'sent a', queue: `a good until step ${1 + timeToLive}` },
    2: { queue: 'empty', verifier: 'verifying order 31' },
    3: { operator: 'sent a, b', queue: `b good until step ${3 + timeToLive}` },
    5: {
      operator: 'sent a, b, c',
      queue: `b until ${3 + timeToLive}, c until ${5 + timeToLive}`,
    },
    7: { queue: `b until ${3 + timeToLive} (now), c until ${5 + timeToLive}` },
    8: {
      queue: `c good until step ${5 + timeToLive}`,
      verifier: 'finished 31; free',
      dead: 'b, never verified',
    },
    9: { queue: 'empty', verifier: 'verifying order 33' },
    10: { verifier: 'finished 33; free' },
  },
  held: {
    1: { queue: ['a'] },
    2: { queue: [], verifier: ['a'] },
    3: { queue: ['b'] },
    5: { queue: ['b', 'c'] },
    8: { queue: ['c'], verifier: [], dead: ['b'] },
    9: { queue: [], verifier: ['c'] },
    10: { verifier: [] },
  },
  caption:
    'Each token is one request from the operator, the person directing the work, to verify an order: a, b and c ask for orders 31, 32 and 33. The Operator box sends them. The Request queue is the channel they wait in, each carrying the step until which it is still worth starting. The Verifier works on one request at a time, and the Dead letter box is a second channel that keeps the requests that waited too long, unverified, where someone can see them. The words in a box say what that box is doing or holding. A token is green while it moves and outlined while a box holds it, and a box a token leaves or reaches is outlined in green.',
};

export const model: StudyModelFunction = (parameters) => flowFromMarbles(example, flow, parameters);

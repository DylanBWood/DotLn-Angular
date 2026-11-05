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

const requests = { a: 'verify order 31', b: 'verify order 32', c: 'verify order 33' };
const waiting = ['b', 'c'];

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
      label: 'studyEip.message-expiration.model.example.inputs.request.label',
      marbles: '-a-b-c',
      values: requests,
      hot: true,

      valueMessages: {
        a: 'studyEip.message-expiration.model.example.inputs.request.values.a',
        b: 'studyEip.message-expiration.model.example.inputs.request.values.b',
        c: 'studyEip.message-expiration.model.example.inputs.request.values.c',
      },
    },
  },
  inner: {
    'verify order 31': {
      label: 'studyEip.message-expiration.model.example.inner.verify-order-31.label',
      marbles: '------|',
      subscriptions: '--^-----!',
    },
    'verify order 33': {
      label: 'studyEip.message-expiration.model.example.inner.verify-order-33.label',
      marbles: '-|',
      subscriptions: '---------^!',
    },
  },
  operator: {
    key: 'studyEip.message-expiration.model.example.operator',
    params: { timeToLive },
  },
  outputs: {
    toVerifier$: {
      label: 'studyEip.message-expiration.model.example.outputs.toVerifier.label',
      marbles: '--a------c',
      values: { a: 'verify order 31', c: 'verify order 33' },

      valueMessages: {
        a: 'studyEip.message-expiration.model.example.outputs.toVerifier.values.a',
        c: 'studyEip.message-expiration.model.example.outputs.toVerifier.values.c',
      },
    },
    deadLetter$: {
      label: 'studyEip.message-expiration.model.example.outputs.deadLetter.label',
      marbles: '--------b',
      values: { b: 'verify order 32' },

      valueMessages: {
        b: 'studyEip.message-expiration.model.example.outputs.deadLetter.values.b',
      },
    },
  },
  run: queueWithLimit(timeToLive),
  moments: [
    {
      label: 'studyEip.message-expiration.model.example.moments.0.label',
      frame: 2,
    },
    {
      label: {
        key: 'studyEip.message-expiration.model.example.moments.1.label',
        params: { waiting: waiting.length },
      },
      frame: 5,
    },
    {
      label: 'studyEip.message-expiration.model.example.moments.2.label',
      frame: 7,
    },
    {
      label: 'studyEip.message-expiration.model.example.moments.3.label',
      frame: 8,
    },
    {
      label: 'studyEip.message-expiration.model.example.moments.4.label',
      frame: 9,
    },
  ],
  notes: {
    0: {
      key: 'studyEip.message-expiration.model.example.notes.0',
      params: { orders: Object.keys(requests).length },
    },
    1: {
      key: 'studyEip.message-expiration.model.example.notes.1',
      params: { timeToLive },
    },
    2: 'studyEip.message-expiration.model.example.notes.2',
    3: {
      key: 'studyEip.message-expiration.model.example.notes.3',
      params: { timeToLive },
    },
    4: 'studyEip.message-expiration.model.example.notes.4',
    5: 'studyEip.message-expiration.model.example.notes.5',
    6: 'studyEip.message-expiration.model.example.notes.6',
    7: {
      key: 'studyEip.message-expiration.model.example.notes.7',
      params: { timeToLive },
    },
    8: 'studyEip.message-expiration.model.example.notes.8',
    9: 'studyEip.message-expiration.model.example.notes.9',
    10: 'studyEip.message-expiration.model.example.notes.10',
  },
  // Every value the outputs carry is one of the operator's requests, so each rides from request$.
  origins: { 2: 'request$', 8: 'request$', 9: 'request$' },
  caption: 'studyEip.message-expiration.model.example.caption',
};

/** The operator, the queue the pattern is about, and the two places a request can leave it for. */
export const flow: MarbleFlow = {
  nodes: [
    {
      id: 'operator',
      label: 'studyEip.message-expiration.model.flow.nodes.0.label',
      stage: 0,
    },
    {
      id: 'queue',
      label: 'studyEip.message-expiration.model.flow.nodes.1.label',
      stage: 1,
      kind: 'channel',
      tone: 'subject',
    },
    {
      id: 'verifier',
      label: 'studyEip.message-expiration.model.flow.nodes.2.label',
      stage: 2,
    },
    {
      id: 'dead',
      label: 'studyEip.message-expiration.model.flow.nodes.3.label',
      stage: 2,
      row: 1,
      kind: 'channel',
    },
  ],
  links: [
    { id: 'send', from: 'operator', to: 'queue' },
    { id: 'take', from: 'queue', to: 'verifier' },
    { id: 'expire', from: 'queue', to: 'dead' },
  ],
  routes: { request$: 'send', toVerifier$: 'take', deadLetter$: 'expire' },
  states: {
    0: {
      operator: {
        key: 'studyEip.message-expiration.model.flow.states.0.operator',
        params: { requests: Object.keys(requests).length },
      },
      queue: 'studyEip.message-expiration.model.flow.states.0.queue',
      verifier: 'studyEip.message-expiration.model.flow.states.0.verifier',
      dead: 'studyEip.message-expiration.model.flow.states.0.dead',
    },
    1: {
      operator: 'studyEip.message-expiration.model.flow.states.1.operator',
      queue: {
        key: 'studyEip.message-expiration.model.flow.states.1.queue',
        params: { firstDeadline: 1 + timeToLive },
      },
    },
    2: {
      queue: 'studyEip.message-expiration.model.flow.states.2.queue',
      verifier: 'studyEip.message-expiration.model.flow.states.2.verifier',
    },
    3: {
      operator: 'studyEip.message-expiration.model.flow.states.3.operator',
      queue: {
        key: 'studyEip.message-expiration.model.flow.states.3.queue',
        params: { secondDeadline: 3 + timeToLive },
      },
    },
    5: {
      operator: 'studyEip.message-expiration.model.flow.states.5.operator',
      queue: {
        key: 'studyEip.message-expiration.model.flow.states.5.queue',
        params: {
          secondDeadline: 3 + timeToLive,
          thirdDeadline: 5 + timeToLive,
        },
      },
    },
    7: {
      queue: {
        key: 'studyEip.message-expiration.model.flow.states.7.queue',
        params: {
          secondDeadline: 3 + timeToLive,
          thirdDeadline: 5 + timeToLive,
        },
      },
    },
    8: {
      queue: {
        key: 'studyEip.message-expiration.model.flow.states.8.queue',
        params: { thirdDeadline: 5 + timeToLive },
      },
      verifier: 'studyEip.message-expiration.model.flow.states.8.verifier',
      dead: 'studyEip.message-expiration.model.flow.states.8.dead',
    },
    9: {
      queue: 'studyEip.message-expiration.model.flow.states.9.queue',
      verifier: 'studyEip.message-expiration.model.flow.states.9.verifier',
    },
    10: {
      verifier: 'studyEip.message-expiration.model.flow.states.10.verifier',
    },
  },
  held: {
    1: { queue: ['a'] },
    2: { queue: [], verifier: ['a'] },
    3: { queue: ['b'] },
    5: { queue: waiting },
    8: { queue: ['c'], verifier: [], dead: ['b'] },
    9: { queue: [], verifier: ['c'] },
    10: { verifier: [] },
  },
  caption: 'studyEip.message-expiration.model.flow.caption',
};

export const model: StudyModelFunction = (parameters, t) =>
  flowFromMarbles(example, flow, parameters, t);

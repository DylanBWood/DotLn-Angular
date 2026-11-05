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
      label: 'studyEip.message-dispatcher.model.example.inputs.requests.label',
      hot: true,
      marbles: '-i-f-r--v',
      values: {
        i: 'implement order 31',
        f: 'fix order 30',
        r: 'review order 29',
        v: 'verify order 31',
      },

      valueMessages: {
        i: 'studyEip.message-dispatcher.model.example.inputs.requests.values.i',
        f: 'studyEip.message-dispatcher.model.example.inputs.requests.values.f',
        r: 'studyEip.message-dispatcher.model.example.inputs.requests.values.r',
        v: 'studyEip.message-dispatcher.model.example.inputs.requests.values.v',
      },
    },
  },
  inner: {
    'implement order 31': {
      label: 'studyEip.message-dispatcher.model.example.inner.implement-order-31.label',
      marbles: 'i----|',
      values: { i: 'implement order 31' },
      subscriptions: '--^----!',

      valueMessages: {
        i: 'studyEip.message-dispatcher.model.example.inner.implement-order-31.values.i',
      },
    },
    'review order 29': {
      label: 'studyEip.message-dispatcher.model.example.inner.review-order-29.label',
      marbles: 'r',
      values: { r: 'review order 29' },
      subscriptions: '------^',

      valueMessages: {
        r: 'studyEip.message-dispatcher.model.example.inner.review-order-29.values.r',
      },
    },
    'fix order 30': {
      label: 'studyEip.message-dispatcher.model.example.inner.fix-order-30.label',
      marbles: 'f',
      values: { f: 'fix order 30' },
      subscriptions: '-------^',

      valueMessages: {
        f: 'studyEip.message-dispatcher.model.example.inner.fix-order-30.values.f',
      },
    },
    'verify order 31': {
      label: 'studyEip.message-dispatcher.model.example.inner.verify-order-31.label',
      marbles: 'v',
      values: { v: 'verify order 31' },
      subscriptions: '---------^',

      valueMessages: {
        v: 'studyEip.message-dispatcher.model.example.inner.verify-order-31.values.v',
      },
    },
  },
  operator: 'studyEip.message-dispatcher.model.example.operator',
  outputs: {
    handed$: {
      label: 'studyEip.message-dispatcher.model.example.outputs.handed.label',
      marbles: '--i---rf-v',
      values: {
        i: 'implement order 31',
        f: 'fix order 30',
        r: 'review order 29',
        v: 'verify order 31',
      },

      valueMessages: {
        i: 'studyEip.message-dispatcher.model.example.outputs.handed.values.i',
        f: 'studyEip.message-dispatcher.model.example.outputs.handed.values.f',
        r: 'studyEip.message-dispatcher.model.example.outputs.handed.values.r',
        v: 'studyEip.message-dispatcher.model.example.outputs.handed.values.v',
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
    {
      label: 'studyEip.message-dispatcher.model.example.moments.0.label',
      frame: 2,
    },
    {
      label: 'studyEip.message-dispatcher.model.example.moments.1.label',
      frame: 4,
    },
    {
      label: 'studyEip.message-dispatcher.model.example.moments.2.label',
      frame: 6,
    },
    {
      label: 'studyEip.message-dispatcher.model.example.moments.3.label',
      frame: 7,
    },
    {
      label: 'studyEip.message-dispatcher.model.example.moments.4.label',
      frame: 9,
    },
  ],
  notes: {
    0: 'studyEip.message-dispatcher.model.example.notes.0',
    1: 'studyEip.message-dispatcher.model.example.notes.1',
    2: 'studyEip.message-dispatcher.model.example.notes.2',
    3: 'studyEip.message-dispatcher.model.example.notes.3',
    4: 'studyEip.message-dispatcher.model.example.notes.4',
    5: 'studyEip.message-dispatcher.model.example.notes.5',
    6: 'studyEip.message-dispatcher.model.example.notes.6',
    7: 'studyEip.message-dispatcher.model.example.notes.7',
    8: 'studyEip.message-dispatcher.model.example.notes.8',
    9: 'studyEip.message-dispatcher.model.example.notes.9',
  },
  caption: 'studyEip.message-dispatcher.model.example.caption',

  parameterMessages: {
    orders: 'studyEip.message-dispatcher.record.parameters.orders',
  },
};

/** The dispatcher and its three performers, with each line of the example routed to its link. */
export const flow: MarbleFlow = {
  nodes: [
    {
      id: 'requests',
      label: 'studyEip.message-dispatcher.model.flow.nodes.0.label',
      stage: 0,
      row: 1,
      kind: 'channel',
    },
    {
      id: 'dispatcher',
      label: 'studyEip.message-dispatcher.model.flow.nodes.1.label',
      stage: 1,
      row: 1,
      tone: 'subject',
    },
    {
      id: 'executor',
      label: 'studyEip.message-dispatcher.model.flow.nodes.2.label',
      stage: 2,
      row: 0,
    },
    {
      id: 'verifier',
      label: 'studyEip.message-dispatcher.model.flow.nodes.3.label',
      stage: 2,
      row: 1,
    },
    {
      id: 'reviewer',
      label: 'studyEip.message-dispatcher.model.flow.nodes.4.label',
      stage: 2,
      row: 2,
    },
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
    handed$: {
      i: 'to-executor',
      f: 'to-executor',
      r: 'to-reviewer',
      v: 'to-verifier',
    },
  },
  states: {
    0: {
      dispatcher: 'studyEip.message-dispatcher.model.flow.states.0.dispatcher',
      executor: 'studyEip.message-dispatcher.model.flow.states.0.executor',
      verifier: 'studyEip.message-dispatcher.model.flow.states.0.verifier',
      reviewer: 'studyEip.message-dispatcher.model.flow.states.0.reviewer',
    },
    1: {
      dispatcher: 'studyEip.message-dispatcher.model.flow.states.1.dispatcher',
    },
    2: {
      dispatcher: 'studyEip.message-dispatcher.model.flow.states.2.dispatcher',
      executor: 'studyEip.message-dispatcher.model.flow.states.2.executor',
    },
    3: {
      dispatcher: 'studyEip.message-dispatcher.model.flow.states.3.dispatcher',
    },
    4: {
      dispatcher: 'studyEip.message-dispatcher.model.flow.states.4.dispatcher',
    },
    5: {
      dispatcher: 'studyEip.message-dispatcher.model.flow.states.5.dispatcher',
    },
    6: {
      dispatcher: 'studyEip.message-dispatcher.model.flow.states.6.dispatcher',
      reviewer: 'studyEip.message-dispatcher.model.flow.states.6.reviewer',
    },
    7: {
      dispatcher: 'studyEip.message-dispatcher.model.flow.states.7.dispatcher',
      executor: 'studyEip.message-dispatcher.model.flow.states.7.executor',
    },
    8: {
      dispatcher: 'studyEip.message-dispatcher.model.flow.states.8.dispatcher',
    },
    9: {
      dispatcher: 'studyEip.message-dispatcher.model.flow.states.9.dispatcher',
      verifier: 'studyEip.message-dispatcher.model.flow.states.9.verifier',
    },
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
  caption: 'studyEip.message-dispatcher.model.flow.caption',
};

export const model: StudyModelFunction = (parameters, t) =>
  flowFromMarbles(example, flow, parameters, t);

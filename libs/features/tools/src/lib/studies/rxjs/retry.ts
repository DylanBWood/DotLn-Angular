import { defer, retry } from 'rxjs';

import type { StudyModelFunction } from '../study-model';
import { type MarbleExample, marbleModel } from './marbles';

/** How many times the board asks again after a failure; the record's `count` parameter. */
export const count = 2;

/** How many frames it waits before asking again; the record's `delay` parameter. */
export const delay = 2;

const departures = { a: '10:02', b: '10:15' };

const failures = { first: new Error('timed out'), second: new Error('reset') };
const shown = '-----a----a-b|';

/**
 * A departures board asks for the departures over a flaky connection. The request is deferred, so
 * each subscription to it starts a fresh attempt; retry resubscribes after a failure, waiting
 * first, until an attempt completes or the retries run out. The strings here are what the spec
 * beside this file asserts and what the drawing reads.
 */
export const example: MarbleExample = {
  inputs: {},
  inner: {
    first: {
      label: 'studyRxjs.retry.model.example.inner.first.label',
      marbles: '--#',
      error: failures.first,
      subscriptions: '^-!',

      errorMessage: 'studyRxjs.retry.model.example.inner.first.error',
    },
    second: {
      label: 'studyRxjs.retry.model.example.inner.second.label',
      marbles: '-a-#',
      values: departures,
      error: failures.second,
      subscriptions: '----^--!',

      valueMessages: {
        a: 'studyRxjs.retry.model.example.inner.second.values.a',
        b: 'studyRxjs.retry.model.example.inner.second.values.b',
      },
      errorMessage: 'studyRxjs.retry.model.example.inner.second.error',
    },
    third: {
      label: 'studyRxjs.retry.model.example.inner.third.label',
      marbles: '-a-b|',
      values: departures,
      subscriptions: '---------^---!',

      valueMessages: {
        a: 'studyRxjs.retry.model.example.inner.third.values.a',
        b: 'studyRxjs.retry.model.example.inner.third.values.b',
      },
    },
  },
  operator: 'studyRxjs.retry.model.example.operator',
  outputs: {
    board$: {
      label: 'studyRxjs.retry.model.example.outputs.board.label',
      marbles: shown,
      values: departures,

      valueMessages: {
        a: 'studyRxjs.retry.model.example.outputs.board.values.a',
        b: 'studyRxjs.retry.model.example.outputs.board.values.b',
      },
    },
  },
  run: ({ inner }) => {
    const attempts = [inner['first'], inner['second'], inner['third']];
    let started = 0;
    // Each call starts the next attempt, as each request to a server would.
    const load = () => attempts[started++];
    const board$ = defer(() => load()).pipe(retry({ count, delay }));
    return { board$ };
  },
  moments: [
    { label: 'studyRxjs.retry.model.example.moments.0.label', frame: 2 },
    { label: 'studyRxjs.retry.model.example.moments.1.label', frame: 4 },
    { label: 'studyRxjs.retry.model.example.moments.2.label', frame: 7 },
    { label: 'studyRxjs.retry.model.example.moments.3.label', frame: 10 },
    { label: 'studyRxjs.retry.model.example.moments.4.label', frame: 13 },
  ],
  caption: {
    key: 'studyRxjs.retry.model.example.caption',
    params: { delay },
  },
  notes: {
    0: 'studyRxjs.retry.model.example.notes.0',
    2: {
      key: 'studyRxjs.retry.model.example.notes.2',
      params: { used: Object.keys(failures).slice(0, 1).length },
    },
    3: 'studyRxjs.retry.model.example.notes.3',
    4: 'studyRxjs.retry.model.example.notes.4',
    5: 'studyRxjs.retry.model.example.notes.5',
    7: 'studyRxjs.retry.model.example.notes.7',
    8: 'studyRxjs.retry.model.example.notes.8',
    9: 'studyRxjs.retry.model.example.notes.9',
    10: 'studyRxjs.retry.model.example.notes.10',
    12: 'studyRxjs.retry.model.example.notes.12',
    13: {
      key: 'studyRxjs.retry.model.example.notes.13',
      params: {
        failures: Object.keys(failures).length,
        repeated: [...shown].filter((letter) => letter === 'a').length,
      },
    },
  },

  parameterMessages: {
    departures: 'studyRxjs.retry.record.parameters.departures',
  },
};

export const model: StudyModelFunction = (parameters, t) => marbleModel(example, parameters, t);

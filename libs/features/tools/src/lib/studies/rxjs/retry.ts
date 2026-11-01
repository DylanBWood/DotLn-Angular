import { defer, retry } from 'rxjs';

import type { StudyModelFunction } from '../study-model';
import { type MarbleExample, marbleModel } from './marbles';

/** How many times the board asks again after a failure; the record's `count` parameter. */
export const count = 2;

/** How many frames it waits before asking again; the record's `delay` parameter. */
export const delay = 2;

const departures = { a: '10:02', b: '10:15' };

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
      label: 'attempt 1',
      marbles: '--#',
      error: new Error('timed out'),
      subscriptions: '^-!',
    },
    second: {
      label: 'attempt 2',
      marbles: '-a-#',
      values: departures,
      error: new Error('reset'),
      subscriptions: '----^--!',
    },
    third: {
      label: 'attempt 3',
      marbles: '-a-b|',
      values: departures,
      subscriptions: '---------^---!',
    },
  },
  operator: 'retry({ count, delay })',
  outputs: {
    board$: {
      label: 'board$',
      marbles: '-----a----a-b|',
      values: departures,
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
    { label: 'First attempt fails', frame: 2 },
    { label: 'Ask again', frame: 4 },
    { label: 'Second attempt fails', frame: 7 },
    { label: 'Repeated value', frame: 10 },
    { label: 'Done', frame: 13 },
  ],
  caption: `Time runs in frames, left to right. A circle is an emission, with its letter, and a bar is completion. A cross on an attempt is its error: retry keeps it from board$ and answers with a new attempt, on the next lane, ${delay} frames later. Step the frames to follow each attempt.`,
  notes: {
    0: 'The board subscribes, and the first attempt starts.',
    2: 'The first attempt fails before sending anything. retry keeps the error from the board, counts one retry used and starts to wait.',
    3: 'retry is waiting out the delay. Nothing reaches the board.',
    4: 'The wait is over. retry subscribes again, so load() runs again and a second attempt starts from the beginning. The board has seen no error.',
    5: 'The second attempt sends the 10:02, and it goes straight to the board.',
    7: 'The second attempt fails part way. Its 10:02 stays on the board. retry counts its second and last retry and waits again.',
    8: 'retry waits again. The board still holds the one 10:02 it has received.',
    9: 'retry subscribes a third time. If this attempt failed too, its error would reach the board.',
    10: 'The third attempt starts from the beginning, so the board receives the 10:02 a second time.',
    12: 'The third attempt sends the 10:15, which no earlier attempt reached.',
    13: 'The third attempt completes, so the board completes. Both errors were absorbed, and the 10:02 arrived twice.',
  },
};

export const model: StudyModelFunction = (parameters) => marbleModel(example, parameters);

import { shareReplay } from 'rxjs';

import type { StudyModelFunction } from '../study-model';
import { type MarbleExample, marbleModel } from './marbles';

/**
 * The page of the share study: a polled stock quote, shown in a tile from the start and in a chart
 * the user opens later, with both readers unsubscribed when the user leaves. shareReplay(1) keeps
 * the latest quote, so the chart draws one the moment it opens; and because it does not stop its
 * source when the last reader leaves, the poll goes on fetching after both have gone. The strings
 * here are what the spec beside this file asserts and what the drawing reads.
 */
export const example: MarbleExample = {
  inputs: {
    quote$: {
      label: 'quote$',
      // Cold: each subscription starts its own poll, which fetches a quote every four frames.
      marbles: '-a---b---c---d---e---f',
      values: { a: 101, b: 104, c: 102, d: 106, e: 105, f: 108 },
      // Subscribed once, at frame 0, and never unsubscribed.
      subscriptions: '^',
    },
  },
  operator: 'quote$.pipe(shareReplay(1))',
  outputs: {
    tile$: {
      label: 'tile$',
      marbles: '-a---b---c---d',
      values: { a: 101, b: 104, c: 102, d: 106 },
      subscriptions: '^--------------!',
    },
    chart$: {
      label: 'chart$',
      marbles: '-------b-c---d',
      values: { b: 104, c: 102, d: 106 },
      subscriptions: '-------^-------!',
    },
  },
  run: ({ inputs: { quote$ } }) => {
    const shared$ = quote$.pipe(shareReplay(1));
    // Both readers are the one shared stream. The spec subscribes the tile at frame 0 and the
    // chart at frame 7, and unsubscribes both at frame 15, as their subscription marbles say.
    return { tile$: shared$, chart$: shared$ };
  },
  moments: [
    { label: 'Poll starts', frame: 0 },
    { label: 'Chart gets b at once', frame: 7 },
    { label: 'Both readers leave', frame: 15 },
    { label: 'Fetched for no one', frame: 17 },
  ],
  notes: {
    0: 'The tile is on the page from the start. shareReplay makes a memory that holds one quote and starts the poll, once, to fill it.',
    1: 'The first quote is stored in the memory and shown on the tile.',
    5: 'The second quote replaces the first in the memory and goes to the tile.',
    7: 'The user opens the chart. shareReplay hands it the quote in the memory, b, in the same frame, so the chart is never empty. The memory holds one quote, so b is all it replays.',
    9: 'The third quote reaches both readers and replaces b in the memory.',
    13: 'The fourth quote reaches both readers.',
    15: 'The user leaves the page and both readers unsubscribe. shareReplay(1) leaves refCount false, so having no reader does not stop the poll.',
    17: 'The poll fetches a quote for no one. The request was sent; its answer only replaces the one in the memory.',
    21: 'The poll fetches again for no one. With refCount left false, it runs for as long as the app does.',
  },
  caption:
    "Time runs in frames. A circle is an emission, with its letter. quote$ is the poll; tile$ and chart$ are its two readers, and each lane starts where that reader subscribes. A reader's lane ends in a small ring where it left the page; the poll's lane runs on. Step the frames to follow each quote.",
};

export const model: StudyModelFunction = (parameters) => marbleModel(example, parameters);

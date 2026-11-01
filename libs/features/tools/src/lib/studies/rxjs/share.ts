import { share } from 'rxjs';

import type { StudyModelFunction } from '../study-model';
import { type MarbleExample, marbleModel } from './marbles';

/**
 * A page polls a stock quote and shows it in a tile from the start and in a chart the user opens
 * later; leaving the page unsubscribes both. share gives the two readers one poll: the chart joins
 * it where it stands and sees only later quotes, and the poll stops when the last reader leaves.
 * The shareReplay study runs the same streams, so the two diagrams can be read side by side. The
 * strings here are what the spec beside this file asserts and what the drawing reads.
 */
export const example: MarbleExample = {
  inputs: {
    quote$: {
      label: 'quote$',
      // Cold: each subscription starts its own poll, which fetches a quote every four frames.
      marbles: '-a---b---c---d---e---f',
      values: { a: 101, b: 104, c: 102, d: 106, e: 105, f: 108 },
      subscriptions: '^--------------!',
    },
  },
  operator: 'quote$.pipe(share())',
  outputs: {
    tile$: {
      label: 'tile$',
      marbles: '-a---b---c---d',
      values: { a: 101, b: 104, c: 102, d: 106 },
      subscriptions: '^--------------!',
    },
    chart$: {
      label: 'chart$',
      marbles: '---------c---d',
      values: { c: 102, d: 106 },
      subscriptions: '-------^-------!',
    },
  },
  run: ({ inputs: { quote$ } }) => {
    const shared$ = quote$.pipe(share());
    // Both readers are the one shared stream. The spec subscribes the tile at frame 0 and the
    // chart at frame 7, and unsubscribes both at frame 15, as their subscription marbles say.
    return { tile$: shared$, chart$: shared$ };
  },
  moments: [
    { label: 'Poll starts', frame: 0 },
    { label: 'Chart opens, empty', frame: 7 },
    { label: 'Both get c', frame: 9 },
    { label: 'Both readers leave', frame: 15 },
  ],
  notes: {
    0: "The tile is on the page from the start. It is share's first reader, so share starts the poll now, once, for every reader to come.",
    1: 'The first quote arrives and the tile shows it. The chart is not open yet.',
    5: 'The second quote goes to the tile alone. share keeps no copy of it.',
    7: 'The user opens the chart, which subscribes into the poll already running. share has nothing stored to give it, so the chart stays empty.',
    9: "The third quote reaches both readers from the one poll. It is the chart's first quote.",
    13: 'The fourth quote reaches both readers.',
    15: 'The user leaves the page and both readers unsubscribe. With no reader left, share stops the poll and forgets it; the next reader would start a new one.',
  },
  caption:
    'Time runs in frames. A circle is an emission, with its letter. quote$ is the poll; tile$ and chart$ are its two readers, and each lane starts where that reader subscribes. A lane that ends in a small ring ends where its subscription did: on a reader, where it left the page; on quote$, where share stopped the poll. Step the frames to follow each quote.',
};

export const model: StudyModelFunction = (parameters) => marbleModel(example, parameters);

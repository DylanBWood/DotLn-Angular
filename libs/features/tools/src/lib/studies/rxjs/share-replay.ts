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
      label: 'studyRxjs.share-replay.model.example.inputs.quote.label',
      // Cold: each subscription starts its own poll, which fetches a quote every four frames.
      marbles: '-a---b---c---d---e---f',
      values: { a: 101, b: 104, c: 102, d: 106, e: 105, f: 108 },
      // Subscribed once, at frame 0, and never unsubscribed.
      subscriptions: '^',
    },
  },
  operator: 'studyRxjs.share-replay.model.example.operator',
  outputs: {
    tile$: {
      label: 'studyRxjs.share-replay.model.example.outputs.tile.label',
      marbles: '-a---b---c---d',
      values: { a: 101, b: 104, c: 102, d: 106 },
      subscriptions: '^--------------!',
    },
    chart$: {
      label: 'studyRxjs.share-replay.model.example.outputs.chart.label',
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
    { label: 'studyRxjs.share-replay.model.example.moments.0.label', frame: 0 },
    { label: 'studyRxjs.share-replay.model.example.moments.1.label', frame: 7 },
    {
      label: 'studyRxjs.share-replay.model.example.moments.2.label',
      frame: 15,
    },
    {
      label: 'studyRxjs.share-replay.model.example.moments.3.label',
      frame: 17,
    },
  ],
  notes: {
    0: 'studyRxjs.share-replay.model.example.notes.0',
    1: 'studyRxjs.share-replay.model.example.notes.1',
    5: 'studyRxjs.share-replay.model.example.notes.5',
    7: 'studyRxjs.share-replay.model.example.notes.7',
    9: 'studyRxjs.share-replay.model.example.notes.9',
    13: 'studyRxjs.share-replay.model.example.notes.13',
    15: 'studyRxjs.share-replay.model.example.notes.15',
    17: 'studyRxjs.share-replay.model.example.notes.17',
    21: 'studyRxjs.share-replay.model.example.notes.21',
  },
  caption: 'studyRxjs.share-replay.model.example.caption',
};

export const model: StudyModelFunction = (parameters, t) => marbleModel(example, parameters, t);

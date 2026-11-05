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
      label: 'studyRxjs.share.model.example.inputs.quote.label',
      // Cold: each subscription starts its own poll, which fetches a quote every four frames.
      marbles: '-a---b---c---d---e---f',
      values: { a: 101, b: 104, c: 102, d: 106, e: 105, f: 108 },
      subscriptions: '^--------------!',
    },
  },
  operator: 'studyRxjs.share.model.example.operator',
  outputs: {
    tile$: {
      label: 'studyRxjs.share.model.example.outputs.tile.label',
      marbles: '-a---b---c---d',
      values: { a: 101, b: 104, c: 102, d: 106 },
      subscriptions: '^--------------!',
    },
    chart$: {
      label: 'studyRxjs.share.model.example.outputs.chart.label',
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
    { label: 'studyRxjs.share.model.example.moments.0.label', frame: 0 },
    { label: 'studyRxjs.share.model.example.moments.1.label', frame: 7 },
    { label: 'studyRxjs.share.model.example.moments.2.label', frame: 9 },
    { label: 'studyRxjs.share.model.example.moments.3.label', frame: 15 },
  ],
  notes: {
    0: 'studyRxjs.share.model.example.notes.0',
    1: 'studyRxjs.share.model.example.notes.1',
    5: 'studyRxjs.share.model.example.notes.5',
    7: 'studyRxjs.share.model.example.notes.7',
    9: 'studyRxjs.share.model.example.notes.9',
    13: 'studyRxjs.share.model.example.notes.13',
    15: 'studyRxjs.share.model.example.notes.15',
  },
  caption: 'studyRxjs.share.model.example.caption',
};

export const model: StudyModelFunction = (parameters, t) => marbleModel(example, parameters, t);

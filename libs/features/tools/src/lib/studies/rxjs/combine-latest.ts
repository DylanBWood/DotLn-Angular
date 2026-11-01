import { combineLatest, map, type Observable } from 'rxjs';

import type { StudyModelFunction } from '../study-model';
import { type MarbleExample, marbleModel } from './marbles';

/**
 * A task's row on a dashboard: it shows the worker's latest state beside the budget it has left,
 * and is rebuilt whenever either changes, once both have reported. The strings here are what the
 * spec beside this file asserts and what the drawing reads.
 */
export const example: MarbleExample = {
  inputs: {
    worker$: {
      label: 'worker$',
      marbles: '-qr---w-----d--|',
      values: { q: 'queued', r: 'reading', w: 'writing', d: 'done' },
    },
    budget$: {
      label: 'budget$',
      marbles: '----a---b-|',
      values: { a: '90% left', b: '40% left' },
    },
  },
  operator: 'combineLatest([worker$, budget$])',
  outputs: {
    row$: {
      label: 'row$',
      marbles: '----1-2-3---4--|',
      values: {
        1: 'reading, 90% left',
        2: 'writing, 90% left',
        3: 'writing, 40% left',
        4: 'done, 40% left',
      },
    },
  },
  run: ({ inputs }) => {
    // The worker's states and the budget's reports are the text the letters stand for.
    const worker$ = inputs['worker$'] as Observable<string>;
    const budget$ = inputs['budget$'] as Observable<string>;
    const row$ = combineLatest([worker$, budget$]).pipe(map((latest) => latest.join(', ')));
    return { row$ };
  },
  moments: [
    { label: 'Still waiting', frame: 2 },
    { label: 'First row', frame: 4 },
    { label: 'Budget falls', frame: 8 },
    { label: 'Budget completes', frame: 10 },
    { label: 'Done', frame: 15 },
  ],
  notes: {
    0: 'Nothing has reported yet. combineLatest has subscribed to both inputs and keeps an empty slot for each.',
    1: 'The worker reports queued. Its slot is filled, but the budget has not reported, so no row can be built.',
    2: 'The worker moves on to reading, which replaces queued in its slot. The budget is still silent, so there is still no row, and nothing says why.',
    4: 'The budget reports 90% left. Every slot is now filled, so the first row appears. It pairs the budget with reading; queued never reaches a row.',
    6: "The worker moves on to writing. The row pairs it with the budget's latest value, still 90% left.",
    8: "The budget falls to 40% left, and the row is rebuilt with the worker's unchanged state, writing.",
    10: 'The budget completes. combineLatest keeps its last value, 40% left, and the row stays open: the worker is still running.',
    12: 'The worker is done. The row pairs done with the 40% left that the completed budget left in its slot.',
    15: 'The worker completes. Every input has now completed, so the row completes.',
  },
};

export const model: StudyModelFunction = (parameters) => marbleModel(example, parameters);

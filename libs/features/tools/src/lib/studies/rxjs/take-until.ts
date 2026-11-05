import { takeUntil } from 'rxjs';

import type { StudyModelFunction } from '../study-model';
import { type MarbleExample, marbleModel } from './marbles';

/**
 * A page shows a clock the whole app shares and lets go of it when the page closes. The clock is
 * hot: it keeps ticking for its other listeners, while this page's subscriptions to the clock and
 * to its closed signal both end in the frame the signal emits. `closed$` is drawn above the clock
 * because takeUntil subscribes to it first. The strings here are what the spec beside this file
 * asserts and what the drawing reads.
 */
export const example: MarbleExample = {
  inputs: {
    closed$: {
      label: 'studyRxjs.take-until.model.example.inputs.closed.label',
      hot: true,
      marbles: '^------x',
      subscriptions: '^------!',
    },
    tick$: {
      label: 'studyRxjs.take-until.model.example.inputs.tick.label',
      hot: true,
      marbles: '^-1-2-3-4-5-6',
      subscriptions: '^------!',
    },
  },
  operator: 'studyRxjs.take-until.model.example.operator',
  outputs: {
    shown$: {
      label: 'studyRxjs.take-until.model.example.outputs.shown.label',
      marbles: '--1-2-3|',
    },
  },
  run: ({ inputs: { tick$, closed$ } }) => {
    const shown$ = tick$.pipe(takeUntil(closed$));
    return { shown$ };
  },
  moments: [
    { label: 'studyRxjs.take-until.model.example.moments.0.label', frame: 0 },
    { label: 'studyRxjs.take-until.model.example.moments.1.label', frame: 2 },
    { label: 'studyRxjs.take-until.model.example.moments.2.label', frame: 7 },
  ],
  notes: {
    0: 'studyRxjs.take-until.model.example.notes.0',
    2: 'studyRxjs.take-until.model.example.notes.2',
    7: 'studyRxjs.take-until.model.example.notes.7',
  },
  caption: 'studyRxjs.take-until.model.example.caption',
};

export const model: StudyModelFunction = (parameters, t) => marbleModel(example, parameters, t);

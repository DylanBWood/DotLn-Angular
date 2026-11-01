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
      label: 'closed$',
      hot: true,
      marbles: '^------x',
      subscriptions: '^------!',
    },
    tick$: {
      label: 'tick$',
      hot: true,
      marbles: '^-1-2-3-4-5-6',
      subscriptions: '^------!',
    },
  },
  operator: 'takeUntil(closed$)',
  outputs: {
    shown$: {
      label: 'shown$',
      marbles: '--1-2-3|',
    },
  },
  run: ({ inputs: { tick$, closed$ } }) => {
    const shown$ = tick$.pipe(takeUntil(closed$));
    return { shown$ };
  },
  moments: [
    { label: 'Page opens', frame: 0 },
    { label: 'First tick', frame: 2 },
    { label: 'Page closes', frame: 7 },
  ],
  notes: {
    0: 'The page opens. takeUntil subscribes to closed$ first and then to the clock.',
    2: 'The clock ticks and the page shows the tick.',
    7: 'The page closes and closed$ emits. takeUntil completes the output and, in the same frame, unsubscribes from the clock and from closed$.',
  },
  caption:
    'Time runs in frames. A circle is an emission, with its letter, and a bar is completion. The small ring that ends the tick$ lane is where this page let go of the clock, not where the clock stopped: the clock ticks on for its other listeners, which this drawing does not show. The ring on closed$ is where takeUntil stopped listening to the signal it had just heard. Step the frames to follow each tick.',
};

export const model: StudyModelFunction = (parameters) => marbleModel(example, parameters);

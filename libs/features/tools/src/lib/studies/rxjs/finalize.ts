import { finalize, Subject } from 'rxjs';

import type { StudyModelFunction } from '../study-model';
import { type MarbleExample, marbleModel } from './marbles';

/**
 * A download the reader abandons halfway by leaving the page, so the view unsubscribes. Two
 * clean-ups hang on it: releasing the connection, nearer the source, and hiding the spinner. The
 * download neither completes nor fails, yet both run, once each and in the order the pipe lists
 * them. The strings here are what the spec beside this file asserts and what the drawing reads.
 */
export const example: MarbleExample = {
  inputs: {
    download$: {
      label: 'download$',
      marbles: '--a--b--c--d|',
      values: { a: 'part 1', b: 'part 2', c: 'part 3', d: 'part 4' },
      subscriptions: '^------!',
    },
  },
  operator: 'finalize(release), finalize(hideSpinner)',
  outputs: {
    shown$: {
      label: 'shown$',
      marbles: '--a--b-',
      values: { a: 'part 1', b: 'part 2' },
      // The view listens from the start and leaves with the reader.
      subscriptions: '^------!',
    },
    cleanup$: {
      label: 'cleanup$',
      marbles: '-------(rh)',
      values: { r: 'released', h: 'hidden' },
    },
  },
  run: ({ inputs: { download$ } }) => {
    // Each clean-up reports itself on cleanup$, so the diagram can show when it runs.
    const cleanup$ = new Subject<string>();
    const release = () => cleanup$.next('released');
    const hideSpinner = () => cleanup$.next('hidden');
    const shown$ = download$.pipe(finalize(release), finalize(hideSpinner));
    return { shown$, cleanup$ };
  },
  moments: [
    { label: 'Started', frame: 0 },
    { label: 'First part', frame: 2 },
    { label: 'Second part', frame: 5 },
    { label: 'Reader leaves', frame: 7 },
  ],
  caption:
    'Time runs in frames. A circle is an emission, with its letter. A lane that ends in a small hollow ring is where listening stopped: the view leaves shown$, and that cuts the download off. cleanup$ is not part of the program; each clean-up reports itself there so the diagram can show when it ran, and the two on one frame ran in the order of their letters, r before h. Step the frames to follow each emission.',
  notes: {
    0: 'The reader starts the download and the spinner shows. finalize has only taken note of its two clean-ups.',
    2: 'The first part arrives and is shown. Nothing is cleaned up while the download runs.',
    5: 'The second part arrives and is shown.',
    7: 'The reader leaves the page and the view unsubscribes from shown$. It is told nothing, since it is the one that left. The subscription is torn down from the source outward: the download is cut off, the connection is released, and then the spinner is hidden.',
  },
};

export const model: StudyModelFunction = (parameters) => marbleModel(example, parameters);

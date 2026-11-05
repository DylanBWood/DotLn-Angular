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
      label: 'studyRxjs.finalize.model.example.inputs.download.label',
      marbles: '--a--b--c--d|',
      values: { a: 'part 1', b: 'part 2', c: 'part 3', d: 'part 4' },
      subscriptions: '^------!',

      valueMessages: {
        a: 'studyRxjs.finalize.model.example.inputs.download.values.a',
        b: 'studyRxjs.finalize.model.example.inputs.download.values.b',
        c: 'studyRxjs.finalize.model.example.inputs.download.values.c',
        d: 'studyRxjs.finalize.model.example.inputs.download.values.d',
      },
    },
  },
  operator: 'studyRxjs.finalize.model.example.operator',
  outputs: {
    shown$: {
      label: 'studyRxjs.finalize.model.example.outputs.shown.label',
      marbles: '--a--b-',
      values: { a: 'part 1', b: 'part 2' },
      // The view listens from the start and leaves with the reader.
      subscriptions: '^------!',

      valueMessages: {
        a: 'studyRxjs.finalize.model.example.outputs.shown.values.a',
        b: 'studyRxjs.finalize.model.example.outputs.shown.values.b',
      },
    },
    cleanup$: {
      label: 'studyRxjs.finalize.model.example.outputs.cleanup.label',
      marbles: '-------(rh)',
      values: { r: 'released', h: 'hidden' },

      valueMessages: {
        r: 'studyRxjs.finalize.model.example.outputs.cleanup.values.r',
        h: 'studyRxjs.finalize.model.example.outputs.cleanup.values.h',
      },
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
    { label: 'studyRxjs.finalize.model.example.moments.0.label', frame: 0 },
    { label: 'studyRxjs.finalize.model.example.moments.1.label', frame: 2 },
    { label: 'studyRxjs.finalize.model.example.moments.2.label', frame: 5 },
    { label: 'studyRxjs.finalize.model.example.moments.3.label', frame: 7 },
  ],
  caption: 'studyRxjs.finalize.model.example.caption',
  notes: {
    0: 'studyRxjs.finalize.model.example.notes.0',
    2: 'studyRxjs.finalize.model.example.notes.2',
    5: 'studyRxjs.finalize.model.example.notes.5',
    7: 'studyRxjs.finalize.model.example.notes.7',
  },
};

export const model: StudyModelFunction = (parameters, t) => marbleModel(example, parameters, t);

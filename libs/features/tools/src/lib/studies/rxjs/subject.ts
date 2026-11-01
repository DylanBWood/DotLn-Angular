import { type Observable, Subject } from 'rxjs';

import type { StudyModelFunction } from '../study-model';
import { type MarbleExample, marbleModel } from './marbles';

/**
 * The scene's Step button, heard through one Subject by three listeners: the painter from the
 * start, a step log opened between the first press and the second, and a summary panel that
 * subscribes after the page has closed. Like a browser's network panel opened after the page has
 * loaded, the log shows only what happens from then on. In the app a press calls next on the
 * subject; here the presses are an input the subject subscribes to, which makes the same calls.
 * Each listener subscribes to the same stream, at the frame its subscription string gives. The
 * strings here are what the spec beside this file asserts and what the drawing reads.
 */
export const example: MarbleExample = {
  inputs: {
    presses$: {
      label: 'presses$',
      marbles: '--a---b---c---|',
      values: { a: 'press 1', b: 'press 2', c: 'press 3' },
      // However many listen, the presses are subscribed to once.
      subscriptions: '^-------------!',
    },
  },
  operator: 'steps = new Subject<string>()',
  outputs: {
    painter$: {
      label: 'painter$',
      marbles: '--a---b---c---|',
      values: { a: 'press 1', b: 'press 2', c: 'press 3' },
    },
    log$: {
      label: 'log$',
      marbles: '------b---c---|',
      values: { b: 'press 2', c: 'press 3' },
      subscriptions: '----^',
    },
    latecomer$: {
      label: 'latecomer$',
      marbles: '----------------|',
      subscriptions: '----------------^',
    },
  },
  run: ({ inputs }) => {
    // The presses are strings; the cast names their type for the subject.
    const presses$ = inputs['presses$'] as Observable<string>;
    const steps = new Subject<string>();
    presses$.subscribe(steps);

    const painter$ = steps.asObservable(); // subscribed at frame 0
    const log$ = steps.asObservable(); // subscribed at frame 4
    const latecomer$ = steps.asObservable(); // subscribed at frame 16
    return { painter$, log$, latecomer$ };
  },
  moments: [
    { label: 'Press 1', frame: 2 },
    { label: 'Log subscribes', frame: 4 },
    { label: 'Press 2 to both', frame: 6 },
    { label: 'Presses end', frame: 14 },
    { label: 'Latecomer', frame: 16 },
  ],
  notes: {
    0: 'The subject has been fed the presses, once, and the painter is listening. Nothing has been pressed and the log is not open.',
    2: 'Press 1 goes into the subject, which hands it to everyone on its list: only the painter, so far. The subject keeps nothing of it.',
    4: 'The log opens and subscribes. It joins the list, and nothing is replayed because nothing was kept: it will never hear press 1.',
    6: 'Press 2 reaches the painter and the log in the same frame: one press, handed to each listener in turn.',
    10: 'Press 3 reaches both again. Each press was produced once, however many listen.',
    14: 'The page closes and the presses end, so the subject completes: it tells both listeners and empties its list.',
    16: 'The summary panel subscribes to a subject that has completed. It is told at once that it is over, and hears no press.',
  },
  caption:
    'Time runs in frames. presses$ is what the subject is fed; each line below the band is one listener, drawn from the frame it subscribes: the painter from frame 0, the log from frame 4 and the summary panel from frame 16. A circle is a press it hears, with its letter; a bar is completion. Step the frames to follow each press.',
};

export const model: StudyModelFunction = (parameters) => marbleModel(example, parameters);

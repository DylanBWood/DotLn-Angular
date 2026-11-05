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
      label: 'studyRxjs.subject.model.example.inputs.presses.label',
      marbles: '--a---b---c---|',
      values: { a: 'press 1', b: 'press 2', c: 'press 3' },
      // However many listen, the presses are subscribed to once.
      subscriptions: '^-------------!',

      valueMessages: {
        a: 'studyRxjs.subject.model.example.inputs.presses.values.a',
        b: 'studyRxjs.subject.model.example.inputs.presses.values.b',
        c: 'studyRxjs.subject.model.example.inputs.presses.values.c',
      },
    },
  },
  operator: 'studyRxjs.subject.model.example.operator',
  outputs: {
    painter$: {
      label: 'studyRxjs.subject.model.example.outputs.painter.label',
      marbles: '--a---b---c---|',
      values: { a: 'press 1', b: 'press 2', c: 'press 3' },

      valueMessages: {
        a: 'studyRxjs.subject.model.example.outputs.painter.values.a',
        b: 'studyRxjs.subject.model.example.outputs.painter.values.b',
        c: 'studyRxjs.subject.model.example.outputs.painter.values.c',
      },
    },
    log$: {
      label: 'studyRxjs.subject.model.example.outputs.log.label',
      marbles: '------b---c---|',
      values: { b: 'press 2', c: 'press 3' },
      subscriptions: '----^',

      valueMessages: {
        b: 'studyRxjs.subject.model.example.outputs.log.values.b',
        c: 'studyRxjs.subject.model.example.outputs.log.values.c',
      },
    },
    latecomer$: {
      label: 'studyRxjs.subject.model.example.outputs.latecomer.label',
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
    { label: 'studyRxjs.subject.model.example.moments.0.label', frame: 2 },
    { label: 'studyRxjs.subject.model.example.moments.1.label', frame: 4 },
    { label: 'studyRxjs.subject.model.example.moments.2.label', frame: 6 },
    { label: 'studyRxjs.subject.model.example.moments.3.label', frame: 14 },
    { label: 'studyRxjs.subject.model.example.moments.4.label', frame: 16 },
  ],
  notes: {
    0: 'studyRxjs.subject.model.example.notes.0',
    2: 'studyRxjs.subject.model.example.notes.2',
    4: 'studyRxjs.subject.model.example.notes.4',
    6: 'studyRxjs.subject.model.example.notes.6',
    10: 'studyRxjs.subject.model.example.notes.10',
    14: 'studyRxjs.subject.model.example.notes.14',
    16: 'studyRxjs.subject.model.example.notes.16',
  },
  caption: 'studyRxjs.subject.model.example.caption',

  parameterMessages: { presses: 'studyRxjs.subject.record.parameters.presses' },
};

export const model: StudyModelFunction = (parameters, t) => marbleModel(example, parameters, t);

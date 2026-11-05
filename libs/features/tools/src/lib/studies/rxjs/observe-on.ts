import { animationFrameScheduler, observeOn } from 'rxjs';

import type { StudyModelFunction } from '../study-model';
import { type MarbleExample, marbleModel } from './marbles';

/** The frames at which the browser paints: the moments animationFrameScheduler runs its queue. */
const paints = '---p---p';

/**
 * An upload's progress bar: the upload reports progress whenever the network says so, and the bar
 * hears each report only when the browser is about to paint. The upload fails before the second
 * paint, and the failure waits its turn behind the last report.
 *
 * The spec hands `paints` to the TestScheduler's `animate`, so the animation frames run exactly
 * there. The `repaint` lane draws the same string so a reader sees the paints; the pipeline never
 * subscribes to it.
 */
export const example: MarbleExample = {
  inputs: {
    progress$: {
      label: 'studyRxjs.observe-on.model.example.inputs.progress.label',
      marbles: '-ab--c#',
      values: { a: '10%', b: '30%', c: '60%' },
      error: 'connection lost',
      subscriptions: '^-----!',

      valueMessages: {
        a: 'studyRxjs.observe-on.model.example.inputs.progress.values.a',
        b: 'studyRxjs.observe-on.model.example.inputs.progress.values.b',
        c: 'studyRxjs.observe-on.model.example.inputs.progress.values.c',
      },
      errorMessage: 'studyRxjs.observe-on.model.example.inputs.progress.error',
    },
    repaint: {
      label: 'studyRxjs.observe-on.model.example.inputs.repaint.label',
      marbles: paints,
      values: { p: 'the browser paints' },

      valueMessages: {
        p: 'studyRxjs.observe-on.model.example.inputs.repaint.values.p',
      },
    },
  },
  operator: 'studyRxjs.observe-on.model.example.operator',
  outputs: {
    bar$: {
      label: 'studyRxjs.observe-on.model.example.outputs.bar.label',
      marbles: '---(ab)(c#)',
      values: { a: '10%', b: '30%', c: '60%' },
      error: 'connection lost',

      valueMessages: {
        a: 'studyRxjs.observe-on.model.example.outputs.bar.values.a',
        b: 'studyRxjs.observe-on.model.example.outputs.bar.values.b',
        c: 'studyRxjs.observe-on.model.example.outputs.bar.values.c',
      },
      errorMessage: 'studyRxjs.observe-on.model.example.outputs.bar.error',
    },
  },
  run: ({ inputs: { progress$ } }) => {
    // The bar subscribes through observeOn, so each report waits for the next paint.
    const bar$ = progress$.pipe(observeOn(animationFrameScheduler));
    return { bar$ };
  },
  animate: paints,
  // The bar's values left progress$ frames earlier and waited for the paint; nothing on the frame
  // they are delivered is where they come from, so no value rides down from the repaint marker.
  origins: { 3: null, 7: null },
  moments: [
    { label: 'studyRxjs.observe-on.model.example.moments.0.label', frame: 2 },
    { label: 'studyRxjs.observe-on.model.example.moments.1.label', frame: 3 },
    { label: 'studyRxjs.observe-on.model.example.moments.2.label', frame: 6 },
    { label: 'studyRxjs.observe-on.model.example.moments.3.label', frame: 7 },
  ],
  notes: {
    0: 'studyRxjs.observe-on.model.example.notes.0',
    1: 'studyRxjs.observe-on.model.example.notes.1',
    2: 'studyRxjs.observe-on.model.example.notes.2',
    3: 'studyRxjs.observe-on.model.example.notes.3',
    4: 'studyRxjs.observe-on.model.example.notes.4',
    5: 'studyRxjs.observe-on.model.example.notes.5',
    6: 'studyRxjs.observe-on.model.example.notes.6',
    7: 'studyRxjs.observe-on.model.example.notes.7',
  },
  caption: 'studyRxjs.observe-on.model.example.caption',

  parameterMessages: {
    reports: 'studyRxjs.observe-on.record.parameters.reports',
    failure: 'studyRxjs.observe-on.record.parameters.failure',
  },
};

export const model: StudyModelFunction = (parameters, t) => marbleModel(example, parameters, t);

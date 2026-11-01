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
      label: 'progress$',
      marbles: '-ab--c#',
      values: { a: '10%', b: '30%', c: '60%' },
      error: 'connection lost',
      subscriptions: '^-----!',
    },
    repaint: {
      label: 'repaint',
      marbles: paints,
      values: { p: 'the browser paints' },
    },
  },
  operator: 'observeOn(animationFrameScheduler)',
  outputs: {
    bar$: {
      label: 'bar$',
      marbles: '---(ab)(c#)',
      values: { a: '10%', b: '30%', c: '60%' },
      error: 'connection lost',
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
    { label: 'Reports queue', frame: 2 },
    { label: 'First paint', frame: 3 },
    { label: 'Upload fails', frame: 6 },
    { label: 'Second paint', frame: 7 },
  ],
  notes: {
    0: 'The upload starts and the bar subscribes through observeOn. Nothing has been reported yet.',
    1: 'The upload reports 10%. observeOn does not pass it on: it hands the report to animationFrameScheduler, which asks the browser for the next animation frame.',
    2: 'The upload reports 30%. A frame is already requested, so the scheduler only queues this report behind the first. The bar has heard nothing.',
    3: 'The browser is about to paint and runs the animation frame. The scheduler delivers both queued reports in order: the bar is drawn at 10% and at once at 30%, and only 30% reaches the screen.',
    4: 'Nothing new happens. The queue is empty, and the bar shows 30% until the next report is delivered.',
    5: 'The upload reports 60%. The queue is empty again, so the scheduler queues this report and requests a new frame.',
    6: 'The connection is lost and the upload errors. Its subscription ends here, but observeOn schedules the error like any other notification, behind 60%.',
    7: 'The browser paints again. The bar hears 60% and then the error, in the order they happened, in the same frame.',
  },
  caption:
    'Time runs in frames. progress$ is what the upload reports; repaint is not a stream the pipeline reads but marks each frame at which the browser is about to paint, when animationFrameScheduler runs what it holds; bar$ is what the progress bar hears. A circle is an emission, with its letter; a cross on progress$ or bar$ is the upload failing. bar$’s values do not ride down at a paint: each left progress$ frames earlier and waited in the scheduler’s queue. Step the frames to follow each report from the upload to the bar.',
};

export const model: StudyModelFunction = (parameters) => marbleModel(example, parameters);

import { ReplaySubject } from 'rxjs';

import type { StudyModelFunction } from '../study-model';
import { type MarbleExample, marbleModel } from './marbles';

const reports = {
  a: 'lint ok',
  b: 'types ok',
  c: 'tests ok',
  d: 'build ok',
  e: 'docs ok',
} as const;

/**
 * A run's report log: an executor posts its reports into a ReplaySubject that keeps the newest
 * two. A dashboard subscribed from the start hears each report as it is posted. A verifier who
 * subscribes late is handed the two the log still holds, at once and oldest first, and then hears
 * the rest live. An auditor who subscribes after the run has finished still gets the last two and
 * the completion. The strings here are what the spec beside this file asserts and what the
 * drawing reads.
 */
export const example: MarbleExample = {
  inputs: {
    report$: {
      label: 'report$',
      // The executor posts whether or not anyone is listening.
      hot: true,
      marbles: '^a-b-c----d--e-|',
      values: reports,
      // The log is the only subscriber to the reports, however many subscribe to the log.
      subscriptions: '^--------------!',
    },
  },
  operator: 'new ReplaySubject(2)',
  outputs: {
    dashboard$: {
      label: 'dashboard$',
      marbles: '-a-b-c----d--e-|',
      values: reports,
    },
    verifier$: {
      label: 'verifier$',
      marbles: '------(bc)d--e-|',
      values: reports,
      subscriptions: '------^',
    },
    auditor$: {
      label: 'auditor$',
      marbles: '------------------(de|)',
      values: reports,
      subscriptions: '------------------^',
    },
  },
  run: ({ inputs: { report$ } }) => {
    const log = new ReplaySubject(2);
    report$.subscribe(log);
    // The dashboard, the verifier and the auditor each subscribe to the log itself.
    return { dashboard$: log, verifier$: log, auditor$: log };
  },
  moments: [
    { label: 'First report', frame: 1 },
    { label: 'Verifier joins', frame: 6 },
    { label: 'Run completes', frame: 15 },
    { label: 'Auditor joins', frame: 18 },
  ],
  notes: {
    0: 'The log is empty. The dashboard has subscribed; nobody else has yet.',
    1: 'The first report, lint ok, is posted. The log records it and the dashboard hears it.',
    3: 'types ok is posted. The log now holds two reports, as many as it keeps.',
    5: 'tests ok is posted. To keep only the newest two, the log lets go of lint ok; the dashboard heard it at the time.',
    6: 'The verifier subscribes. The log hands it the two reports it holds, types ok and then tests ok, at once and before anything new is posted. lint ok is not among them: the log no longer holds it.',
    10: 'build ok is posted. The dashboard and the verifier both hear it live; the log now holds tests ok and build ok.',
    13: 'docs ok is posted and both hear it. The log holds build ok and docs ok.',
    15: 'The run completes, and so do the dashboard and the verifier. The log keeps its last two reports.',
    18: 'The auditor subscribes after the run is over. It is handed build ok and docs ok and then completes at once: a finished ReplaySubject still replays.',
  },
  caption:
    'Time runs in frames. A circle is an emission, with its letter; a bar is completion. A subscriber’s lane starts at the frame it subscribes, and circles bunched within one frame arrive together, in order, inside the subscribe call. Step the frames to follow the log.',
};

export const model: StudyModelFunction = (parameters) => marbleModel(example, parameters);

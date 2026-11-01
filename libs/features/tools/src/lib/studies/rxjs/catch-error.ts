import { catchError, map } from 'rxjs';

import type { StudyModelFunction } from '../study-model';
import { type MarbleExample, marbleModel } from './marbles';

/** What the live feed fails with; the record's `failure` parameter names the same message. */
export const failure = new Error('feed lost');

const updates = { a: '10:02', b: '10:15' };

/**
 * A departures board fed live. When the feed fails, catchError hands the error to its selector,
 * which returns the printed timetable marked with what went wrong, and the board carries on with
 * that instead of failing. The strings here are what the spec beside this file asserts and what the
 * drawing reads.
 */
export const example: MarbleExample = {
  inputs: {
    departures$: {
      label: 'departures$',
      marbles: '-a--b--#',
      values: updates,
      error: failure,
      subscriptions: '^------!',
    },
  },
  inner: {
    timetable: {
      label: 'timetable$',
      marbles: '--t|',
      values: { t: 'timetable' },
      subscriptions: '-------^--!',
    },
  },
  operator: 'catchError((error) => timetable$ …)',
  outputs: {
    board$: {
      label: 'board$',
      marbles: '-a--b----t|',
      values: { ...updates, t: `timetable: ${failure.message}` },
    },
  },
  run: ({ inputs: { departures$ }, inner }) => {
    // The printed timetable, which takes a moment to read, is the inner stream of that name.
    const timetable$ = inner['timetable'];
    const board$ = departures$.pipe(
      catchError((error: Error) => timetable$.pipe(map((entry) => `${entry}: ${error.message}`))),
    );
    return { board$ };
  },
  moments: [
    { label: 'Live update', frame: 1 },
    { label: 'Feed fails', frame: 7 },
    { label: 'Timetable shown', frame: 9 },
    { label: 'Done', frame: 10 },
  ],
  caption: `Time runs in frames, left to right. A circle is an emission, with its letter, and a bar is completion. The cross on departures$ is its error, ${failure.message}: catchError stops it before it reaches board$ and answers with timetable$, whose lane starts in that same frame. Step the frames to follow the board.`,
  notes: {
    0: 'The board has subscribed to the live feed. Nothing has arrived yet.',
    1: 'The first live update, the 10:02, goes straight to the board. Until an error comes, catchError does nothing.',
    4: 'The 10:15 update arrives and is shown in the same way.',
    7: 'The feed fails. The error stops here: catchError calls its selector with it, lets go of the feed and, in the same frame, subscribes to the replacement the selector built, the timetable marked with the error.',
    8: 'The timetable is still being read. The board shows the 10:15 and nothing new.',
    9: 'The timetable has been read. Its entry reaches the board with the reason the feed was lost attached, so the board shows a fallback and says that it is one.',
    10: "The timetable completes, so the board completes. The feed is not resumed: the board's last live update was the 10:15.",
  },
};

export const model: StudyModelFunction = (parameters) => marbleModel(example, parameters);

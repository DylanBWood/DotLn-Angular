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
      label: 'studyRxjs.catch-error.model.example.inputs.departures.label',
      marbles: '-a--b--#',
      values: updates,
      error: failure,
      subscriptions: '^------!',

      valueMessages: {
        a: 'studyRxjs.catch-error.model.example.inputs.departures.values.a',
        b: 'studyRxjs.catch-error.model.example.inputs.departures.values.b',
      },
      errorMessage: 'studyRxjs.catch-error.model.example.inputs.departures.error',
    },
  },
  inner: {
    timetable: {
      label: 'studyRxjs.catch-error.model.example.inner.timetable.label',
      marbles: '--t|',
      values: { t: 'timetable' },
      subscriptions: '-------^--!',

      valueMessages: {
        t: 'studyRxjs.catch-error.model.example.inner.timetable.values.t',
      },
    },
  },
  operator: 'studyRxjs.catch-error.model.example.operator',
  outputs: {
    board$: {
      label: 'studyRxjs.catch-error.model.example.outputs.board.label',
      marbles: '-a--b----t|',
      values: { ...updates, t: `timetable: ${failure.message}` },

      valueMessages: {
        a: 'studyRxjs.catch-error.model.example.outputs.board.values.a',
        b: 'studyRxjs.catch-error.model.example.outputs.board.values.b',
        t: 'studyRxjs.catch-error.model.example.outputs.board.values.t',
      },
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
    { label: 'studyRxjs.catch-error.model.example.moments.0.label', frame: 1 },
    { label: 'studyRxjs.catch-error.model.example.moments.1.label', frame: 7 },
    { label: 'studyRxjs.catch-error.model.example.moments.2.label', frame: 9 },
    { label: 'studyRxjs.catch-error.model.example.moments.3.label', frame: 10 },
  ],
  caption: {
    key: 'studyRxjs.catch-error.model.example.caption',
    messages: { failure: 'studyRxjs.catch-error.record.parameters.failure' },
  },
  notes: {
    0: 'studyRxjs.catch-error.model.example.notes.0',
    1: 'studyRxjs.catch-error.model.example.notes.1',
    4: 'studyRxjs.catch-error.model.example.notes.4',
    7: 'studyRxjs.catch-error.model.example.notes.7',
    8: 'studyRxjs.catch-error.model.example.notes.8',
    9: 'studyRxjs.catch-error.model.example.notes.9',
    10: 'studyRxjs.catch-error.model.example.notes.10',
  },

  parameterMessages: {
    updates: 'studyRxjs.catch-error.record.parameters.updates',
    failure: 'studyRxjs.catch-error.record.parameters.failure',
  },
};

export const model: StudyModelFunction = (parameters, t) => marbleModel(example, parameters, t);

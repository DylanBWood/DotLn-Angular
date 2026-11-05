import { timeout, TimeoutError } from 'rxjs';

import type { StudyModelFunction } from '../study-model';
import { type MarbleExample, marbleModel } from './marbles';

/**
 * The example's two waits, in frames, which the TestScheduler runs as virtual milliseconds: how
 * long the server may take to start the report, and the longest silence allowed between pages. The
 * record's parameters name the same numbers, and the spec beside this file checks that they agree.
 */
export const waits = { startup: 6, gap: 4 } as const;

/**
 * The error the operator fails with once the third page has been seen. RxJS discourages building
 * one outside the library; this one exists only so the spec can compare the run against it. Its
 * lastValue is null although a page was seen: at 7.8.2 the operator clears the last value as it
 * unsubscribes from the report, before it builds the error's info (RxJS issue 7324).
 */
const stalled = new TimeoutError({ meta: null, seen: 3, lastValue: null });

/**
 * A slow server sends a report in pages. The first page may take longer than the gaps after it,
 * and when the server stalls the reader is told so instead of waiting for ever. The strings here
 * are what the spec beside this file asserts and what the drawing reads.
 */
export const example: MarbleExample = {
  inputs: {
    report$: {
      label: 'studyRxjs.timeout.model.example.inputs.report.label',
      marbles: '-----a--b-c-----d|',
      values: { a: 'page 1', b: 'page 2', c: 'page 3', d: 'page 4' },
      subscriptions: '^-------------!',

      valueMessages: {
        a: 'studyRxjs.timeout.model.example.inputs.report.values.a',
        b: 'studyRxjs.timeout.model.example.inputs.report.values.b',
        c: 'studyRxjs.timeout.model.example.inputs.report.values.c',
        d: 'studyRxjs.timeout.model.example.inputs.report.values.d',
      },
    },
  },
  // No lane marks the waits, so the band names their values.
  operator: {
    key: 'studyRxjs.timeout.model.example.operator',
    params: { startup: waits.startup, gap: waits.gap },
  },
  outputs: {
    pages$: {
      label: 'studyRxjs.timeout.model.example.outputs.pages.label',
      marbles: '-----a--b-c---#',
      values: { a: 'page 1', b: 'page 2', c: 'page 3' },
      error: stalled,

      valueMessages: {
        a: 'studyRxjs.timeout.model.example.outputs.pages.values.a',
        b: 'studyRxjs.timeout.model.example.outputs.pages.values.b',
        c: 'studyRxjs.timeout.model.example.outputs.pages.values.c',
      },
      errorMessage: 'studyRxjs.timeout.model.example.outputs.pages.error',
    },
  },
  run: ({ inputs: { report$ } }) => {
    // In run mode the operator's default scheduler keeps the TestScheduler's virtual time.
    const { startup, gap } = waits;
    const pages$ = report$.pipe(timeout({ first: startup, each: gap }));
    return { pages$ };
  },
  moments: [
    { label: 'studyRxjs.timeout.model.example.moments.0.label', frame: 4 },
    { label: 'studyRxjs.timeout.model.example.moments.1.label', frame: 5 },
    { label: 'studyRxjs.timeout.model.example.moments.2.label', frame: 8 },
    { label: 'studyRxjs.timeout.model.example.moments.3.label', frame: 14 },
  ],
  caption: 'studyRxjs.timeout.model.example.caption',
  notes: {
    0: 'studyRxjs.timeout.model.example.notes.0',
    4: 'studyRxjs.timeout.model.example.notes.4',
    5: 'studyRxjs.timeout.model.example.notes.5',
    8: 'studyRxjs.timeout.model.example.notes.8',
    10: 'studyRxjs.timeout.model.example.notes.10',
    14: 'studyRxjs.timeout.model.example.notes.14',
  },
};

export const model: StudyModelFunction = (parameters, t) => marbleModel(example, parameters, t);

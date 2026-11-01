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
      label: 'report$',
      marbles: '-----a--b-c-----d|',
      values: { a: 'page 1', b: 'page 2', c: 'page 3', d: 'page 4' },
      subscriptions: '^-------------!',
    },
  },
  // No lane marks the waits, so the band names their values.
  operator: `timeout({ first: ${waits.startup}, each: ${waits.gap} })`,
  outputs: {
    pages$: {
      label: 'pages$',
      marbles: '-----a--b-c---#',
      values: { a: 'page 1', b: 'page 2', c: 'page 3' },
      error: stalled,
    },
  },
  run: ({ inputs: { report$ } }) => {
    // In run mode the operator's default scheduler keeps the TestScheduler's virtual time.
    const { startup, gap } = waits;
    const pages$ = report$.pipe(timeout({ first: startup, each: gap }));
    return { pages$ };
  },
  moments: [
    { label: 'Without first', frame: 4 },
    { label: 'First page', frame: 5 },
    { label: 'Wait restarts', frame: 8 },
    { label: 'Timeout', frame: 14 },
  ],
  caption:
    'Time runs in frames, one virtual millisecond each. A circle is a page, with its letter, and a cross is an error. report$ ends in a small hollow ring where timeout stopped listening to the server, and pages$ ends on the same frame in a cross, the TimeoutError it fails with. Step the frames to follow each wait.',
  notes: {
    0: 'The report is requested and the startup wait begins. It is the longer wait, because the server needs time to start a report.',
    4: 'Had the first page been held to the gap wait, it would have run out here, before the server answered. The startup wait is still running.',
    5: 'The first page arrives inside the startup wait and is shown. The timer starts again, now for the shorter gap wait.',
    8: 'The second page arrives inside its gap and is shown. The timer starts again from here, not from the start of the report.',
    10: 'The third page arrives sooner still and is shown. The timer starts again.',
    14: 'No page has come within a gap of the third. timeout stops listening to the server and fails pages$ with a TimeoutError that counts the pages seen; its record of the last page is already empty.',
  },
};

export const model: StudyModelFunction = (parameters) => marbleModel(example, parameters);

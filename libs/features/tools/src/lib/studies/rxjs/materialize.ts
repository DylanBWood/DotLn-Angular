import { materialize } from 'rxjs';

import type { StudyModelFunction } from '../study-model';
import { type MarbleExample, marbleModel } from './marbles';

/** Why the import stops. A string rather than an Error, so the record it lands in can name it. */
const reason = 'row 3 is unreadable';

/**
 * An import reads two rows of a spreadsheet and fails on the third, and a log panel reads the
 * import through materialize, so the rows and the failure reach it alike, as records. Each record
 * is written as a plain object: its kind, its value or error, and the hasValue flag RxJS 7 still
 * sets on every record it emits, which the comparison requires. The strings here are what the
 * spec beside this file asserts and what the drawing reads.
 */
export const example: MarbleExample = {
  inputs: {
    import$: {
      label: 'import$',
      marbles: '-a--b--#',
      values: { a: 'row 1', b: 'row 2' },
      error: reason,
      subscriptions: '^------!',
    },
  },
  operator: 'materialize()',
  outputs: {
    log$: {
      label: 'log$',
      marbles: '-a--b--(e|)',
      values: {
        a: { kind: 'N', value: 'row 1', hasValue: true },
        b: { kind: 'N', value: 'row 2', hasValue: true },
        e: { kind: 'E', error: reason, hasValue: false },
      },
    },
  },
  run: ({ inputs: { import$ } }) => {
    const log$ = import$.pipe(materialize());
    return { log$ };
  },
  moments: [
    { label: 'First row', frame: 1 },
    { label: 'Second row', frame: 4 },
    { label: 'The failure, as a record', frame: 7 },
  ],
  caption:
    'Time runs in frames, left to right. A circle is an emission, with its letter, and a bar is completion. The cross on import$ is its error: materialize sends it on as the record e and then completes log$, so log$ ends in a bar rather than a cross. Step the frames to follow each record.',
  notes: {
    0: 'The log panel has subscribed; nothing has been imported yet.',
    1: 'The first row arrives. materialize does not pass the row itself on: it emits a record of kind N whose value is the row.',
    2: 'The import is reading its second row; the log has nothing new.',
    4: 'The second row arrives and leaves as a second record of kind N.',
    5: 'The import is reading its third row.',
    7: 'The import fails. log$ does not fail with it: materialize emits the failure as a record of kind E carrying the reason, and then completes log$. A subscriber that handles only values still learns why the import stopped.',
  },
};

export const model: StudyModelFunction = (parameters) => marbleModel(example, parameters);

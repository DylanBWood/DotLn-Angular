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
      label: 'studyRxjs.materialize.model.example.inputs.import.label',
      marbles: '-a--b--#',
      values: { a: 'row 1', b: 'row 2' },
      error: reason,
      subscriptions: '^------!',

      valueMessages: {
        a: 'studyRxjs.materialize.model.example.inputs.import.values.a',
        b: 'studyRxjs.materialize.model.example.inputs.import.values.b',
      },
      errorMessage: 'studyRxjs.materialize.model.example.inputs.import.error',
    },
  },
  operator: 'studyRxjs.materialize.model.example.operator',
  outputs: {
    log$: {
      label: 'studyRxjs.materialize.model.example.outputs.log.label',
      marbles: '-a--b--(e|)',
      values: {
        a: { kind: 'N', value: 'row 1', hasValue: true },
        b: { kind: 'N', value: 'row 2', hasValue: true },
        e: { kind: 'E', error: reason, hasValue: false },
      },

      valueMessages: {
        a: 'studyRxjs.materialize.model.example.outputs.log.values.a',
        b: 'studyRxjs.materialize.model.example.outputs.log.values.b',
        e: 'studyRxjs.materialize.model.example.outputs.log.values.e',
      },
    },
  },
  run: ({ inputs: { import$ } }) => {
    const log$ = import$.pipe(materialize());
    return { log$ };
  },
  moments: [
    { label: 'studyRxjs.materialize.model.example.moments.0.label', frame: 1 },
    { label: 'studyRxjs.materialize.model.example.moments.1.label', frame: 4 },
    { label: 'studyRxjs.materialize.model.example.moments.2.label', frame: 7 },
  ],
  caption: 'studyRxjs.materialize.model.example.caption',
  notes: {
    0: 'studyRxjs.materialize.model.example.notes.0',
    1: 'studyRxjs.materialize.model.example.notes.1',
    2: 'studyRxjs.materialize.model.example.notes.2',
    4: 'studyRxjs.materialize.model.example.notes.4',
    5: 'studyRxjs.materialize.model.example.notes.5',
    7: 'studyRxjs.materialize.model.example.notes.7',
  },

  parameterMessages: {
    rows: 'studyRxjs.materialize.record.parameters.rows',
    reason: 'studyRxjs.materialize.record.parameters.reason',
  },
};

export const model: StudyModelFunction = (parameters, t) => marbleModel(example, parameters, t);

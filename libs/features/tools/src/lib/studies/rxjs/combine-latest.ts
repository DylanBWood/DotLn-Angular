import { combineLatest, map, type Observable } from 'rxjs';

import type { StudyMessage } from '../study-message';
import type { StudyModelFunction } from '../study-model';
import { type MarbleExample, marbleModel } from './marbles';

interface Budgets {
  readonly a: number;
  readonly b: number;
}

const budgets: Budgets = { a: 90, b: 40 };
const workerStates = { q: 'queued', r: 'reading', w: 'writing', d: 'done' } as const;
const workerMessages = {
  q: 'studyRxjs.combine-latest.model.example.inputs.worker.values.q',
  r: 'studyRxjs.combine-latest.model.example.inputs.worker.values.r',
  w: 'studyRxjs.combine-latest.model.example.inputs.worker.values.w',
  d: 'studyRxjs.combine-latest.model.example.inputs.worker.values.d',
};
const budgetPayload = (budget: number) => `${budget}% left`;
const budgetMessage = (budget: number): StudyMessage => ({
  key: 'studyRxjs.combine-latest.model.budget',
  params: { budget },
});

/** A dashboard row carries a stable protocol value and a description of those same facts. */
const row = (state: keyof typeof workerStates, budget: number) => ({
  value: `${workerStates[state]}, ${budgetPayload(budget)}`,
  message: {
    key: 'studyRxjs.combine-latest.model.row',
    params: { budget },
    messages: { state: workerMessages[state] },
  },
});

const rowsOf = (reports: Budgets) => ({
  1: row('r', reports.a),
  2: row('w', reports.a),
  3: row('w', reports.b),
  4: row('d', reports.b),
});

const rows = rowsOf(budgets);

const notesOf = (reports: Budgets): Readonly<Record<number, StudyMessage>> => ({
  0: 'studyRxjs.combine-latest.model.example.notes.0',
  1: 'studyRxjs.combine-latest.model.example.notes.1',
  2: 'studyRxjs.combine-latest.model.example.notes.2',
  4: { key: 'studyRxjs.combine-latest.model.example.notes.4', params: { budget: reports.a } },
  6: { key: 'studyRxjs.combine-latest.model.example.notes.6', params: { budget: reports.a } },
  8: { key: 'studyRxjs.combine-latest.model.example.notes.8', params: { budget: reports.b } },
  10: { key: 'studyRxjs.combine-latest.model.example.notes.10', params: { budget: reports.b } },
  12: { key: 'studyRxjs.combine-latest.model.example.notes.12', params: { budget: reports.b } },
  15: 'studyRxjs.combine-latest.model.example.notes.15',
});

/**
 * A task's row on a dashboard: it shows the worker's latest state beside the budget it has left,
 * and is rebuilt whenever either changes, once both have reported. The strings here are what the
 * spec beside this file asserts and what the drawing reads.
 */
export const example: MarbleExample = {
  inputs: {
    worker$: {
      label: 'studyRxjs.combine-latest.model.example.inputs.worker.label',
      marbles: '-qr---w-----d--|',
      values: workerStates,

      valueMessages: workerMessages,
    },
    budget$: {
      label: 'studyRxjs.combine-latest.model.example.inputs.budget.label',
      marbles: '----a---b-|',
      values: { a: budgetPayload(budgets.a), b: budgetPayload(budgets.b) },

      valueMessages: {
        a: budgetMessage(budgets.a),
        b: budgetMessage(budgets.b),
      },
    },
  },
  operator: 'studyRxjs.combine-latest.model.example.operator',
  outputs: {
    row$: {
      label: 'studyRxjs.combine-latest.model.example.outputs.row.label',
      marbles: '----1-2-3---4--|',
      values: {
        1: rows[1].value,
        2: rows[2].value,
        3: rows[3].value,
        4: rows[4].value,
      },

      valueMessages: {
        1: rows[1].message,
        2: rows[2].message,
        3: rows[3].message,
        4: rows[4].message,
      },
    },
  },
  run: ({ inputs }) => {
    // The worker's states and the budget's reports are the text the letters stand for.
    const worker$ = inputs['worker$'] as Observable<string>;
    const budget$ = inputs['budget$'] as Observable<string>;
    const row$ = combineLatest([worker$, budget$]).pipe(map((latest) => latest.join(', ')));
    return { row$ };
  },
  moments: [
    {
      label: 'studyRxjs.combine-latest.model.example.moments.0.label',
      frame: 2,
    },
    {
      label: 'studyRxjs.combine-latest.model.example.moments.1.label',
      frame: 4,
    },
    {
      label: 'studyRxjs.combine-latest.model.example.moments.2.label',
      frame: 8,
    },
    {
      label: 'studyRxjs.combine-latest.model.example.moments.3.label',
      frame: 10,
    },
    {
      label: 'studyRxjs.combine-latest.model.example.moments.4.label',
      frame: 15,
    },
  ],
  notes: notesOf(budgets),

  parameterMessages: {
    workerStates: 'studyRxjs.combine-latest.record.parameters.workerStates',
    budgets: 'studyRxjs.combine-latest.record.parameters.budgets',
  },
};

export const model: StudyModelFunction = (parameters, t) => marbleModel(example, parameters, t);

/** Change reported percentages without changing combineLatest's pairing or event schedule. */
export function withBudgets(changes: Partial<Budgets>): MarbleExample {
  const next = { ...budgets, ...changes };
  const result = rowsOf(next);
  return {
    ...example,
    inputs: {
      ...example.inputs,
      budget$: {
        ...example.inputs['budget$'],
        values: { a: budgetPayload(next.a), b: budgetPayload(next.b) },
        valueMessages: { a: budgetMessage(next.a), b: budgetMessage(next.b) },
      },
    },
    outputs: {
      row$: {
        ...example.outputs['row$'],
        values: { 1: result[1].value, 2: result[2].value, 3: result[3].value, 4: result[4].value },
        valueMessages: {
          1: result[1].message,
          2: result[2].message,
          3: result[3].message,
          4: result[4].message,
        },
      },
    },
    notes: notesOf(next),
  };
}

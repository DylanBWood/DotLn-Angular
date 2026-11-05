import { type Observable, scan } from 'rxjs';

import type { StudyMessage } from '../study-message';
import type { StudyModelFunction } from '../study-model';
import { type MarbleExample, marbleModel } from './marbles';

/** The balance the account opens with: the seed, which the record names as `opening`. */
export const opening = 10;

type Amounts = Readonly<Record<'a' | 'b' | 'c', number>>;

const amounts: Amounts = { a: 5, b: -3, c: 4 };

/** Expected balances and narration share these numbers; the pipeline still folds the feed. */
const balancesOf = (feed: Amounts) => {
  const x = opening + feed.a;
  const y = x + feed.b;
  const z = y + feed.c;
  return { statement: { x, y, z }, phone: { q: opening + feed.c } };
};

const balances = balancesOf(amounts);

const notesOf = (
  feed: Amounts,
  result: ReturnType<typeof balancesOf>,
): Readonly<Record<number, StudyMessage>> => ({
  0: { key: 'studyRxjs.scan.model.example.notes.0', params: { opening } },
  1: {
    key: 'studyRxjs.scan.model.example.notes.1',
    params: { deposit: feed.a, opening, balance: result.statement.x },
  },
  4: {
    key: 'studyRxjs.scan.model.example.notes.4',
    params: {
      withdrawal: Math.abs(feed.b),
      before: result.statement.x,
      balance: result.statement.y,
    },
  },
  5: { key: 'studyRxjs.scan.model.example.notes.5', params: { opening } },
  8: {
    key: 'studyRxjs.scan.model.example.notes.8',
    params: {
      deposit: feed.c,
      before: result.statement.y,
      balance: result.statement.z,
      opening,
      phone: result.phone.q,
    },
  },
  11: 'studyRxjs.scan.model.example.notes.11',
});

/**
 * A bank's live feed of amounts, folded into a running balance. A statement subscribes from the
 * start and a phone app subscribes to the same balance stream later; each subscription keeps its
 * own fold. The strings here are what the spec beside this file asserts and what the drawing reads.
 */
export const example: MarbleExample = {
  inputs: {
    amount$: {
      label: 'studyRxjs.scan.model.example.inputs.amount.label',
      hot: true,
      marbles: '^a--b---c--|',
      values: amounts,
    },
  },
  operator: 'studyRxjs.scan.model.example.operator',
  outputs: {
    statement$: {
      label: 'studyRxjs.scan.model.example.outputs.statement.label',
      marbles: '-x--y---z--|',
      values: balances.statement,
    },
    phone$: {
      label: 'studyRxjs.scan.model.example.outputs.phone.label',
      marbles: '--------q--|',
      values: balances.phone,
      subscriptions: '-----^',
    },
  },
  run: ({ inputs }) => {
    // The feed's amounts are the numbers the marble string's letters stand for.
    const amount$ = inputs['amount$'] as Observable<number>;
    const balance$ = amount$.pipe(scan((balance, amount) => balance + amount, opening));
    // Both readers subscribe to the same stream; the phone subscribes at frame 5.
    return { statement$: balance$, phone$: balance$ };
  },
  moments: [
    { label: 'studyRxjs.scan.model.example.moments.0.label', frame: 1 },
    { label: 'studyRxjs.scan.model.example.moments.1.label', frame: 4 },
    { label: 'studyRxjs.scan.model.example.moments.2.label', frame: 5 },
    { label: 'studyRxjs.scan.model.example.moments.3.label', frame: 8 },
    { label: 'studyRxjs.scan.model.example.moments.4.label', frame: 11 },
  ],
  notes: notesOf(amounts, balances),

  parameterMessages: { amounts: 'studyRxjs.scan.record.parameters.amounts' },
};

export const model: StudyModelFunction = (parameters, t) => marbleModel(example, parameters, t);

/** Change the deposits/withdrawal without changing the fold, subscriptions or message templates. */
export function withAmounts(changes: Partial<Amounts>): MarbleExample {
  const next = { ...amounts, ...changes };
  const result = balancesOf(next);
  return {
    ...example,
    inputs: { amount$: { ...example.inputs['amount$'], values: next } },
    outputs: {
      statement$: { ...example.outputs['statement$'], values: result.statement },
      phone$: { ...example.outputs['phone$'], values: result.phone },
    },
    notes: notesOf(next, result),
  };
}

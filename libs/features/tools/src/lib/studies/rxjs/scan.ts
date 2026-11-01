import { type Observable, scan } from 'rxjs';

import type { StudyModelFunction } from '../study-model';
import { type MarbleExample, marbleModel } from './marbles';

/** The balance the account opens with: the seed, which the record names as `opening`. */
export const opening = 10;

/**
 * A bank's live feed of amounts, folded into a running balance. A statement subscribes from the
 * start and a phone app subscribes to the same balance stream later; each subscription keeps its
 * own fold. The strings here are what the spec beside this file asserts and what the drawing reads.
 */
export const example: MarbleExample = {
  inputs: {
    amount$: {
      label: 'amount$',
      hot: true,
      marbles: '^a--b---c--|',
      values: { a: 5, b: -3, c: 4 },
    },
  },
  operator: 'scan(balance + amount, opening)',
  outputs: {
    statement$: {
      label: 'statement$',
      marbles: '-x--y---z--|',
      values: { x: 15, y: 12, z: 16 },
    },
    phone$: {
      label: 'phone$',
      marbles: '--------q--|',
      values: { q: 14 },
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
    { label: 'First deposit', frame: 1 },
    { label: 'Withdrawal', frame: 4 },
    { label: 'Phone subscribes', frame: 5 },
    { label: 'Balances differ', frame: 8 },
    { label: 'Done', frame: 11 },
  ],
  notes: {
    0: 'The statement subscribes. scan holds the opening, 10, as its state and sends nothing: no amount has arrived yet.',
    1: 'A deposit of 5 arrives. scan adds it to the 10 it holds, keeps the result and sends it: the statement shows 15.',
    4: 'A withdrawal of 3 arrives. The state is now 15, not the opening, so the statement shows 12.',
    5: 'The phone subscribes to the same balance stream. scan starts a separate fold for it from the opening, 10; the deposit and the withdrawal before this frame are not replayed to it.',
    8: 'A deposit of 4 reaches both folds. The statement adds it to 12 and shows 16; the phone adds it to 10 and shows 14, a balance the account never had.',
    11: 'The feed completes, and both balances complete with nothing more sent: each last balance went out at frame 8.',
  },
};

export const model: StudyModelFunction = (parameters) => marbleModel(example, parameters);

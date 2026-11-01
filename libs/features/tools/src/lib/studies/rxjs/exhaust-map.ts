import { exhaustMap } from 'rxjs';

import type { StudyModelFunction } from '../study-model';
import { type MarbleExample, marbleModel } from './marbles';

/**
 * A Save button: each press carries the form's draft, and a press that arrives while a save is
 * still running opens nothing, so one save runs at a time and none overlaps another. The strings
 * here are what the spec beside this file asserts and what the drawing reads.
 */
export const example: MarbleExample = {
  inputs: {
    press$: {
      label: 'press$',
      marbles: '-a-b----c-d|',
      values: { a: 'draft 1', b: 'draft 2', c: 'draft 3', d: 'draft 4' },
    },
  },
  // Only the drafts exhaustMap takes have a save: a press it turns away never calls save at all.
  inner: {
    'draft 1': {
      label: 'save(draft 1)',
      marbles: '----1|',
      values: { 1: 'draft 1 saved' },
      subscriptions: '-^----!',
    },
    'draft 3': {
      label: 'save(draft 3)',
      marbles: '----3|',
      values: { 3: 'draft 3 saved' },
      subscriptions: '--------^----!',
    },
  },
  operator: 'exhaustMap((draft) => save(draft))',
  outputs: {
    saved$: {
      label: 'saved$',
      marbles: '-----1------3|',
      values: { 1: 'draft 1 saved', 3: 'draft 3 saved' },
    },
  },
  run: ({ inputs: { press$ }, inner }) => {
    // The save of one draft is the inner stream named after it.
    const save = (draft: unknown) => inner[String(draft)];
    const saved$ = press$.pipe(exhaustMap((draft) => save(draft)));
    return { saved$ };
  },
  moments: [
    { label: 'draft 1 opens a save', frame: 1 },
    { label: 'draft 2 while busy', frame: 3 },
    { label: 'draft 3 opens a save', frame: 8 },
    { label: 'draft 4 while busy', frame: 10 },
    { label: 'Done', frame: 13 },
  ],
  notes: {
    0: 'Nothing has been pressed yet.',
    1: 'The first press brings draft 1. Nothing is running, so save(draft 1) is opened.',
    2: 'save(draft 1) is running and has not answered yet.',
    3: 'The second press brings draft 2 while save(draft 1) is still running, so exhaustMap opens nothing for it and save(draft 1) carries on.',
    4: 'save(draft 1) is still running, so a press now would also open nothing.',
    5: 'save(draft 1) answers, and the answer goes straight to the output.',
    6: 'save(draft 1) completes. Nothing is running now, so the next press will open a save.',
    7: 'Nothing is running and nothing is pressed: the button is free.',
    8: 'The third press brings draft 3. Nothing is running, so save(draft 3) is opened.',
    9: 'save(draft 3) is running and has not answered yet.',
    10: 'The fourth press brings draft 4 while save(draft 3) is running, so again nothing is opened.',
    11: 'The form closes and press$ completes. save(draft 3) is still running, so the output stays open.',
    12: 'save(draft 3) answers, and the answer goes to the output.',
    13: 'save(draft 3) completes. press$ has completed and nothing is running, so the output completes.',
  },
  caption:
    'Time runs in frames. A circle is an emission, with its letter, and a bar is completion. Each save lane starts below the press that opened it; a press with no save lane below it was turned away while a save ran, so save was never called for b or d. Step the frames to follow each press.',
};

export const model: StudyModelFunction = (parameters) => marbleModel(example, parameters);

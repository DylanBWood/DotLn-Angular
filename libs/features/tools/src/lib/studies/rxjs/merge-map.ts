import { mergeMap } from 'rxjs';

import type { StudyModelFunction } from '../study-model';
import { type MarbleExample, marbleModel } from './marbles';

/**
 * Three photos uploaded to a shared album where each photo carries its own place, so the uploads
 * are independent: each starts the moment its photo is added, they run side by side, and the
 * answers go out in the order the uploads finish. The concatMap study beside this one takes the
 * same inputs and runs the uploads one at a time. The strings here are what the spec beside this
 * file asserts and what the drawing reads.
 */
export const example: MarbleExample = {
  inputs: {
    photo$: {
      label: 'photo$',
      marbles: '-a-b-c--|',
      values: { a: 'cat', b: 'dog', c: 'owl' },
    },
  },
  inner: {
    cat: {
      label: 'upload(cat)',
      marbles: '-----1|',
      values: { 1: 'cat stored' },
      subscriptions: '-^-----!',
    },
    dog: {
      label: 'upload(dog)',
      marbles: '-2|',
      values: { 2: 'dog stored' },
      subscriptions: '---^-!',
    },
    owl: {
      label: 'upload(owl)',
      marbles: '--3|',
      values: { 3: 'owl stored' },
      subscriptions: '-----^--!',
    },
  },
  operator: 'mergeMap((photo) => upload(photo))',
  outputs: {
    stored$: {
      label: 'stored$',
      marbles: '----2-13|',
      values: { 1: 'cat stored', 2: 'dog stored', 3: 'owl stored' },
    },
  },
  run: ({ inputs: { photo$ }, inner }) => {
    // Uploading one photo is the inner stream named after it.
    const upload = (photo: unknown) => inner[String(photo)];
    const stored$ = photo$.pipe(mergeMap((photo) => upload(photo)));
    return { stored$ };
  },
  moments: [
    { label: 'cat starts', frame: 1 },
    { label: 'dog runs beside cat', frame: 3 },
    { label: 'dog overtakes cat', frame: 4 },
    { label: 'owl starts at once', frame: 5 },
    { label: 'Done', frame: 8 },
  ],
  notes: {
    0: 'No photo has been added yet.',
    1: 'The user adds cat, a large photo, and its upload starts at once.',
    3: "dog arrives and its upload starts straight away, beside cat's: nothing waits for anything else.",
    4: "dog is small, so the server answers it first, and its answer goes out ahead of cat's, which was sent earlier.",
    5: "dog's upload completes. owl arrives and its upload starts at once, while cat is still uploading.",
    6: "The server answers cat's upload, the second of the three to be answered.",
    7: "cat's upload completes and the server answers owl's.",
    8: "owl's upload completes and the user has finished adding photos, so the output completes: all three are stored, in the order their uploads finished.",
  },
};

export const model: StudyModelFunction = (parameters) => marbleModel(example, parameters);

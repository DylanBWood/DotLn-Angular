import { concatMap } from 'rxjs';

import type { StudyModelFunction } from '../study-model';
import { type MarbleExample, marbleModel } from './marbles';

/**
 * Three photos uploaded to a shared album that places each photo when its upload finishes. To keep
 * the album in the order the photos were added, each upload runs only after the one before it has
 * completed; a photo that arrives meanwhile waits its turn, and its upload is not even prepared
 * until then. The mergeMap study beside this one takes the same inputs and runs the uploads at
 * once. The strings here are what the spec beside this file asserts and what the drawing reads.
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
      subscriptions: '-------^-!',
    },
    owl: {
      label: 'upload(owl)',
      marbles: '--3|',
      values: { 3: 'owl stored' },
      subscriptions: '---------^--!',
    },
  },
  operator: 'concatMap((photo) => upload(photo))',
  outputs: {
    stored$: {
      label: 'stored$',
      marbles: '------1-2--3|',
      values: { 1: 'cat stored', 2: 'dog stored', 3: 'owl stored' },
    },
  },
  run: ({ inputs: { photo$ }, inner }) => {
    // Uploading one photo is the inner stream named after it.
    const upload = (photo: unknown) => inner[String(photo)];
    const stored$ = photo$.pipe(concatMap((photo) => upload(photo)));
    return { stored$ };
  },
  moments: [
    { label: 'cat starts', frame: 1 },
    { label: 'dog and owl queue', frame: 5 },
    { label: 'cat done, dog starts', frame: 7 },
    { label: 'No more photos', frame: 8 },
    { label: 'Done', frame: 12 },
  ],
  notes: {
    0: 'No photo has been added yet.',
    1: 'The user adds cat, a large photo. Nothing is uploading, so its upload starts at once.',
    3: 'dog arrives while cat is still uploading. It is not sent: it waits at the back of the queue, and its upload has not even been prepared.',
    5: 'owl arrives and queues behind dog. Two photos now wait, in the order they were added.',
    6: "The server answers cat's upload and the answer goes out. The upload has not completed yet, so dog goes on waiting.",
    7: "cat's upload completes, and only now is dog's upload prepared and sent.",
    8: 'dog is small and the server answers straight away. The user has finished adding photos, but the output stays open: owl is still waiting.',
    9: "dog's upload completes and owl's starts.",
    11: "The server answers owl's upload. The photos have been stored in the order they were added.",
    12: "owl's upload completes. No more photos are coming and none is waiting, so the output completes.",
  },
};

export const model: StudyModelFunction = (parameters) => marbleModel(example, parameters);

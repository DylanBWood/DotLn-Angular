import { concatMap } from 'rxjs';

import type { StudyModelFunction } from '../study-model';
import { type MarbleExample, marbleModel } from './marbles';

const photos = { a: 'cat', b: 'dog', c: 'owl' };

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
      label: 'studyRxjs.concat-map.model.example.inputs.photo.label',
      marbles: '-a-b-c--|',
      values: photos,

      valueMessages: {
        a: 'studyRxjs.concat-map.model.example.inputs.photo.values.a',
        b: 'studyRxjs.concat-map.model.example.inputs.photo.values.b',
        c: 'studyRxjs.concat-map.model.example.inputs.photo.values.c',
      },
    },
  },
  inner: {
    cat: {
      label: 'studyRxjs.concat-map.model.example.inner.cat.label',
      marbles: '-----1|',
      values: { 1: 'cat stored' },
      subscriptions: '-^-----!',

      valueMessages: {
        '1': 'studyRxjs.concat-map.model.example.inner.cat.values.1',
      },
    },
    dog: {
      label: 'studyRxjs.concat-map.model.example.inner.dog.label',
      marbles: '-2|',
      values: { 2: 'dog stored' },
      subscriptions: '-------^-!',

      valueMessages: {
        '2': 'studyRxjs.concat-map.model.example.inner.dog.values.2',
      },
    },
    owl: {
      label: 'studyRxjs.concat-map.model.example.inner.owl.label',
      marbles: '--3|',
      values: { 3: 'owl stored' },
      subscriptions: '---------^--!',

      valueMessages: {
        '3': 'studyRxjs.concat-map.model.example.inner.owl.values.3',
      },
    },
  },
  operator: 'studyRxjs.concat-map.model.example.operator',
  outputs: {
    stored$: {
      label: 'studyRxjs.concat-map.model.example.outputs.stored.label',
      marbles: '------1-2--3|',
      values: { 1: 'cat stored', 2: 'dog stored', 3: 'owl stored' },

      valueMessages: {
        '1': 'studyRxjs.concat-map.model.example.outputs.stored.values.1',
        '2': 'studyRxjs.concat-map.model.example.outputs.stored.values.2',
        '3': 'studyRxjs.concat-map.model.example.outputs.stored.values.3',
      },
    },
  },
  run: ({ inputs: { photo$ }, inner }) => {
    // Uploading one photo is the inner stream named after it.
    const upload = (photo: unknown) => inner[String(photo)];
    const stored$ = photo$.pipe(concatMap((photo) => upload(photo)));
    return { stored$ };
  },
  moments: [
    { label: 'studyRxjs.concat-map.model.example.moments.0.label', frame: 1 },
    { label: 'studyRxjs.concat-map.model.example.moments.1.label', frame: 5 },
    { label: 'studyRxjs.concat-map.model.example.moments.2.label', frame: 7 },
    { label: 'studyRxjs.concat-map.model.example.moments.3.label', frame: 8 },
    { label: 'studyRxjs.concat-map.model.example.moments.4.label', frame: 12 },
  ],
  notes: {
    0: 'studyRxjs.concat-map.model.example.notes.0',
    1: 'studyRxjs.concat-map.model.example.notes.1',
    3: 'studyRxjs.concat-map.model.example.notes.3',
    5: {
      key: 'studyRxjs.concat-map.model.example.notes.5',
      params: { waiting: Object.values(photos).slice(1).length },
    },
    6: 'studyRxjs.concat-map.model.example.notes.6',
    7: 'studyRxjs.concat-map.model.example.notes.7',
    8: 'studyRxjs.concat-map.model.example.notes.8',
    9: 'studyRxjs.concat-map.model.example.notes.9',
    11: 'studyRxjs.concat-map.model.example.notes.11',
    12: 'studyRxjs.concat-map.model.example.notes.12',
  },

  parameterMessages: {
    photos: 'studyRxjs.concat-map.record.parameters.photos',
  },
};

export const model: StudyModelFunction = (parameters, t) => marbleModel(example, parameters, t);

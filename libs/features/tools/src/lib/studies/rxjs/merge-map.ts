import { mergeMap } from 'rxjs';

import type { StudyModelFunction } from '../study-model';
import { type MarbleExample, marbleModel } from './marbles';

const photos = { a: 'cat', b: 'dog', c: 'owl' };

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
      label: 'studyRxjs.merge-map.model.example.inputs.photo.label',
      marbles: '-a-b-c--|',
      values: photos,

      valueMessages: {
        a: 'studyRxjs.merge-map.model.example.inputs.photo.values.a',
        b: 'studyRxjs.merge-map.model.example.inputs.photo.values.b',
        c: 'studyRxjs.merge-map.model.example.inputs.photo.values.c',
      },
    },
  },
  inner: {
    cat: {
      label: 'studyRxjs.merge-map.model.example.inner.cat.label',
      marbles: '-----1|',
      values: { 1: 'cat stored' },
      subscriptions: '-^-----!',

      valueMessages: {
        '1': 'studyRxjs.merge-map.model.example.inner.cat.values.1',
      },
    },
    dog: {
      label: 'studyRxjs.merge-map.model.example.inner.dog.label',
      marbles: '-2|',
      values: { 2: 'dog stored' },
      subscriptions: '---^-!',

      valueMessages: {
        '2': 'studyRxjs.merge-map.model.example.inner.dog.values.2',
      },
    },
    owl: {
      label: 'studyRxjs.merge-map.model.example.inner.owl.label',
      marbles: '--3|',
      values: { 3: 'owl stored' },
      subscriptions: '-----^--!',

      valueMessages: {
        '3': 'studyRxjs.merge-map.model.example.inner.owl.values.3',
      },
    },
  },
  operator: 'studyRxjs.merge-map.model.example.operator',
  outputs: {
    stored$: {
      label: 'studyRxjs.merge-map.model.example.outputs.stored.label',
      marbles: '----2-13|',
      values: { 1: 'cat stored', 2: 'dog stored', 3: 'owl stored' },

      valueMessages: {
        '1': 'studyRxjs.merge-map.model.example.outputs.stored.values.1',
        '2': 'studyRxjs.merge-map.model.example.outputs.stored.values.2',
        '3': 'studyRxjs.merge-map.model.example.outputs.stored.values.3',
      },
    },
  },
  run: ({ inputs: { photo$ }, inner }) => {
    // Uploading one photo is the inner stream named after it.
    const upload = (photo: unknown) => inner[String(photo)];
    const stored$ = photo$.pipe(mergeMap((photo) => upload(photo)));
    return { stored$ };
  },
  moments: [
    { label: 'studyRxjs.merge-map.model.example.moments.0.label', frame: 1 },
    { label: 'studyRxjs.merge-map.model.example.moments.1.label', frame: 3 },
    { label: 'studyRxjs.merge-map.model.example.moments.2.label', frame: 4 },
    { label: 'studyRxjs.merge-map.model.example.moments.3.label', frame: 5 },
    { label: 'studyRxjs.merge-map.model.example.moments.4.label', frame: 8 },
  ],
  notes: {
    0: 'studyRxjs.merge-map.model.example.notes.0',
    1: 'studyRxjs.merge-map.model.example.notes.1',
    3: 'studyRxjs.merge-map.model.example.notes.3',
    4: 'studyRxjs.merge-map.model.example.notes.4',
    5: 'studyRxjs.merge-map.model.example.notes.5',
    6: {
      key: 'studyRxjs.merge-map.model.example.notes.6',
      params: { uploads: Object.keys(photos).length },
    },
    7: 'studyRxjs.merge-map.model.example.notes.7',
    8: {
      key: 'studyRxjs.merge-map.model.example.notes.8',
      params: { stored: Object.keys(photos).length },
    },
  },

  parameterMessages: { photos: 'studyRxjs.merge-map.record.parameters.photos' },
};

export const model: StudyModelFunction = (parameters, t) => marbleModel(example, parameters, t);

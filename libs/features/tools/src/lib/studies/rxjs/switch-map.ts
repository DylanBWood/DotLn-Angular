import { switchMap } from 'rxjs';

import type { StudyModelFunction } from '../study-model';
import { type MarbleExample, marbleModel } from './marbles';

/**
 * A search box: each query opens a request for its results, and a newer query cancels the request
 * still in flight, so what is shown always belongs to the latest query. The strings here are what
 * the spec beside this file asserts and what the drawing reads.
 */
export const example: MarbleExample = {
  inputs: {
    query$: {
      label: 'studyRxjs.switch-map.model.example.inputs.query.label',
      marbles: '-a---b-c------|',
      values: { a: 'ant', b: 'bee', c: 'cat' },

      valueMessages: {
        a: 'studyRxjs.switch-map.model.example.inputs.query.values.a',
        b: 'studyRxjs.switch-map.model.example.inputs.query.values.b',
        c: 'studyRxjs.switch-map.model.example.inputs.query.values.c',
      },
    },
  },
  inner: {
    ant: {
      label: 'studyRxjs.switch-map.model.example.inner.ant.label',
      marbles: '---1--2|',
      values: { 1: 'ant, page 1', 2: 'ant, page 2' },
      subscriptions: '-^---!',

      valueMessages: {
        '1': 'studyRxjs.switch-map.model.example.inner.ant.values.1',
        '2': 'studyRxjs.switch-map.model.example.inner.ant.values.2',
      },
    },
    bee: {
      label: 'studyRxjs.switch-map.model.example.inner.bee.label',
      marbles: '---3--4|',
      values: { 3: 'bee, page 1', 4: 'bee, page 2' },
      subscriptions: '-----^-!',

      valueMessages: {
        '3': 'studyRxjs.switch-map.model.example.inner.bee.values.3',
        '4': 'studyRxjs.switch-map.model.example.inner.bee.values.4',
      },
    },
    cat: {
      label: 'studyRxjs.switch-map.model.example.inner.cat.label',
      marbles: '---5--6|',
      values: { 5: 'cat, page 1', 6: 'cat, page 2' },
      subscriptions: '-------^------!',

      valueMessages: {
        '5': 'studyRxjs.switch-map.model.example.inner.cat.values.5',
        '6': 'studyRxjs.switch-map.model.example.inner.cat.values.6',
      },
    },
  },
  operator: 'studyRxjs.switch-map.model.example.operator',
  outputs: {
    shown$: {
      label: 'studyRxjs.switch-map.model.example.outputs.shown.label',
      marbles: '----1-----5--6|',
      values: { 1: 'ant, page 1', 5: 'cat, page 1', 6: 'cat, page 2' },

      valueMessages: {
        '1': 'studyRxjs.switch-map.model.example.outputs.shown.values.1',
        '5': 'studyRxjs.switch-map.model.example.outputs.shown.values.5',
        '6': 'studyRxjs.switch-map.model.example.outputs.shown.values.6',
      },
    },
  },
  run: ({ inputs: { query$ }, inner }) => {
    // The request for one query is the inner stream named after it.
    const results = (query: unknown) => inner[String(query)];
    const shown$ = query$.pipe(switchMap((query) => results(query)));
    return { shown$ };
  },
  moments: [
    { label: 'studyRxjs.switch-map.model.example.moments.0.label', frame: 1 },
    { label: 'studyRxjs.switch-map.model.example.moments.1.label', frame: 5 },
    { label: 'studyRxjs.switch-map.model.example.moments.2.label', frame: 7 },
    { label: 'studyRxjs.switch-map.model.example.moments.3.label', frame: 14 },
  ],
  notes: {
    0: 'studyRxjs.switch-map.model.example.notes.0',
    1: 'studyRxjs.switch-map.model.example.notes.1',
    4: 'studyRxjs.switch-map.model.example.notes.4',
    5: 'studyRxjs.switch-map.model.example.notes.5',
    7: 'studyRxjs.switch-map.model.example.notes.7',
    10: 'studyRxjs.switch-map.model.example.notes.10',
    13: 'studyRxjs.switch-map.model.example.notes.13',
    14: 'studyRxjs.switch-map.model.example.notes.14',
  },

  parameterMessages: {
    queries: 'studyRxjs.switch-map.record.parameters.queries',
  },
};

export const model: StudyModelFunction = (parameters, t) => marbleModel(example, parameters, t);

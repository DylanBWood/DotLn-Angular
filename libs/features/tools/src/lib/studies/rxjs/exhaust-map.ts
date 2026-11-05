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
      label: 'studyRxjs.exhaust-map.model.example.inputs.press.label',
      marbles: '-a-b----c-d|',
      values: { a: 'draft 1', b: 'draft 2', c: 'draft 3', d: 'draft 4' },

      valueMessages: {
        a: 'studyRxjs.exhaust-map.model.example.inputs.press.values.a',
        b: 'studyRxjs.exhaust-map.model.example.inputs.press.values.b',
        c: 'studyRxjs.exhaust-map.model.example.inputs.press.values.c',
        d: 'studyRxjs.exhaust-map.model.example.inputs.press.values.d',
      },
    },
  },
  // Only the drafts exhaustMap takes have a save: a press it turns away never calls save at all.
  inner: {
    'draft 1': {
      label: 'studyRxjs.exhaust-map.model.example.inner.draft-1.label',
      marbles: '----1|',
      values: { 1: 'draft 1 saved' },
      subscriptions: '-^----!',

      valueMessages: {
        '1': 'studyRxjs.exhaust-map.model.example.inner.draft-1.values.1',
      },
    },
    'draft 3': {
      label: 'studyRxjs.exhaust-map.model.example.inner.draft-3.label',
      marbles: '----3|',
      values: { 3: 'draft 3 saved' },
      subscriptions: '--------^----!',

      valueMessages: {
        '3': 'studyRxjs.exhaust-map.model.example.inner.draft-3.values.3',
      },
    },
  },
  operator: 'studyRxjs.exhaust-map.model.example.operator',
  outputs: {
    saved$: {
      label: 'studyRxjs.exhaust-map.model.example.outputs.saved.label',
      marbles: '-----1------3|',
      values: { 1: 'draft 1 saved', 3: 'draft 3 saved' },

      valueMessages: {
        '1': 'studyRxjs.exhaust-map.model.example.outputs.saved.values.1',
        '3': 'studyRxjs.exhaust-map.model.example.outputs.saved.values.3',
      },
    },
  },
  run: ({ inputs: { press$ }, inner }) => {
    // The save of one draft is the inner stream named after it.
    const save = (draft: unknown) => inner[String(draft)];
    const saved$ = press$.pipe(exhaustMap((draft) => save(draft)));
    return { saved$ };
  },
  moments: [
    { label: 'studyRxjs.exhaust-map.model.example.moments.0.label', frame: 1 },
    { label: 'studyRxjs.exhaust-map.model.example.moments.1.label', frame: 3 },
    { label: 'studyRxjs.exhaust-map.model.example.moments.2.label', frame: 8 },
    { label: 'studyRxjs.exhaust-map.model.example.moments.3.label', frame: 10 },
    { label: 'studyRxjs.exhaust-map.model.example.moments.4.label', frame: 13 },
  ],
  notes: {
    0: 'studyRxjs.exhaust-map.model.example.notes.0',
    1: 'studyRxjs.exhaust-map.model.example.notes.1',
    2: 'studyRxjs.exhaust-map.model.example.notes.2',
    3: 'studyRxjs.exhaust-map.model.example.notes.3',
    4: 'studyRxjs.exhaust-map.model.example.notes.4',
    5: 'studyRxjs.exhaust-map.model.example.notes.5',
    6: 'studyRxjs.exhaust-map.model.example.notes.6',
    7: 'studyRxjs.exhaust-map.model.example.notes.7',
    8: 'studyRxjs.exhaust-map.model.example.notes.8',
    9: 'studyRxjs.exhaust-map.model.example.notes.9',
    10: 'studyRxjs.exhaust-map.model.example.notes.10',
    11: 'studyRxjs.exhaust-map.model.example.notes.11',
    12: 'studyRxjs.exhaust-map.model.example.notes.12',
    13: 'studyRxjs.exhaust-map.model.example.notes.13',
  },
  caption: 'studyRxjs.exhaust-map.model.example.caption',

  parameterMessages: {
    drafts: 'studyRxjs.exhaust-map.record.parameters.drafts',
  },
};

export const model: StudyModelFunction = (parameters, t) => marbleModel(example, parameters, t);

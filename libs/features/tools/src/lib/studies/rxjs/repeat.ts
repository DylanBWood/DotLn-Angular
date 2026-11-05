import { defer, repeat } from 'rxjs';

import type { StudyModelFunction } from '../study-model';
import { type MarbleExample, marbleModel } from './marbles';

/** Which declared runs have ended at the two completion milestones the narration names. */
const completedRuns = { first: ['check$'], second: ['check$', 'second'] };

/**
 * A page asks for a build's status three times, waiting after each answer. The check is cold, as
 * an HTTP request is: each subscription sends a new request and reads the build as it is at that
 * moment, so each run is drawn as a line of its own. The first run is the source as the page wrote
 * it; the later ones are the subscriptions repeat makes again. The strings here are what the spec
 * beside this file asserts and what the drawing reads.
 */
export const example: MarbleExample = {
  inputs: {
    check$: {
      label: 'studyRxjs.repeat.model.example.inputs.check.label',
      marbles: '--q|',
      values: { q: 'queued' },
      subscriptions: '^--!',

      valueMessages: {
        q: 'studyRxjs.repeat.model.example.inputs.check.values.q',
      },
    },
  },
  inner: {
    second: {
      label: 'studyRxjs.repeat.model.example.inner.second.label',
      marbles: '--r|',
      values: { r: 'running' },
      subscriptions: '-----^--!',

      valueMessages: {
        r: 'studyRxjs.repeat.model.example.inner.second.values.r',
      },
    },
    third: {
      label: 'studyRxjs.repeat.model.example.inner.third.label',
      marbles: '--p|',
      values: { p: 'passed' },
      subscriptions: '----------^--!',

      valueMessages: {
        p: 'studyRxjs.repeat.model.example.inner.third.values.p',
      },
    },
  },
  operator: 'studyRxjs.repeat.model.example.operator',
  outputs: {
    status$: {
      label: 'studyRxjs.repeat.model.example.outputs.status.label',
      marbles: '--q----r----p|',
      values: { q: 'queued', r: 'running', p: 'passed' },

      valueMessages: {
        q: 'studyRxjs.repeat.model.example.outputs.status.values.q',
        r: 'studyRxjs.repeat.model.example.outputs.status.values.r',
        p: 'studyRxjs.repeat.model.example.outputs.status.values.p',
      },
    },
  },
  run: ({ inputs, inner }) => {
    // Each subscription to check$ sends a new request: the next run in turn.
    const runs = [inputs['check$'], inner['second'], inner['third']];
    let sent = 0;
    const check$ = defer(() => runs[sent++]);
    const status$ = check$.pipe(repeat({ count: 3, delay: 2 }));
    return { status$ };
  },
  moments: [
    { label: 'studyRxjs.repeat.model.example.moments.0.label', frame: 2 },
    { label: 'studyRxjs.repeat.model.example.moments.1.label', frame: 3 },
    { label: 'studyRxjs.repeat.model.example.moments.2.label', frame: 5 },
    { label: 'studyRxjs.repeat.model.example.moments.3.label', frame: 10 },
    { label: 'studyRxjs.repeat.model.example.moments.4.label', frame: 13 },
  ],
  caption: 'studyRxjs.repeat.model.example.caption',
  notes: {
    0: 'studyRxjs.repeat.model.example.notes.0',
    1: 'studyRxjs.repeat.model.example.notes.1',
    2: 'studyRxjs.repeat.model.example.notes.2',
    3: {
      key: 'studyRxjs.repeat.model.example.notes.3',
      params: { completed: completedRuns.first.length },
    },
    4: 'studyRxjs.repeat.model.example.notes.4',
    5: 'studyRxjs.repeat.model.example.notes.5',
    6: 'studyRxjs.repeat.model.example.notes.6',
    7: 'studyRxjs.repeat.model.example.notes.7',
    8: {
      key: 'studyRxjs.repeat.model.example.notes.8',
      params: { completed: completedRuns.second.length },
    },
    9: 'studyRxjs.repeat.model.example.notes.9',
    10: 'studyRxjs.repeat.model.example.notes.10',
    11: 'studyRxjs.repeat.model.example.notes.11',
    12: 'studyRxjs.repeat.model.example.notes.12',
    13: 'studyRxjs.repeat.model.example.notes.13',
  },

  parameterMessages: { answers: 'studyRxjs.repeat.record.parameters.answers' },
};

export const model: StudyModelFunction = (parameters, t) => marbleModel(example, parameters, t);

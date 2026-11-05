import { startWith } from 'rxjs';

import type { StudyModelFunction } from '../study-model';
import { type MarbleExample, marbleModel } from './marbles';

const statuses = { w: 'waiting', r: 'running', p: 'passed' } as const;

/**
 * Status panels: each subscribes to a worker's status, which says nothing until the worker has
 * started, so startWith seeds it with an explicit initial status and a panel is never blank. The
 * seed goes out on subscription, before the source is subscribed, and the worker's own reports
 * follow unchanged. A second panel opened while the worker is already running is given the same
 * seed. The strings here are what the spec beside this file asserts and what the drawing reads.
 */
export const example: MarbleExample = {
  inputs: {
    status$: {
      label: 'studyRxjs.start-with.model.example.inputs.status.label',
      // The worker reports whether or not a panel is watching.
      hot: true,
      marbles: '^---r----p-|',
      values: statuses,

      valueMessages: {
        w: 'studyRxjs.start-with.model.example.inputs.status.values.w',
        r: 'studyRxjs.start-with.model.example.inputs.status.values.r',
        p: 'studyRxjs.start-with.model.example.inputs.status.values.p',
      },
    },
  },
  operator: 'studyRxjs.start-with.model.example.operator',
  outputs: {
    panel$: {
      label: 'studyRxjs.start-with.model.example.outputs.panel.label',
      marbles: 'w---r----p-|',
      values: statuses,

      valueMessages: {
        w: 'studyRxjs.start-with.model.example.outputs.panel.values.w',
        r: 'studyRxjs.start-with.model.example.outputs.panel.values.r',
        p: 'studyRxjs.start-with.model.example.outputs.panel.values.p',
      },
    },
    latePanel$: {
      label: 'studyRxjs.start-with.model.example.outputs.latePanel.label',
      marbles: '------w--p-|',
      values: statuses,
      subscriptions: '------^',

      valueMessages: {
        w: 'studyRxjs.start-with.model.example.outputs.latePanel.values.w',
        r: 'studyRxjs.start-with.model.example.outputs.latePanel.values.r',
        p: 'studyRxjs.start-with.model.example.outputs.latePanel.values.p',
      },
    },
  },
  run: ({ inputs: { status$ } }) => {
    const shown$ = status$.pipe(startWith('waiting'));
    // Both panels subscribe to shown$: the first at once, the second when it is opened.
    return { panel$: shown$, latePanel$: shown$ };
  },
  moments: [
    { label: 'studyRxjs.start-with.model.example.moments.0.label', frame: 0 },
    { label: 'studyRxjs.start-with.model.example.moments.1.label', frame: 4 },
    { label: 'studyRxjs.start-with.model.example.moments.2.label', frame: 6 },
    { label: 'studyRxjs.start-with.model.example.moments.3.label', frame: 11 },
  ],
  notes: {
    0: 'studyRxjs.start-with.model.example.notes.0',
    4: 'studyRxjs.start-with.model.example.notes.4',
    6: 'studyRxjs.start-with.model.example.notes.6',
    9: 'studyRxjs.start-with.model.example.notes.9',
    11: 'studyRxjs.start-with.model.example.notes.11',
  },
  caption: 'studyRxjs.start-with.model.example.caption',

  parameterMessages: {
    seed: 'studyRxjs.start-with.record.parameters.seed',
    reports: 'studyRxjs.start-with.record.parameters.reports',
  },
};

export const model: StudyModelFunction = (parameters, t) => marbleModel(example, parameters, t);

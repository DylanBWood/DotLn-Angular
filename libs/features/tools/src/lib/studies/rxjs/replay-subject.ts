import { ReplaySubject } from 'rxjs';

import type { StudyModelFunction } from '../study-model';
import { type MarbleExample, marbleModel } from './marbles';

const reports = {
  a: 'lint ok',
  b: 'types ok',
  c: 'tests ok',
  d: 'build ok',
  e: 'docs ok',
} as const;

const verifierReplay = ['b', 'c'];
const auditorReplay = ['d', 'e'];

/**
 * A run's report log: an executor posts its reports into a ReplaySubject that keeps the newest
 * two. A dashboard subscribed from the start hears each report as it is posted. A verifier who
 * subscribes late is handed the two the log still holds, at once and oldest first, and then hears
 * the rest live. An auditor who subscribes after the run has finished still gets the last two and
 * the completion. The strings here are what the spec beside this file asserts and what the
 * drawing reads.
 */
export const example: MarbleExample = {
  inputs: {
    report$: {
      label: 'studyRxjs.replay-subject.model.example.inputs.report.label',
      // The executor posts whether or not anyone is listening.
      hot: true,
      marbles: '^a-b-c----d--e-|',
      values: reports,
      // The log is the only subscriber to the reports, however many subscribe to the log.
      subscriptions: '^--------------!',

      valueMessages: {
        a: 'studyRxjs.replay-subject.model.example.inputs.report.values.a',
        b: 'studyRxjs.replay-subject.model.example.inputs.report.values.b',
        c: 'studyRxjs.replay-subject.model.example.inputs.report.values.c',
        d: 'studyRxjs.replay-subject.model.example.inputs.report.values.d',
        e: 'studyRxjs.replay-subject.model.example.inputs.report.values.e',
      },
    },
  },
  operator: 'studyRxjs.replay-subject.model.example.operator',
  outputs: {
    dashboard$: {
      label: 'studyRxjs.replay-subject.model.example.outputs.dashboard.label',
      marbles: '-a-b-c----d--e-|',
      values: reports,

      valueMessages: {
        a: 'studyRxjs.replay-subject.model.example.outputs.dashboard.values.a',
        b: 'studyRxjs.replay-subject.model.example.outputs.dashboard.values.b',
        c: 'studyRxjs.replay-subject.model.example.outputs.dashboard.values.c',
        d: 'studyRxjs.replay-subject.model.example.outputs.dashboard.values.d',
        e: 'studyRxjs.replay-subject.model.example.outputs.dashboard.values.e',
      },
    },
    verifier$: {
      label: 'studyRxjs.replay-subject.model.example.outputs.verifier.label',
      marbles: `------(${verifierReplay.join('')})d--e-|`,
      values: reports,
      subscriptions: '------^',

      valueMessages: {
        a: 'studyRxjs.replay-subject.model.example.outputs.verifier.values.a',
        b: 'studyRxjs.replay-subject.model.example.outputs.verifier.values.b',
        c: 'studyRxjs.replay-subject.model.example.outputs.verifier.values.c',
        d: 'studyRxjs.replay-subject.model.example.outputs.verifier.values.d',
        e: 'studyRxjs.replay-subject.model.example.outputs.verifier.values.e',
      },
    },
    auditor$: {
      label: 'studyRxjs.replay-subject.model.example.outputs.auditor.label',
      marbles: `------------------(${auditorReplay.join('')}|)`,
      values: reports,
      subscriptions: '------------------^',

      valueMessages: {
        a: 'studyRxjs.replay-subject.model.example.outputs.auditor.values.a',
        b: 'studyRxjs.replay-subject.model.example.outputs.auditor.values.b',
        c: 'studyRxjs.replay-subject.model.example.outputs.auditor.values.c',
        d: 'studyRxjs.replay-subject.model.example.outputs.auditor.values.d',
        e: 'studyRxjs.replay-subject.model.example.outputs.auditor.values.e',
      },
    },
  },
  run: ({ inputs: { report$ } }) => {
    const log = new ReplaySubject(2);
    report$.subscribe(log);
    // The dashboard, the verifier and the auditor each subscribe to the log itself.
    return { dashboard$: log, verifier$: log, auditor$: log };
  },
  moments: [
    {
      label: 'studyRxjs.replay-subject.model.example.moments.0.label',
      frame: 1,
    },
    {
      label: 'studyRxjs.replay-subject.model.example.moments.1.label',
      frame: 6,
    },
    {
      label: 'studyRxjs.replay-subject.model.example.moments.2.label',
      frame: 15,
    },
    {
      label: 'studyRxjs.replay-subject.model.example.moments.3.label',
      frame: 18,
    },
  ],
  notes: {
    0: 'studyRxjs.replay-subject.model.example.notes.0',
    1: 'studyRxjs.replay-subject.model.example.notes.1',
    3: {
      key: 'studyRxjs.replay-subject.model.example.notes.3',
      params: { held: verifierReplay.length },
    },
    5: {
      key: 'studyRxjs.replay-subject.model.example.notes.5',
      params: { kept: verifierReplay.length },
    },
    6: {
      key: 'studyRxjs.replay-subject.model.example.notes.6',
      params: { replayed: verifierReplay.length },
    },
    10: 'studyRxjs.replay-subject.model.example.notes.10',
    13: 'studyRxjs.replay-subject.model.example.notes.13',
    15: {
      key: 'studyRxjs.replay-subject.model.example.notes.15',
      params: { kept: auditorReplay.length },
    },
    18: 'studyRxjs.replay-subject.model.example.notes.18',
  },
  caption: 'studyRxjs.replay-subject.model.example.caption',

  parameterMessages: {
    reports: 'studyRxjs.replay-subject.record.parameters.reports',
  },
};

export const model: StudyModelFunction = (parameters, t) => marbleModel(example, parameters, t);

import type { StudyParameters } from '@dotln-angular/models';

import { matchKind } from '../match-kind';
import {
  statesModel,
  type StatesMomentText,
  type StatesShape,
  type StatesSnapshot,
} from '../states';
import { studyParameterValues } from '../study-message';
import type {
  StatesStudyModel,
  StudyComparison,
  StudyInput,
  StudyMoment,
  StudyWorkedStep,
} from '../study-model';
import type { StudyTranslate } from '../study-translate';
import {
  afterEachReading,
  chunkOf,
  type LazyLoadParameters,
  type LazyLoadStep,
  type RecordState,
  studies,
  type StudyId,
} from './lazy-load.simulation';

/** The whole run as the presentation reads it: the example, its steps and the record's inputs. */
export interface LazyLoadRun {
  readonly example: LazyLoadParameters;
  readonly steps: readonly LazyLoadStep[];
  /** The same readings loaded one chunk to the work and one chunk to each study, for the comparison. */
  readonly perWork: readonly LazyLoadStep[];
  readonly perStudy: readonly LazyLoadStep[];
  readonly parameters: StudyParameters;
}

/** One moment of the run, by its index among the steps. */
interface LazyLoadMoment {
  readonly run: LazyLoadRun;
  readonly index: number;
}

const stepAt = ({ run, index }: LazyLoadMoment) => run.steps[index];

// Each study's name, the reading it belongs to as the step notes name it, and the letter its token
// shows; the compiler requires an entry for every study the reader opens.
const names = {
  lazyLoad: 'studyPoeaa.lazy-load.model.names.lazyLoad',
  unitOfWork: 'studyPoeaa.lazy-load.model.names.unitOfWork',
  recordSet: 'studyPoeaa.lazy-load.model.names.recordSet',
} as const satisfies Record<StudyId, string>;
const readings = {
  lazyLoad: 'studyPoeaa.lazy-load.model.readings.lazyLoad',
  unitOfWork: 'studyPoeaa.lazy-load.model.readings.unitOfWork',
  recordSet: 'studyPoeaa.lazy-load.model.readings.recordSet',
} as const satisfies Record<StudyId, string>;
const tokens = { lazyLoad: 'L', unitOfWork: 'U', recordSet: 'R' } as const satisfies Record<
  StudyId,
  string
>;

const nameOf = (t: StudyTranslate, id: StudyId): string => t(names[id]);

const readingOf = (t: StudyTranslate, id: StudyId): string => t(readings[id]);

const shapeOf = (t: StudyTranslate): StatesShape => ({
  nodes: [
    { id: 'marker', label: t('studyPoeaa.lazy-load.model.states.marker'), tone: 'subject' },
    { id: 'loading', label: t('studyPoeaa.lazy-load.model.states.loading'), tone: 'subject' },
    { id: 'loaded', label: t('studyPoeaa.lazy-load.model.states.loaded') },
  ],
  objects: studies.map((id) => ({ id, label: nameOf(t, id), key: tokens[id] })),
  transitions: [
    {
      id: 'firstRead',
      from: 'marker',
      to: 'loading',
      label: t('studyPoeaa.lazy-load.model.operations.firstRead'),
    },
    {
      id: 'carried',
      from: 'marker',
      to: 'loading',
      label: t('studyPoeaa.lazy-load.model.operations.carried'),
    },
    {
      id: 'retry',
      from: 'marker',
      to: 'loading',
      label: t('studyPoeaa.lazy-load.model.operations.retry'),
    },
    {
      id: 'arrive',
      from: 'loading',
      to: 'loaded',
      label: t('studyPoeaa.lazy-load.model.operations.arrive'),
    },
    {
      id: 'fail',
      from: 'loading',
      to: 'marker',
      label: t('studyPoeaa.lazy-load.model.operations.fail'),
    },
    {
      id: 'cachedRead',
      from: 'loaded',
      to: 'loaded',
      label: t('studyPoeaa.lazy-load.model.operations.cachedRead'),
    },
  ],
});

/**
 * The transitions a step's moves cannot be told by their states alone: a request takes its chunk
 * from marker to loading three ways, as the read itself, as a study the chunk carries along, or as
 * a retry, and a read from memory leaves its study where it stood. An arrival and a failure each
 * join their two states by a transition of their own.
 */
function tookAt(example: LazyLoadParameters, step: LazyLoadStep): Readonly<Record<string, string>> {
  const { operation } = step;
  if (operation.kind === 'cached') return { [operation.id]: 'cachedRead' };
  if (operation.kind !== 'request') return {};
  const way = (id: StudyId) => {
    if (operation.retry) return 'retry';
    return id === operation.id ? 'firstRead' : 'carried';
  };
  return Object.fromEntries(chunkOf(example, operation.id).map((id) => [id, way(id)]));
}

const snapshotOf = (example: LazyLoadParameters, step: LazyLoadStep): StatesSnapshot => ({
  at: { ...step.loader.recordStates },
  took: tookAt(example, step),
});

/** The few words beside a study's name: what its record is and how this step reached it. */
function objectNote(t: StudyTranslate, moment: LazyLoadMoment, id: StudyId): string {
  const { operation, loader } = stepAt(moment);
  const asked = 'id' in operation && operation.id === id;
  const notes: Record<RecordState, () => string> = {
    marker: () =>
      operation.kind === 'fail' && chunkOf(moment.run.example, operation.id).includes(id)
        ? t('studyPoeaa.lazy-load.model.notes.failed')
        : t('studyPoeaa.lazy-load.model.notes.marker'),
    loading: () =>
      asked
        ? t('studyPoeaa.lazy-load.model.notes.asked')
        : t('studyPoeaa.lazy-load.model.notes.carried'),
    loaded: () =>
      operation.kind === 'cached' && asked
        ? t('studyPoeaa.lazy-load.model.notes.fromMemory')
        : t('studyPoeaa.lazy-load.model.notes.loaded'),
  };
  return notes[loader.recordStates[id]]();
}

/** The sentence under the drawing: what the reader or the loader did at this step. */
function stepNote(t: StudyTranslate, moment: LazyLoadMoment): string {
  const { operation, loader } = stepAt(moment);
  const { chunkPerStudy } = moment.run.example;
  return matchKind(operation, {
    start: () => t('studyPoeaa.lazy-load.model.steps.start'),
    filter: () => t('studyPoeaa.lazy-load.model.steps.filter'),
    request: ({ id, retry }) => {
      if (retry) return t('studyPoeaa.lazy-load.model.steps.retry', { requests: loader.requests });
      return chunkPerStudy
        ? t('studyPoeaa.lazy-load.model.steps.requestStudy', { name: readingOf(t, id) })
        : t('studyPoeaa.lazy-load.model.steps.requestWork', { name: readingOf(t, id) });
    },
    arrive: ({ id }) =>
      chunkPerStudy
        ? t('studyPoeaa.lazy-load.model.steps.arriveStudy', {
            name: readingOf(t, id),
            records: loader.records,
          })
        : t('studyPoeaa.lazy-load.model.steps.arriveWork', { records: loader.records }),
    fail: () => t('studyPoeaa.lazy-load.model.steps.fail'),
    cached: ({ id }) => t('studyPoeaa.lazy-load.model.steps.cached', { name: readingOf(t, id) }),
  });
}

/** The note under the worked lines: what a failure forgets, or where each record now comes from. */
function workedNote(t: StudyTranslate, moment: LazyLoadMoment): string {
  const { operation, loader } = stepAt(moment);
  if (operation.kind === 'fail') return t('studyPoeaa.lazy-load.model.worked.forgotten');
  if (loader.records === 0) return t('studyPoeaa.lazy-load.model.worked.beforeLoad');
  return moment.run.example.chunkPerStudy
    ? t('studyPoeaa.lazy-load.model.worked.eachOwn')
    : t('studyPoeaa.lazy-load.model.worked.fromMemory');
}

/** The loader's counts at this moment, with what a request carries, as the worked lines. */
function workedOf(t: StudyTranslate, moment: LazyLoadMoment): StudyWorkedStep {
  const { operation, loader, opened } = stepAt(moment);
  const { example } = moment.run;
  const lines = [
    t('studyPoeaa.lazy-load.model.worked.opened', { opened }),
    t('studyPoeaa.lazy-load.model.worked.requests', { requests: loader.requests }),
    t('studyPoeaa.lazy-load.model.worked.records', { records: loader.records }),
  ];
  if (operation.kind === 'request')
    lines.push(
      example.chunkPerStudy
        ? t('studyPoeaa.lazy-load.model.worked.carriesStudy', { name: readingOf(t, operation.id) })
        : t('studyPoeaa.lazy-load.model.worked.carriesWork', { count: example.studiesInChunk }),
    );
  return {
    title: t('studyPoeaa.lazy-load.model.worked.title', { step: moment.index }),
    lines,
    note: workedNote(t, moment),
  };
}

/** The values the record's prose reads at a moment, with the example's own inputs among them. */
function textOf(t: StudyTranslate, moment: LazyLoadMoment): StatesMomentText {
  const { loader, opened } = stepAt(moment);
  const { example, parameters } = moment.run;
  return {
    values: {
      ...studyParameterValues(parameters, t),
      requests: String(loader.requests),
      records: String(loader.records),
      opened: String(opened),
      chunking: example.chunkPerStudy
        ? t('studyPoeaa.lazy-load.model.values.perStudy')
        : t('studyPoeaa.lazy-load.model.values.perWork', {
            studiesInChunk: example.studiesInChunk,
          }),
      failure:
        example.failFirst > 0
          ? t('studyPoeaa.lazy-load.model.values.fails')
          : t('studyPoeaa.lazy-load.model.values.noFailure'),
    },
    note: stepNote(t, moment),
    worked: workedOf(t, moment),
    notes: Object.fromEntries(studies.map((id) => [id, objectNote(t, moment, id)])),
  };
}

/** The same readings loaded both ways, one chunk for the work or one per study, by readings opened. */
function comparisonOf(t: StudyTranslate, run: LazyLoadRun): StudyComparison<'counts'> {
  const perWork = afterEachReading(run.perWork);
  const perStudy = afterEachReading(run.perStudy);
  const work = perWork[perWork.length - 1];
  const study = perStudy[perStudy.length - 1];
  return {
    title: t('studyPoeaa.lazy-load.model.comparison.title'),
    intro: t('studyPoeaa.lazy-load.model.comparison.intro'),
    timeline: {
      title: t('studyPoeaa.lazy-load.model.comparison.chart'),
      xLabel: t('studyPoeaa.lazy-load.model.comparison.xLabel'),
      yLabel: t('studyPoeaa.lazy-load.model.comparison.yLabel'),
      counts: perWork.map((_, opened) => opened),
      series: [
        {
          id: 'perWork',
          label: t('studyPoeaa.lazy-load.model.comparison.perWork'),
          tone: 'actual',
          values: perWork.map(({ requests }) => requests),
        },
        {
          id: 'perStudy',
          label: t('studyPoeaa.lazy-load.model.comparison.perStudy'),
          tone: 'desired',
          values: perStudy.map(({ requests }) => requests),
        },
      ],
      xTicks: perWork.map((_, opened) => opened),
    },
    findings: [
      t('studyPoeaa.lazy-load.model.comparison.requests', {
        opened: perWork.length - 1,
        workRequests: work.requests,
        workRecords: work.records,
        studyRequests: study.requests,
        studyRecords: study.records,
      }),
      t('studyPoeaa.lazy-load.model.comparison.ripple', {
        studiesInChunk: run.example.studiesInChunk,
      }),
    ],
  };
}

const inputsOf = (t: StudyTranslate): readonly StudyInput[] => [
  {
    name: 'failFirst',
    label: t('studyPoeaa.lazy-load.model.inputs.failFirst'),
    unit: t('studyPoeaa.lazy-load.model.inputs.inAll'),
    min: 0,
    max: 1,
    step: 1,
  },
  {
    name: 'chunkPerStudy',
    label: t('studyPoeaa.lazy-load.model.inputs.chunkPerStudy'),
    unit: t('studyPoeaa.lazy-load.model.inputs.yesOrNo'),
    min: 0,
    max: 1,
    step: 1,
  },
];

/** The named moments: the markers, the first read, a failure where there is one, arrival, and a read from memory. */
function momentsOf(t: StudyTranslate, run: LazyLoadRun): readonly StudyMoment[] {
  const first = (kind: LazyLoadStep['operation']['kind']) =>
    run.steps.findIndex(({ operation }) => operation.kind === kind);
  const moments: StudyMoment[] = [
    { label: t('studyPoeaa.lazy-load.model.moments.markers'), step: 0 },
    { label: t('studyPoeaa.lazy-load.model.moments.firstRead'), step: first('request') },
  ];
  if (first('fail') >= 0)
    moments.push({ label: t('studyPoeaa.lazy-load.model.moments.failed'), step: first('fail') });
  moments.push({ label: t('studyPoeaa.lazy-load.model.moments.arrived'), step: first('arrive') });
  moments.push(
    first('cached') >= 0
      ? { label: t('studyPoeaa.lazy-load.model.moments.fromMemory'), step: first('cached') }
      : { label: t('studyPoeaa.lazy-load.model.moments.lastRead'), step: run.steps.length - 1 },
  );
  return moments;
}

/** The run drawn as a register: each study's row, its record's state as the column, at every step. */
export function present(run: LazyLoadRun, t: StudyTranslate): StatesStudyModel {
  return statesModel(
    {
      shape: shapeOf(t),
      snapshots: run.steps.map((step) => snapshotOf(run.example, step)),
      text: run.steps.map((_, index) => textOf(t, { run, index })),
    },
    {
      moments: momentsOf(t, run),
      comparison: comparisonOf(t, run),
      inputs: inputsOf(t),
    },
    t,
  );
}

import type { PanelId, StudyParameters } from '@dotln-angular/models';

import { countTicks } from '../drawing';
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
  boardPanels,
  type BoardSources,
  type FacadeOperation,
  oneByOneCalls,
  panelState,
  readPanel,
  type RemoteFacadeParameters,
  type RemoteFacadeStep,
  walkRounds,
} from './remote-facade.simulation';

/** The whole run as the presentation reads it: the example, its sources, its steps and the inputs. */
export interface RemoteFacadeRun {
  readonly example: RemoteFacadeParameters;
  readonly sources: BoardSources;
  readonly steps: readonly RemoteFacadeStep[];
  readonly parameters: StudyParameters;
}

/** One moment of the run, by its place in the steps. */
interface RemoteFacadeMoment {
  readonly run: RemoteFacadeRun;
  readonly index: number;
}

const stepAt = ({ run, index }: RemoteFacadeMoment) => run.steps[index];

// Each panel's name and the number its token shows, in the board's panel order; the compiler
// requires an entry for every panel the board has.
const names = {
  actors: 'studyPoeaa.remote-facade.model.names.actors',
  builds: 'studyPoeaa.remote-facade.model.names.builds',
  mechanisms: 'studyPoeaa.remote-facade.model.names.mechanisms',
  work: 'studyPoeaa.remote-facade.model.names.work',
  blueprint: 'studyPoeaa.remote-facade.model.names.blueprint',
} as const satisfies Record<PanelId, string>;
const tokens = {
  actors: '1',
  builds: '2',
  mechanisms: '3',
  work: '4',
  blueprint: '5',
} as const satisfies Record<PanelId, string>;

const nameOf = (t: StudyTranslate, id: PanelId): string => t(names[id]);

const shapeOf = (t: StudyTranslate): StatesShape => ({
  nodes: [
    { id: 'source', label: t('studyPoeaa.remote-facade.model.states.source') },
    {
      id: 'response',
      label: t('studyPoeaa.remote-facade.model.states.response'),
      tone: 'subject',
    },
    { id: 'page', label: t('studyPoeaa.remote-facade.model.states.page') },
  ],
  objects: boardPanels.map((id) => ({ id, label: nameOf(t, id), key: tokens[id] })),
  transitions: [
    {
      id: 'read',
      from: 'source',
      to: 'response',
      label: t('studyPoeaa.remote-facade.model.operations.readPanel'),
    },
    {
      id: 'reportUnavailable',
      from: 'source',
      to: 'response',
      label: t('studyPoeaa.remote-facade.model.operations.reportUnavailable'),
    },
    {
      id: 'reply',
      from: 'response',
      to: 'page',
      label: t('studyPoeaa.remote-facade.model.operations.reply'),
    },
    {
      id: 'discard',
      from: 'response',
      to: null,
      label: t('studyPoeaa.remote-facade.model.operations.fail'),
    },
  ],
});

/**
 * The transitions a step's moves cannot be told by their states alone: a panel reaches the response
 * either read or reported unavailable. Sending the reply and throwing the response away each join
 * their two states by a transition of their own.
 */
const tookAt = ({ operation }: RemoteFacadeStep): Readonly<Record<string, string>> =>
  operation.kind === 'read' || operation.kind === 'reportUnavailable'
    ? { [operation.id]: operation.kind }
    : {};

const snapshotOf = (step: RemoteFacadeStep): StatesSnapshot => ({
  at: Object.fromEntries(boardPanels.map((id) => [id, panelState(step, id)])),
  took: tookAt(step),
});

/** The panel whose source failed at this step, when the failure ended the call. */
const failedAt = ({ operation }: RemoteFacadeStep): PanelId | null =>
  operation.kind === 'readFailed' || operation.kind === 'fail' ? operation.id : null;

/** The few words beside a panel's name: its rows, and what has happened to it. */
function panelNote(t: StudyTranslate, moment: RemoteFacadeMoment, id: PanelId): string | null {
  const step = stepAt(moment);
  const state = panelState(step, id);
  if (state === null) return null;
  const { rows } = moment.run.sources[id];
  const copy = [...step.response, ...step.page].find((panel) => panel.id === id);
  if (copy?.status === 'unavailable')
    return state === 'page'
      ? t('studyPoeaa.remote-facade.model.notes.shownUnavailable')
      : t('studyPoeaa.remote-facade.model.notes.reported');
  if (state === 'page') return t('studyPoeaa.remote-facade.model.notes.onPage', { rows });
  if (state === 'response')
    return t('studyPoeaa.remote-facade.model.notes.copied', {
      rows,
      calls: readPanel(moment.run.sources, id).calls,
    });
  if (failedAt(step) === id) return t('studyPoeaa.remote-facade.model.notes.down');
  return step.operation.kind === 'fail'
    ? t('studyPoeaa.remote-facade.model.notes.neverRead')
    : t('studyPoeaa.remote-facade.model.notes.waiting', { rows });
}

/** The sentence under the drawing: what the facade did at this step. */
function stepNote(t: StudyTranslate, moment: RemoteFacadeMoment): string {
  const { operation, page, calls } = stepAt(moment);
  return matchKind(operation, {
    call: () => t('studyPoeaa.remote-facade.model.steps.call'),
    read: ({ id }) =>
      t('studyPoeaa.remote-facade.model.steps.read', {
        panel: nameOf(t, id),
        rows: moment.run.sources[id].rows,
      }),
    reportUnavailable: ({ id }) =>
      t('studyPoeaa.remote-facade.model.steps.reportUnavailable', { panel: nameOf(t, id) }),
    readFailed: ({ id }) =>
      t('studyPoeaa.remote-facade.model.steps.readFailed', { panel: nameOf(t, id) }),
    fail: () => t('studyPoeaa.remote-facade.model.steps.fail', { local: calls.local }),
    reply: () => t('studyPoeaa.remote-facade.model.steps.reply', { panels: page.length }),
  });
}

/** The line the worked step adds for what the facade did, or null for a step with nothing to add. */
function operationLine(t: StudyTranslate, moment: RemoteFacadeMoment): string | null {
  const { operation, page, calls } = stepAt(moment);
  return matchKind<FacadeOperation, string | null>(operation, {
    call: () => null,
    read: ({ id }) =>
      t('studyPoeaa.remote-facade.model.worked.read', {
        panel: nameOf(t, id),
        rows: moment.run.sources[id].rows,
        calls: readPanel(moment.run.sources, id).calls,
      }),
    reportUnavailable: ({ id }) =>
      t('studyPoeaa.remote-facade.model.worked.reported', { panel: nameOf(t, id) }),
    readFailed: ({ id }) =>
      t('studyPoeaa.remote-facade.model.worked.readFailed', { panel: nameOf(t, id) }),
    fail: () => t('studyPoeaa.remote-facade.model.worked.fail', { local: calls.local }),
    reply: () =>
      t('studyPoeaa.remote-facade.model.worked.reply', {
        panels: page.length,
        rows: page.reduce((sum, panel) => sum + panel.rows, 0),
        local: calls.local,
      }),
  });
}

/** The note under the worked lines: after the reply, after the failure, or before either. */
function workedNote(t: StudyTranslate, { operation }: RemoteFacadeStep): string {
  if (operation.kind === 'reply') return t('studyPoeaa.remote-facade.model.worked.afterReply');
  return operation.kind === 'fail'
    ? t('studyPoeaa.remote-facade.model.worked.afterFailure')
    : t('studyPoeaa.remote-facade.model.worked.beforeReply');
}

/** The calls at this moment, counted three ways, and the caller checks, as the worked lines. */
function workedOf(t: StudyTranslate, moment: RemoteFacadeMoment): StudyWorkedStep {
  const step = stepAt(moment);
  const { calls } = step;
  const line = operationLine(t, moment);
  return {
    title: t('studyPoeaa.remote-facade.model.worked.title', { step: moment.index }),
    lines: [
      t('studyPoeaa.remote-facade.model.worked.remote', { remote: calls.remote }),
      t('studyPoeaa.remote-facade.model.worked.local', { local: calls.local }),
      t('studyPoeaa.remote-facade.model.worked.oneByOne', { oneByOne: calls.oneByOne }),
      t('studyPoeaa.remote-facade.model.worked.checks', { checks: calls.checks }),
      ...(line === null ? [] : [line]),
    ],
    note: workedNote(t, step),
  };
}

/** How the example's Builds source behaves, in the words the example's description reads. */
function buildsSourceOf(t: StudyTranslate, example: RemoteFacadeParameters): string {
  if (!example.buildsDown) return t('studyPoeaa.remote-facade.model.values.allAnswer');
  return example.reportsFailures
    ? t('studyPoeaa.remote-facade.model.values.reported')
    : t('studyPoeaa.remote-facade.model.values.escapes');
}

/** The values the record's prose reads at a moment, with the example's own inputs among them. */
function textOf(t: StudyTranslate, moment: RemoteFacadeMoment): StatesMomentText {
  const { run } = moment;
  const { calls } = stepAt(moment);
  const notes = Object.fromEntries(boardPanels.map((id) => [id, panelNote(t, moment, id)]));
  return {
    values: {
      ...studyParameterValues(run.parameters, t),
      remoteCalls: String(calls.remote),
      localCalls: String(calls.local),
      oneByOneCalls: String(calls.oneByOne),
      boardCalls: String(oneByOneCalls(run.sources)),
      rounds: String(walkRounds(run.sources)),
      totalRows: String(boardPanels.reduce((sum, id) => sum + run.sources[id].rows, 0)),
      buildsSource: buildsSourceOf(t, run.example),
    },
    note: stepNote(t, moment),
    worked: workedOf(t, moment),
    notes,
  };
}

/** The same board read two ways: one call to the facade, or a call for every object it holds. */
function comparisonOf(t: StudyTranslate, run: RemoteFacadeRun): StudyComparison<'steps'> {
  const last = run.steps[run.steps.length - 1];
  const failed = last.operation.kind === 'fail' ? last.operation.id : null;
  return {
    title: t('studyPoeaa.remote-facade.model.comparison.title'),
    intro: t('studyPoeaa.remote-facade.model.comparison.intro'),
    timeline: {
      title: t('studyPoeaa.remote-facade.model.comparison.chart'),
      xLabel: t('studyPoeaa.remote-facade.model.comparison.xLabel'),
      yLabel: t('studyPoeaa.remote-facade.model.comparison.yLabel'),
      steps: run.steps.map((_, index) => index),
      series: [
        {
          id: 'facade',
          label: t('studyPoeaa.remote-facade.model.comparison.facade'),
          tone: 'actual',
          values: run.steps.map(({ calls }) => calls.remote),
        },
        {
          id: 'oneByOne',
          label: t('studyPoeaa.remote-facade.model.comparison.oneByOne'),
          tone: 'desired',
          values: run.steps.map(({ calls }) => calls.oneByOne),
        },
      ],
      xTicks: run.steps.map((_, index) => index),
      yTicks: countTicks([
        ...run.steps.map(({ calls }) => calls.remote),
        ...run.steps.map(({ calls }) => calls.oneByOne),
      ]),
    },
    findings: [
      failed === null
        ? t('studyPoeaa.remote-facade.model.comparison.calls', {
            remote: last.calls.remote,
            oneByOne: last.calls.oneByOne,
          })
        : t('studyPoeaa.remote-facade.model.comparison.failed', { panel: nameOf(t, failed) }),
      t('studyPoeaa.remote-facade.model.comparison.local', { local: last.calls.local }),
    ],
  };
}

const inputsOf = (t: StudyTranslate): readonly StudyInput[] => [
  {
    name: 'buildsDown',
    label: t('studyPoeaa.remote-facade.model.inputs.buildsDown'),
    unit: t('studyPoeaa.remote-facade.model.inputs.yesNo'),
    min: 0,
    max: 1,
    step: 1,
  },
  {
    name: 'reportsFailures',
    label: t('studyPoeaa.remote-facade.model.inputs.reportsFailures'),
    unit: t('studyPoeaa.remote-facade.model.inputs.yesNo'),
    min: 0,
    max: 1,
    step: 1,
  },
];

/** The named moments: the call, the first read, the Builds read, then the failure or the reply. */
function momentsOf(t: StudyTranslate, run: RemoteFacadeRun): readonly StudyMoment[] {
  const builds = run.steps.findIndex(
    ({ operation }) => 'id' in operation && operation.id === 'builds',
  );
  const last = run.steps.length - 1;
  return [
    { label: t('studyPoeaa.remote-facade.model.moments.call'), step: 0 },
    { label: t('studyPoeaa.remote-facade.model.moments.firstRead'), step: 1 },
    { label: t('studyPoeaa.remote-facade.model.moments.builds'), step: builds },
    run.steps[last].operation.kind === 'fail'
      ? { label: t('studyPoeaa.remote-facade.model.moments.failure'), step: last }
      : { label: t('studyPoeaa.remote-facade.model.moments.reply'), step: last },
  ];
}

/** The run drawn as a register: each panel's row, the column of where it stands, at every step. */
export function present(run: RemoteFacadeRun, t: StudyTranslate): StatesStudyModel {
  return statesModel(
    {
      shape: shapeOf(t),
      snapshots: run.steps.map(snapshotOf),
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

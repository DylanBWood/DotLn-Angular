import type { StudyParameters } from '@dotln-angular/models';

import {
  statesModel,
  type StatesMomentText,
  type StatesShape,
  type StatesSnapshot,
} from '../states';
import { studyParameterValues } from '../study-message';
import type { StatesStudyModel, StudyInput, StudyMoment, StudyWorkedStep } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import {
  type OptimisticLockParameters,
  type OptimisticStep,
  type TabId,
  tabs,
} from './optimistic-offline-lock.simulation';

/** The whole run as the presentation reads it: the example, its steps and the record's inputs. */
export interface OptimisticLockRun {
  readonly example: OptimisticLockParameters;
  readonly steps: readonly OptimisticStep[];
  readonly parameters: StudyParameters;
}

/** One moment of the run: the run, and the index of the step the moment shows. */
interface OptimisticLockMoment {
  readonly run: OptimisticLockRun;
  readonly index: number;
}

const stepAt = ({ run, index }: OptimisticLockMoment) => run.steps[index];

const nameOf = (t: StudyTranslate, tab: TabId) =>
  tab === 'tabA'
    ? t('studyPoeaa.optimistic-offline-lock.model.names.tabA')
    : t('studyPoeaa.optimistic-offline-lock.model.names.tabB');

const shapeOf = (t: StudyTranslate): StatesShape => ({
  nodes: [
    { id: 'editing', label: t('studyPoeaa.optimistic-offline-lock.model.states.editing') },
    { id: 'saved', label: t('studyPoeaa.optimistic-offline-lock.model.states.saved') },
    {
      id: 'refused',
      label: t('studyPoeaa.optimistic-offline-lock.model.states.refused'),
      tone: 'subject',
    },
  ],
  objects: tabs.map((tab) => ({ id: tab, label: nameOf(t, tab), key: tab === 'tabA' ? 'A' : 'B' })),
  transitions: [
    {
      id: 'read',
      from: null,
      to: 'editing',
      label: t('studyPoeaa.optimistic-offline-lock.model.operations.read'),
    },
    {
      id: 'save',
      from: 'editing',
      to: 'saved',
      label: t('studyPoeaa.optimistic-offline-lock.model.operations.save'),
    },
    {
      id: 'saveRefused',
      from: 'editing',
      to: 'refused',
      label: t('studyPoeaa.optimistic-offline-lock.model.operations.saveRefused'),
    },
    {
      id: 'reload',
      from: 'refused',
      to: 'editing',
      label: t('studyPoeaa.optimistic-offline-lock.model.operations.reload'),
    },
    {
      id: 'close',
      from: 'editing',
      to: null,
      label: t('studyPoeaa.optimistic-offline-lock.model.operations.close'),
    },
  ],
});

/** The transition the acting tab took, named by the operation it performed. */
function tookAt({ operation }: OptimisticStep): Readonly<Record<string, string>> {
  if (operation.kind !== 'save') return { [operation.tab]: operation.kind };
  return { [operation.tab]: operation.accepted ? 'save' : 'saveRefused' };
}

const snapshotOf = (step: OptimisticStep): StatesSnapshot => ({
  at: Object.fromEntries(
    tabs.flatMap((tab) => {
      const session = step.sessions[tab];
      return session ? [[tab, session.state]] : [];
    }),
  ),
  took: tookAt(step),
});

/** The few words beside a tab's name: the version it holds, and what storage holds if newer. */
function tabNote(t: StudyTranslate, step: OptimisticStep, tab: TabId): string | null {
  const session = step.sessions[tab];
  if (!session) return null;
  const { version } = session;
  switch (session.state) {
    case 'saved':
      return t('studyPoeaa.optimistic-offline-lock.model.notes.wrote', { version });
    case 'refused':
      return t('studyPoeaa.optimistic-offline-lock.model.notes.refused', {
        minutes: session.lost,
      });
    default:
      if (session.lost > 0)
        return t('studyPoeaa.optimistic-offline-lock.model.notes.redo', {
          version,
          minutes: session.lost,
        });
      return step.stored.version === version
        ? t('studyPoeaa.optimistic-offline-lock.model.notes.read', { version })
        : t('studyPoeaa.optimistic-offline-lock.model.notes.stale', {
            version,
            stored: step.stored.version,
          });
  }
}

/** The sentence under the drawing: what the acting tab did, and what the lock made of it. */
function stepNote(t: StudyTranslate, step: OptimisticStep): string {
  const { operation } = step;
  const tab = nameOf(t, operation.tab);
  const version = step.sessions[operation.tab]?.version ?? 0;
  switch (operation.kind) {
    case 'read':
      return t('studyPoeaa.optimistic-offline-lock.model.steps.read', { tab, version });
    case 'reload':
      return t('studyPoeaa.optimistic-offline-lock.model.steps.reload', {
        tab,
        version,
        minutes: step.sessions[operation.tab]?.lost ?? 0,
      });
    case 'close':
      return t('studyPoeaa.optimistic-offline-lock.model.steps.close', { tab });
    default:
      return operation.accepted
        ? t('studyPoeaa.optimistic-offline-lock.model.steps.saved', {
            tab,
            held: operation.held,
            version,
          })
        : t('studyPoeaa.optimistic-offline-lock.model.steps.refused', {
            tab,
            held: operation.held,
            found: operation.found,
            minutes: operation.refusedMinutes,
          });
  }
}

/** The check a save makes, or what the tab remembers when it reads, as the mechanism's lines. */
function workedOf(t: StudyTranslate, step: OptimisticStep): StudyWorkedStep {
  const { operation } = step;
  const tab = nameOf(t, operation.tab);
  const version = step.sessions[operation.tab]?.version ?? 0;
  const lines =
    operation.kind === 'save'
      ? [
          t('studyPoeaa.optimistic-offline-lock.model.worked.condition', {
            tab,
            held: operation.held,
          }),
          t('studyPoeaa.optimistic-offline-lock.model.worked.found', { found: operation.found }),
          operation.accepted
            ? t('studyPoeaa.optimistic-offline-lock.model.worked.match', { version })
            : t('studyPoeaa.optimistic-offline-lock.model.worked.differ', {
                minutes: operation.refusedMinutes,
              }),
        ]
      : operation.kind === 'close'
        ? [t('studyPoeaa.optimistic-offline-lock.model.worked.close', { tab })]
        : [t('studyPoeaa.optimistic-offline-lock.model.worked.read', { tab, version })];
  return {
    title: t('studyPoeaa.optimistic-offline-lock.model.worked.title', { minute: step.minute }),
    lines: [
      ...lines,
      t('studyPoeaa.optimistic-offline-lock.model.worked.totals', {
        refusals: step.refusals,
        lost: step.lost,
      }),
    ],
  };
}

/** The values the record's prose reads at a moment, with the example's own inputs among them. */
function textOf(t: StudyTranslate, moment: OptimisticLockMoment): StatesMomentText {
  const step = stepAt(moment);
  const notes = Object.fromEntries(
    tabs.flatMap((tab) => {
      const note = tabNote(t, step, tab);
      return note === null ? [] : [[tab, note]];
    }),
  );
  return {
    values: {
      ...studyParameterValues(moment.run.parameters, t),
      minute: String(step.minute),
      stored: String(step.stored.version),
      refusals: String(step.refusals),
      lost: String(step.lost),
      ending:
        moment.run.example.tabASaves > 0
          ? t('studyPoeaa.optimistic-offline-lock.model.values.saves')
          : t('studyPoeaa.optimistic-offline-lock.model.values.closes'),
    },
    note: stepNote(t, step),
    worked: workedOf(t, step),
    notes,
  };
}

/** The moment label for a step worth jumping to, or null for one that is not. */
function momentLabel(t: StudyTranslate, step: OptimisticStep): string | null {
  const { operation } = step;
  const tab = nameOf(t, operation.tab);
  switch (operation.kind) {
    case 'read':
      return operation.tab === 'tabB'
        ? t('studyPoeaa.optimistic-offline-lock.model.moments.bothOpen')
        : null;
    case 'close':
      return t('studyPoeaa.optimistic-offline-lock.model.moments.closed', { tab });
    case 'reload':
      return null;
    default:
      if (!operation.accepted)
        return t('studyPoeaa.optimistic-offline-lock.model.moments.refused', { tab });
      return (step.sessions[operation.tab]?.lost ?? 0) > 0
        ? t('studyPoeaa.optimistic-offline-lock.model.moments.savedAgain', { tab })
        : t('studyPoeaa.optimistic-offline-lock.model.moments.saved', { tab });
  }
}

/** The named moments: both tabs open, then every save, refusal and close, in order. */
const momentsOf = (t: StudyTranslate, run: OptimisticLockRun): readonly StudyMoment[] =>
  run.steps.flatMap((step, index) => {
    const label = momentLabel(t, step);
    return label === null ? [] : [{ label, step: index }];
  });

const inputsOf = (t: StudyTranslate): readonly StudyInput[] => [
  {
    name: 'minutesB',
    label: t('studyPoeaa.optimistic-offline-lock.model.inputs.minutesB'),
    unit: t('studyPoeaa.optimistic-offline-lock.model.inputs.minutes'),
    min: 5,
    max: 30,
    step: 5,
  },
  {
    name: 'tabASaves',
    label: t('studyPoeaa.optimistic-offline-lock.model.inputs.tabASaves'),
    unit: t('studyPoeaa.optimistic-offline-lock.model.inputs.inAll'),
    min: 0,
    max: 1,
    step: 1,
  },
];

/** The run drawn as a register: each tab's row, the column of its state, at every step. */
export function present(run: OptimisticLockRun, t: StudyTranslate): StatesStudyModel {
  return statesModel(
    {
      shape: shapeOf(t),
      snapshots: run.steps.map(snapshotOf),
      text: run.steps.map((_, index) => textOf(t, { run, index })),
    },
    {
      moments: momentsOf(t, run),
      inputs: inputsOf(t),
    },
    t,
  );
}

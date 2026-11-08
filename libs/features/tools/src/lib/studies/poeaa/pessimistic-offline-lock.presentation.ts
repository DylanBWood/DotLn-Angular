import type { StudyParameters } from '@dotln-angular/models';

import { matchKind } from '../match-kind';
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
  lostBy,
  type PessimisticLockParameters,
  type PessimisticOperation,
  type PessimisticStep,
  type TabId,
  tabs,
  type TabState,
  waitedBy,
} from './pessimistic-offline-lock.simulation';

/** The whole run as the presentation reads it: the example, its steps and the record's inputs. */
export interface PessimisticLockRun {
  readonly example: PessimisticLockParameters;
  readonly steps: readonly PessimisticStep[];
  readonly parameters: StudyParameters;
}

/** One moment of the run: the run, and the index of the step the moment shows. */
interface PessimisticLockMoment {
  readonly run: PessimisticLockRun;
  readonly index: number;
}

const stepAt = ({ run, index }: PessimisticLockMoment) => run.steps[index];

// Each tab's name and the letter its token shows; the compiler requires an entry for every tab.
const names = {
  tabA: 'studyPoeaa.pessimistic-offline-lock.model.names.tabA',
  tabB: 'studyPoeaa.pessimistic-offline-lock.model.names.tabB',
} as const satisfies Record<TabId, string>;
const tokens = { tabA: 'A', tabB: 'B' } as const satisfies Record<TabId, string>;

const nameOf = (t: StudyTranslate, tab: TabId) => t(names[tab]);

/** The tab that owns the lock at a step, by name, or the word for nobody. */
const ownerOf = (t: StudyTranslate, step: PessimisticStep) =>
  step.lock
    ? nameOf(t, step.lock.owner)
    : t('studyPoeaa.pessimistic-offline-lock.model.values.nobody');

const shapeOf = (t: StudyTranslate): StatesShape => ({
  nodes: [
    {
      id: 'waiting',
      label: t('studyPoeaa.pessimistic-offline-lock.model.states.waiting'),
      tone: 'subject',
    },
    {
      id: 'holding',
      label: t('studyPoeaa.pessimistic-offline-lock.model.states.holding'),
      tone: 'subject',
    },
    { id: 'saved', label: t('studyPoeaa.pessimistic-offline-lock.model.states.saved') },
    {
      id: 'expired',
      label: t('studyPoeaa.pessimistic-offline-lock.model.states.expired'),
      tone: 'subject',
    },
  ],
  objects: tabs.map((tab) => ({ id: tab, label: nameOf(t, tab), key: tokens[tab] })),
  transitions: [
    {
      id: 'lock',
      from: null,
      to: 'holding',
      label: t('studyPoeaa.pessimistic-offline-lock.model.operations.lock'),
    },
    {
      id: 'lockRefused',
      from: null,
      to: 'waiting',
      label: t('studyPoeaa.pessimistic-offline-lock.model.operations.lockRefused'),
    },
    {
      id: 'granted',
      from: 'waiting',
      to: 'holding',
      label: t('studyPoeaa.pessimistic-offline-lock.model.operations.lock'),
    },
    {
      id: 'release',
      from: 'holding',
      to: 'saved',
      label: t('studyPoeaa.pessimistic-offline-lock.model.operations.save'),
    },
    {
      id: 'close',
      from: 'holding',
      to: 'holding',
      label: t('studyPoeaa.pessimistic-offline-lock.model.operations.close'),
    },
    {
      id: 'timeOut',
      from: 'holding',
      to: 'expired',
      label: t('studyPoeaa.pessimistic-offline-lock.model.operations.timeOut'),
    },
    {
      id: 'saveRefused',
      from: 'expired',
      to: 'expired',
      label: t('studyPoeaa.pessimistic-offline-lock.model.operations.saveRefused'),
    },
    {
      id: 'closeExpired',
      from: 'expired',
      to: 'expired',
      label: t('studyPoeaa.pessimistic-offline-lock.model.operations.close'),
    },
  ],
});

/**
 * The transitions a step's moves cannot be told by their states alone: a refused save, and a close,
 * leave the tab where it stood, holding the lock or with its lock run out. Taking, waiting for,
 * receiving, releasing and losing the lock each join their two states by a transition of their own.
 */
function tookAt(step: PessimisticStep): Readonly<Record<string, string>> {
  const { operation } = step;
  if (operation.kind === 'save' && !operation.accepted) return { [operation.tab]: 'saveRefused' };
  if (operation.kind !== 'close') return {};
  const expired = step.sessions[operation.tab]?.state === 'expired';
  return { [operation.tab]: expired ? 'closeExpired' : 'close' };
}

const snapshotOf = (step: PessimisticStep): StatesSnapshot => ({
  at: Object.fromEntries(tabs.map((tab) => [tab, step.sessions[tab]?.state ?? null])),
  took: tookAt(step),
});

/** The few words beside a tab's name: what it read or wrote, and where it stands with the lock. */
function tabNote(t: StudyTranslate, step: PessimisticStep, tab: TabId): string | null {
  const session = step.sessions[tab];
  if (!session) return null;
  const version = session.version ?? 0;
  const notes: Record<TabState, () => string> = {
    waiting: () =>
      step.lock
        ? t('studyPoeaa.pessimistic-offline-lock.model.notes.waiting', {
            holder: nameOf(t, step.lock.owner),
          })
        : t('studyPoeaa.pessimistic-offline-lock.model.notes.waitingFree'),
    holding: () =>
      session.closed
        ? t('studyPoeaa.pessimistic-offline-lock.model.notes.closedHolding')
        : t('studyPoeaa.pessimistic-offline-lock.model.notes.holding', {
            version,
            expires: step.lock?.expires ?? 0,
          }),
    saved: () => t('studyPoeaa.pessimistic-offline-lock.model.notes.saved', { version }),
    expired: () => {
      if (session.lost > 0)
        return t('studyPoeaa.pessimistic-offline-lock.model.notes.refused', {
          minutes: session.lost,
        });
      return session.closed
        ? t('studyPoeaa.pessimistic-offline-lock.model.notes.expiredClosed')
        : t('studyPoeaa.pessimistic-offline-lock.model.notes.expiredOpen');
    },
  };
  return notes[session.state]();
}

/** The sentence under the drawing: what the acting tab did, and what the lock let it do. */
function stepNote(t: StudyTranslate, step: PessimisticStep): string {
  const { operation } = step;
  const tab = nameOf(t, operation.tab);
  const version = step.sessions[operation.tab]?.version ?? 0;
  const expires = step.lock?.expires ?? 0;
  return matchKind(operation, {
    open: ({ granted }) =>
      granted
        ? t('studyPoeaa.pessimistic-offline-lock.model.steps.locked', { tab, version, expires })
        : t('studyPoeaa.pessimistic-offline-lock.model.steps.turnedAway', {
            tab,
            holder: ownerOf(t, step),
          }),
    retry: ({ tookOver, waited }) =>
      tookOver
        ? t('studyPoeaa.pessimistic-offline-lock.model.steps.tookOver', {
            tab,
            holder: nameOf(t, tookOver.owner),
            expired: tookOver.expires,
            minutes: waited,
            version,
          })
        : t('studyPoeaa.pessimistic-offline-lock.model.steps.granted', {
            tab,
            minutes: waited,
            version,
          }),
    save: ({ accepted, refusedMinutes }) =>
      accepted
        ? t('studyPoeaa.pessimistic-offline-lock.model.steps.saved', { tab, version })
        : t('studyPoeaa.pessimistic-offline-lock.model.steps.refused', {
            tab,
            minutes: refusedMinutes,
          }),
    close: () =>
      step.sessions[operation.tab]?.state === 'expired'
        ? t('studyPoeaa.pessimistic-offline-lock.model.steps.closedExpired', { tab })
        : t('studyPoeaa.pessimistic-offline-lock.model.steps.closedHolding', { tab, expires }),
  });
}

/** The lock manager's answer, or the owner check a save makes, as the mechanism's lines. */
function answerLines(t: StudyTranslate, step: PessimisticStep): readonly string[] {
  const { operation } = step;
  const tab = nameOf(t, operation.tab);
  const expires = step.lock?.expires ?? 0;
  const answered = (answer: string) => [
    t('studyPoeaa.pessimistic-offline-lock.model.worked.ask', { tab }),
    answer,
  ];
  const free = () => t('studyPoeaa.pessimistic-offline-lock.model.worked.free', { tab, expires });
  return matchKind<PessimisticOperation, readonly string[]>(operation, {
    open: ({ granted }) =>
      answered(
        granted
          ? free()
          : t('studyPoeaa.pessimistic-offline-lock.model.worked.held', {
              holder: ownerOf(t, step),
              expires,
            }),
      ),
    retry: ({ tookOver }) =>
      answered(
        tookOver
          ? t('studyPoeaa.pessimistic-offline-lock.model.worked.tookOver', {
              holder: nameOf(t, tookOver.owner),
              expired: tookOver.expires,
              tab,
              expires,
            })
          : free(),
      ),
    save: ({ accepted, refusedMinutes }) => [
      t('studyPoeaa.pessimistic-offline-lock.model.worked.save', {
        tab,
        owner: accepted ? tab : ownerOf(t, step),
      }),
      accepted
        ? t('studyPoeaa.pessimistic-offline-lock.model.worked.written', { version: step.stored })
        : t('studyPoeaa.pessimistic-offline-lock.model.worked.notWritten', {
            minutes: refusedMinutes,
          }),
    ],
    close: () => [
      t('studyPoeaa.pessimistic-offline-lock.model.worked.close', { tab, owner: ownerOf(t, step) }),
    ],
  });
}

const workedOf = (t: StudyTranslate, step: PessimisticStep): StudyWorkedStep => ({
  title: t('studyPoeaa.pessimistic-offline-lock.model.worked.title', { minute: step.minute }),
  lines: [
    ...answerLines(t, step),
    t('studyPoeaa.pessimistic-offline-lock.model.worked.totals', {
      waited: waitedBy(step),
      lost: lostBy(step),
    }),
  ],
});

/** The lock as the prose names it: free, held until it runs out, or run out but not yet taken. */
function lockText(t: StudyTranslate, step: PessimisticStep): string {
  if (!step.lock) return t('studyPoeaa.pessimistic-offline-lock.model.values.lockFree');
  const words = { holder: nameOf(t, step.lock.owner), expires: step.lock.expires };
  return step.minute < step.lock.expires
    ? t('studyPoeaa.pessimistic-offline-lock.model.values.lockHeld', words)
    : t('studyPoeaa.pessimistic-offline-lock.model.values.lockLapsed', words);
}

/** The values the record's prose reads at a moment, with the example's own inputs among them. */
function textOf(t: StudyTranslate, moment: PessimisticLockMoment): StatesMomentText {
  const step = stepAt(moment);
  return {
    values: {
      ...studyParameterValues(moment.run.parameters, t),
      minute: String(step.minute),
      stored: String(step.stored),
      lock: lockText(t, step),
      waited: String(waitedBy(step)),
      lost: String(lostBy(step)),
      ending: moment.run.example.tabASaves
        ? t('studyPoeaa.pessimistic-offline-lock.model.values.saves')
        : t('studyPoeaa.pessimistic-offline-lock.model.values.closes'),
    },
    note: stepNote(t, step),
    worked: workedOf(t, step),
    notes: Object.fromEntries(tabs.map((tab) => [tab, tabNote(t, step, tab)])),
  };
}

/** The moment label for a step worth jumping to, or null for Tab A's first lock. */
function momentLabel(t: StudyTranslate, step: PessimisticStep, index: number): string | null {
  const tab = nameOf(t, step.operation.tab);
  return matchKind<PessimisticOperation, string | null>(step.operation, {
    open: ({ granted }) => {
      if (!granted)
        return t('studyPoeaa.pessimistic-offline-lock.model.moments.turnedAway', { tab });
      return index === 0
        ? null
        : t('studyPoeaa.pessimistic-offline-lock.model.moments.granted', { tab });
    },
    retry: ({ tookOver }) =>
      tookOver
        ? t('studyPoeaa.pessimistic-offline-lock.model.moments.tookOver', { tab })
        : t('studyPoeaa.pessimistic-offline-lock.model.moments.granted', { tab }),
    save: ({ accepted }) =>
      accepted
        ? t('studyPoeaa.pessimistic-offline-lock.model.moments.saved', { tab })
        : t('studyPoeaa.pessimistic-offline-lock.model.moments.refused', { tab }),
    close: () => t('studyPoeaa.pessimistic-offline-lock.model.moments.closed', { tab }),
  });
}

/** The named moments: a tab turned away, every save, close and hand-over of the lock, in order. */
const momentsOf = (t: StudyTranslate, run: PessimisticLockRun): readonly StudyMoment[] =>
  run.steps.flatMap((step, index) => {
    const label = momentLabel(t, step, index);
    return label === null ? [] : [{ label, step: index }];
  });

const inputsOf = (t: StudyTranslate): readonly StudyInput[] => [
  {
    name: 'tabASaves',
    label: t('studyPoeaa.pessimistic-offline-lock.model.inputs.tabASaves'),
    unit: t('studyPoeaa.pessimistic-offline-lock.model.inputs.inAll'),
    min: 0,
    max: 1,
    step: 1,
  },
  {
    name: 'timeout',
    label: t('studyPoeaa.pessimistic-offline-lock.model.inputs.timeout'),
    unit: t('studyPoeaa.pessimistic-offline-lock.model.inputs.minutes'),
    min: 5,
    max: 30,
    step: 5,
  },
];

/** The run drawn as a register: each tab's row, the column of its state, at every step. */
export function present(run: PessimisticLockRun, t: StudyTranslate): StatesStudyModel {
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

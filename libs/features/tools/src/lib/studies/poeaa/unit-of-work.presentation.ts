import type { StudyParameters } from '@dotln-angular/models';

import { countTicks } from '../drawing';
import { matchKind } from '../match-kind';
import {
  listOf,
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
  type CommitResult,
  type CompositionId,
  compositions,
  registerOf,
  type UnitOfWorkParameters,
  type UnitOfWorkStep,
} from './unit-of-work.simulation';

/** The whole run as the presentation reads it: the example, its steps and the record's inputs. */
export interface UnitOfWorkRun {
  readonly example: UnitOfWorkParameters;
  readonly steps: readonly UnitOfWorkStep[];
  readonly parameters: StudyParameters;
}

/** One moment of the run: the whole run and the index of the step it shows. */
interface UnitOfWorkMoment {
  readonly run: UnitOfWorkRun;
  readonly index: number;
}

const stepAt = ({ run, index }: UnitOfWorkMoment) => run.steps[index];

// Each composition's name and the letter its token shows; the compiler requires an entry for every
// composition the example has.
const names = {
  flank: 'studyPoeaa.unit-of-work.model.names.flank',
  ridge: 'studyPoeaa.unit-of-work.model.names.ridge',
  night: 'studyPoeaa.unit-of-work.model.names.night',
} as const satisfies Record<CompositionId, string>;
const tokens = { flank: 'F', ridge: 'R', night: 'N' } as const satisfies Record<
  CompositionId,
  string
>;

const nameOf = (t: StudyTranslate, id: CompositionId): string => t(names[id]);

const namesOf = (t: StudyTranslate, ids: readonly CompositionId[]) =>
  listOf(
    t,
    ids.map((id) => nameOf(t, id)),
  );

const shapeOf = (t: StudyTranslate): StatesShape => ({
  nodes: [
    { id: 'clean', label: t('studyPoeaa.unit-of-work.model.registers.clean') },
    { id: 'new', label: t('studyPoeaa.unit-of-work.model.registers.new'), tone: 'subject' },
    { id: 'dirty', label: t('studyPoeaa.unit-of-work.model.registers.dirty'), tone: 'subject' },
    { id: 'removed', label: t('studyPoeaa.unit-of-work.model.registers.removed'), tone: 'subject' },
  ],
  objects: compositions.map((id) => ({
    id,
    label: nameOf(t, id),
    key: tokens[id],
  })),
  transitions: [
    {
      id: 'registerNew',
      from: null,
      to: 'new',
      label: t('studyPoeaa.unit-of-work.model.operations.registerNew'),
    },
    {
      id: 'registerDirty',
      from: 'clean',
      to: 'dirty',
      label: t('studyPoeaa.unit-of-work.model.operations.registerDirty'),
    },
    {
      id: 'registerDirtyAgain',
      from: 'dirty',
      to: 'dirty',
      label: t('studyPoeaa.unit-of-work.model.operations.registerDirty'),
    },
    {
      id: 'registerRemoved',
      from: 'clean',
      to: 'removed',
      label: t('studyPoeaa.unit-of-work.model.operations.registerRemoved'),
    },
    {
      id: 'commitInsert',
      from: 'new',
      to: 'clean',
      label: t('studyPoeaa.unit-of-work.model.operations.commit'),
    },
    {
      id: 'commitUpdate',
      from: 'dirty',
      to: 'clean',
      label: t('studyPoeaa.unit-of-work.model.operations.commit'),
    },
    {
      id: 'commitDelete',
      from: 'removed',
      to: null,
      label: t('studyPoeaa.unit-of-work.model.operations.commit'),
    },
  ],
});

/**
 * The transition a step's moves cannot be told by their registers alone: renaming an object that is
 * already dirty leaves it in the dirty register. Registering and committing each join their two
 * registers by a transition of their own.
 */
const tookAt = ({ operation }: UnitOfWorkStep): Readonly<Record<string, string>> =>
  operation.kind === 'registerDirty' && operation.already
    ? { [operation.id]: 'registerDirtyAgain' }
    : {};

const snapshotOf = (step: UnitOfWorkStep): StatesSnapshot => ({
  at: Object.fromEntries(compositions.map((id) => [id, registerOf(step.unit, id)])),
  took: tookAt(step),
});

/** The few words beside an object's name: the version it holds and what has happened to it. */
function objectNote(t: StudyTranslate, moment: UnitOfWorkMoment, id: CompositionId): string | null {
  const { unit, store } = stepAt(moment);
  const held = unit.objects[id];
  if (!held) return null;
  const stored = store.rows[id];
  if (unit.newObjects.includes(id)) return t('studyPoeaa.unit-of-work.model.notes.unsaved');
  if (unit.removed.includes(id))
    return t('studyPoeaa.unit-of-work.model.notes.toDelete', { version: held.version });
  if (stored && stored.version !== held.version)
    return t('studyPoeaa.unit-of-work.model.notes.stale', {
      version: held.version,
      stored: stored.version,
    });
  if (held.edits === 0)
    return t('studyPoeaa.unit-of-work.model.notes.stored', { version: held.version });
  return held.edits === 1
    ? t('studyPoeaa.unit-of-work.model.notes.renamedOnce', { version: held.version })
    : t('studyPoeaa.unit-of-work.model.notes.renamed', {
        version: held.version,
        edits: held.edits,
      });
}

/** What a commit sends, one phrase per statement, in the order the unit writes them. */
function statementsOf(t: StudyTranslate, result: CommitResult): string {
  const phrases = [
    ...result.inserts.map((id) =>
      t('studyPoeaa.unit-of-work.model.statements.insert', { name: nameOf(t, id) }),
    ),
    ...result.updates.map((id) =>
      t('studyPoeaa.unit-of-work.model.statements.update', { name: nameOf(t, id) }),
    ),
    ...result.deletes.map((id) =>
      t('studyPoeaa.unit-of-work.model.statements.delete', { name: nameOf(t, id) }),
    ),
  ];
  // A commit that sends nothing says so in its own word, which is not the register's word for none.
  return phrases.length ? listOf(t, phrases) : t('studyPoeaa.unit-of-work.model.statements.none');
}

/** The sentence under the drawing: what the session did at this step, in the pattern's terms. */
function stepNote(t: StudyTranslate, moment: UnitOfWorkMoment): string {
  const { operation, unit, store } = stepAt(moment);
  return matchKind(operation, {
    start: () => t('studyPoeaa.unit-of-work.model.steps.start'),
    registerNew: () => t('studyPoeaa.unit-of-work.model.steps.registerNew'),
    registerDirty: ({ already }) =>
      already
        ? t('studyPoeaa.unit-of-work.model.steps.registerDirtyAgain')
        : t('studyPoeaa.unit-of-work.model.steps.registerDirty'),
    registerRemoved: () => t('studyPoeaa.unit-of-work.model.steps.registerRemoved'),
    otherSave: () =>
      t('studyPoeaa.unit-of-work.model.steps.otherSave', {
        stored: store.rows.ridge?.version ?? 0,
        held: unit.objects.ridge?.version ?? 0,
      }),
    commit: ({ result }) =>
      result.conflict === null
        ? t('studyPoeaa.unit-of-work.model.steps.committed', {
            statements: statementsOf(t, result),
          })
        : t('studyPoeaa.unit-of-work.model.steps.refused', {
            name: nameOf(t, result.conflict),
            stored: store.rows[result.conflict]?.version ?? 0,
            held: unit.objects[result.conflict]?.version ?? 0,
          }),
  });
}

/** The registers and the store's calls at this moment, as the mechanism's worked lines. */
function workedOf(t: StudyTranslate, moment: UnitOfWorkMoment): StudyWorkedStep {
  const { operation, unit, store, immediateCalls } = stepAt(moment);
  const lines = [
    t('studyPoeaa.unit-of-work.model.worked.new', { names: namesOf(t, unit.newObjects) }),
    t('studyPoeaa.unit-of-work.model.worked.dirty', { names: namesOf(t, unit.dirty) }),
    t('studyPoeaa.unit-of-work.model.worked.removed', { names: namesOf(t, unit.removed) }),
    t('studyPoeaa.unit-of-work.model.worked.calls', {
      calls: store.calls,
      immediate: immediateCalls,
    }),
  ];
  if (operation.kind === 'commit') {
    const { conflict } = operation.result;
    lines.push(
      conflict === null
        ? t('studyPoeaa.unit-of-work.model.worked.sent', {
            statements: statementsOf(t, operation.result),
          })
        : t('studyPoeaa.unit-of-work.model.worked.check', {
            name: nameOf(t, conflict),
            stored: store.rows[conflict]?.version ?? 0,
            held: unit.objects[conflict]?.version ?? 0,
          }),
    );
  }
  return {
    title: t('studyPoeaa.unit-of-work.model.worked.title', { step: moment.index }),
    lines,
    note:
      operation.kind === 'commit'
        ? t('studyPoeaa.unit-of-work.model.worked.afterCommit')
        : t('studyPoeaa.unit-of-work.model.worked.beforeCommit'),
  };
}

/** The values the record's prose reads at a moment, with the example's own inputs among them. */
function textOf(t: StudyTranslate, moment: UnitOfWorkMoment): StatesMomentText {
  const { store, immediateCalls } = stepAt(moment);
  return {
    values: {
      ...studyParameterValues(moment.run.parameters, t),
      calls: String(store.calls),
      immediateCalls: String(immediateCalls),
      rival: moment.run.example.otherTabSaves
        ? t('studyPoeaa.unit-of-work.model.values.rival')
        : t('studyPoeaa.unit-of-work.model.values.noRival'),
    },
    note: stepNote(t, moment),
    worked: workedOf(t, moment),
    notes: Object.fromEntries(compositions.map((id) => [id, objectNote(t, moment, id)])),
  };
}

/** The same session written two ways: one commit, or a store call for every change as it happens. */
function comparisonOf(t: StudyTranslate, run: UnitOfWorkRun): StudyComparison<'steps'> {
  const last = run.steps[run.steps.length - 1];
  return {
    title: t('studyPoeaa.unit-of-work.model.comparison.title'),
    intro: t('studyPoeaa.unit-of-work.model.comparison.intro'),
    timeline: {
      title: t('studyPoeaa.unit-of-work.model.comparison.chart'),
      xLabel: t('studyPoeaa.unit-of-work.model.comparison.xLabel'),
      yLabel: t('studyPoeaa.unit-of-work.model.comparison.yLabel'),
      steps: run.steps.map((_, index) => index),
      series: [
        {
          id: 'unit',
          label: t('studyPoeaa.unit-of-work.model.comparison.unit'),
          tone: 'actual',
          values: run.steps.map(({ store }) => store.calls),
        },
        {
          id: 'immediate',
          label: t('studyPoeaa.unit-of-work.model.comparison.immediate'),
          tone: 'desired',
          values: run.steps.map(({ immediateCalls }) => immediateCalls),
        },
      ],
      xTicks: run.steps.map((_, index) => index),
      yTicks: countTicks([
        ...run.steps.map(({ store }) => store.calls),
        ...run.steps.map(({ immediateCalls }) => immediateCalls),
      ]),
    },
    findings: [
      t('studyPoeaa.unit-of-work.model.comparison.calls', {
        immediate: last.immediateCalls,
        calls: last.store.calls,
      }),
      t('studyPoeaa.unit-of-work.model.comparison.halfway'),
    ],
  };
}

const inputsOf = (t: StudyTranslate): readonly StudyInput[] => [
  {
    name: 'renames',
    label: t('studyPoeaa.unit-of-work.model.inputs.renames'),
    unit: t('studyPoeaa.unit-of-work.model.inputs.inAll'),
    min: 0,
    max: 3,
    step: 1,
  },
  {
    name: 'otherTabSaves',
    label: t('studyPoeaa.unit-of-work.model.inputs.otherTabSaves'),
    unit: t('studyPoeaa.unit-of-work.model.inputs.inAll'),
    min: 0,
    max: 1,
    step: 1,
  },
];

/** The named moments: each register's first use, the rival save when there is one, and the commit. */
function momentsOf(t: StudyTranslate, run: UnitOfWorkRun): readonly StudyMoment[] {
  const first = (kind: UnitOfWorkStep['operation']['kind']) =>
    run.steps.findIndex(({ operation }) => operation.kind === kind);
  const moments: StudyMoment[] = [
    { label: t('studyPoeaa.unit-of-work.model.moments.registered'), step: first('registerNew') },
  ];
  if (first('registerDirty') >= 0)
    moments.push({
      label: t('studyPoeaa.unit-of-work.model.moments.dirty'),
      step: first('registerDirty'),
    });
  moments.push({
    label: t('studyPoeaa.unit-of-work.model.moments.removed'),
    step: first('registerRemoved'),
  });
  if (first('otherSave') >= 0)
    moments.push({
      label: t('studyPoeaa.unit-of-work.model.moments.rival'),
      step: first('otherSave'),
    });
  moments.push({
    label: t('studyPoeaa.unit-of-work.model.moments.commit'),
    step: run.steps.length - 1,
  });
  return moments;
}

/** The run drawn as a register: each composition's row, its register's column, at every step. */
export function present(run: UnitOfWorkRun, t: StudyTranslate): StatesStudyModel {
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

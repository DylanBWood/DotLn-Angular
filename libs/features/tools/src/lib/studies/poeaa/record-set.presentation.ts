import type { StudyParameters } from '@dotln-angular/models';

import { matchKind } from '../match-kind';
import {
  listOf,
  statesModel,
  type StatesMomentText,
  type StatesShape,
  type StatesSnapshot,
} from '../states';
import { studyParameterValues } from '../study-message';
import type { StatesStudyModel, StudyInput, StudyMoment, StudyWorkedStep } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import {
  type ColumnName,
  columns,
  type CompositionId,
  compositions,
  type RecordRow,
  type RecordSetOperation,
  type RecordSetParameters,
  type RecordSetStep,
  rowOf,
  type RowState,
  staleColumn,
  type Statement,
  statementFor,
} from './record-set.simulation';

/** The whole run as the presentation reads it: the example, its steps and the record's inputs. */
export interface RecordSetRun {
  readonly example: RecordSetParameters;
  readonly steps: readonly RecordSetStep[];
  readonly parameters: StudyParameters;
}

/** One moment of the run, by its index among the steps. */
interface RecordSetMoment {
  readonly run: RecordSetRun;
  readonly index: number;
}

type WriteOperation = Extract<RecordSetOperation, { readonly kind: 'write' }>;

const stepAt = ({ run, index }: RecordSetMoment) => run.steps[index];

// Each composition's name and the letter its token shows, each column's name and each statement's;
// the compiler requires an entry for every composition, column and statement the example has.
const names = {
  wood: 'studyPoeaa.record-set.model.names.wood',
  bridge: 'studyPoeaa.record-set.model.names.bridge',
  ford: 'studyPoeaa.record-set.model.names.ford',
  raid: 'studyPoeaa.record-set.model.names.raid',
} as const satisfies Record<CompositionId, string>;
const tokens = { wood: 'W', bridge: 'B', ford: 'F', raid: 'D' } as const satisfies Record<
  CompositionId,
  string
>;
const columnNames = {
  title: 'studyPoeaa.record-set.model.columns.title',
  note: 'studyPoeaa.record-set.model.columns.note',
} as const satisfies Record<ColumnName, string>;
const statements = {
  insert: 'studyPoeaa.record-set.model.statements.insert',
  update: 'studyPoeaa.record-set.model.statements.update',
  delete: 'studyPoeaa.record-set.model.statements.delete',
} as const satisfies Record<Statement, string>;
// The sentence for each statement the store accepted.
const accepted = {
  insert: 'studyPoeaa.record-set.model.steps.inserted',
  update: 'studyPoeaa.record-set.model.steps.updated',
  delete: 'studyPoeaa.record-set.model.steps.deleted',
} as const satisfies Record<Statement, string>;

const nameOf = (t: StudyTranslate, id: CompositionId): string => t(names[id]);

const namesOf = (t: StudyTranslate, ids: readonly CompositionId[]) =>
  listOf(
    t,
    ids.map((id) => nameOf(t, id)),
  );

const columnOf = (t: StudyTranslate, column: ColumnName) => t(columnNames[column]);

const shapeOf = (t: StudyTranslate): StatesShape => ({
  nodes: [
    { id: 'unchanged', label: t('studyPoeaa.record-set.model.states.unchanged') },
    { id: 'modified', label: t('studyPoeaa.record-set.model.states.modified'), tone: 'subject' },
    { id: 'added', label: t('studyPoeaa.record-set.model.states.added'), tone: 'subject' },
    { id: 'deleted', label: t('studyPoeaa.record-set.model.states.deleted'), tone: 'subject' },
  ],
  objects: compositions.map((id) => ({ id, label: nameOf(t, id), key: tokens[id] })),
  transitions: [
    {
      id: 'fill',
      from: null,
      to: 'unchanged',
      label: t('studyPoeaa.record-set.model.operations.fill'),
    },
    {
      id: 'setValue',
      from: 'unchanged',
      to: 'modified',
      label: t('studyPoeaa.record-set.model.operations.set'),
    },
    {
      id: 'addRow',
      from: null,
      to: 'added',
      label: t('studyPoeaa.record-set.model.operations.add'),
    },
    {
      id: 'deleteRow',
      from: 'unchanged',
      to: 'deleted',
      label: t('studyPoeaa.record-set.model.operations.delete'),
    },
    {
      id: 'acceptUpdate',
      from: 'modified',
      to: 'unchanged',
      label: t('studyPoeaa.record-set.model.operations.writeBack'),
    },
    {
      id: 'acceptInsert',
      from: 'added',
      to: 'unchanged',
      label: t('studyPoeaa.record-set.model.operations.writeBack'),
    },
    {
      id: 'acceptDelete',
      from: 'deleted',
      to: null,
      label: t('studyPoeaa.record-set.model.operations.writeBack'),
    },
    {
      id: 'refuseUpdate',
      from: 'modified',
      to: 'modified',
      label: t('studyPoeaa.record-set.model.operations.refused'),
    },
  ],
});

/**
 * The transition a step's moves cannot be told by their states alone: a refused update leaves its
 * row modified where it stood. Every other change of a row joins its two states by a transition of
 * its own.
 */
const tookAt = ({ operation }: RecordSetStep): Readonly<Record<string, string>> =>
  operation.kind === 'write' && !operation.matched && operation.statement === 'update'
    ? { [operation.id]: 'refuseUpdate' }
    : {};

const snapshotOf = (step: RecordSetStep): StatesSnapshot => ({
  at: Object.fromEntries(step.set.rows.map(({ id, state }) => [id, state])),
  took: tookAt(step),
});

/** The columns whose current value differs from the row's original, by their translated names. */
const changedColumns = (t: StudyTranslate, row: RecordRow) =>
  listOf(
    t,
    columns
      .filter((column) => row.original !== null && row.current[column] !== row.original[column])
      .map((column) => columnOf(t, column)),
  );

/** The few words beside a row's name: what it holds against what was read and what is stored. */
function rowNote(t: StudyTranslate, moment: RecordSetMoment, row: RecordRow): string {
  const { table } = stepAt(moment);
  const stale = staleColumn(row, table);
  if (row.refused && stale !== null)
    return t('studyPoeaa.record-set.model.notes.refused', { column: columnOf(t, stale) });
  const notes: Record<RowState, () => string> = {
    added: () => t('studyPoeaa.record-set.model.notes.added'),
    deleted: () => t('studyPoeaa.record-set.model.notes.deleted'),
    modified: () =>
      stale === null
        ? t('studyPoeaa.record-set.model.notes.modified', { columns: changedColumns(t, row) })
        : t('studyPoeaa.record-set.model.notes.stale', {
            columns: changedColumns(t, row),
            column: columnOf(t, stale),
          }),
    unchanged: () =>
      columns.every((column) => row.current[column] === 0)
        ? t('studyPoeaa.record-set.model.notes.asRead')
        : t('studyPoeaa.record-set.model.notes.written'),
  };
  return notes[row.state]();
}

/** The rows after a refused one that still have a change the adapter never sent. */
function unsentAfter(moment: RecordSetMoment, id: CompositionId): readonly CompositionId[] {
  const { set } = stepAt(moment);
  const at = set.rows.findIndex((row) => row.id === id);
  return set.rows
    .slice(at + 1)
    .filter((row) => statementFor(row) !== null)
    .map((row) => row.id);
}

/** The sentence under the drawing for a step of the write-back. */
function writeNote(t: StudyTranslate, moment: RecordSetMoment, operation: WriteOperation): string {
  const { set, table, stopped } = stepAt(moment);
  const name = nameOf(t, operation.id);
  const sent = table.statements;
  if (operation.matched) return t(accepted[operation.statement], { sent, name });
  const row = rowOf(set, operation.id);
  const stale = row ? staleColumn(row, table) : null;
  const column = stale === null ? t('studyCommon.states.empty') : columnOf(t, stale);
  return stopped
    ? t('studyPoeaa.record-set.model.steps.refusedStop', {
        sent,
        name,
        column,
        unsent: namesOf(t, unsentAfter(moment, operation.id)),
      })
    : t('studyPoeaa.record-set.model.steps.refusedOn', { sent, name, column });
}

/** The sentence under the drawing: what the session, the other tab or the adapter did. */
function stepNote(t: StudyTranslate, moment: RecordSetMoment): string {
  return matchKind(stepAt(moment).operation, {
    fill: () => t('studyPoeaa.record-set.model.steps.fill'),
    set: ({ id, column }) =>
      t('studyPoeaa.record-set.model.steps.set', {
        name: nameOf(t, id),
        column: columnOf(t, column),
      }),
    delete: ({ id }) => t('studyPoeaa.record-set.model.steps.delete', { name: nameOf(t, id) }),
    add: ({ id }) => t('studyPoeaa.record-set.model.steps.add', { name: nameOf(t, id) }),
    rival: ({ id, column }) =>
      t('studyPoeaa.record-set.model.steps.rival', {
        name: nameOf(t, id),
        column: columnOf(t, column),
      }),
    write: (operation) => writeNote(t, moment, operation),
  });
}

/**
 * What a write found: an insert takes its free key or finds it taken; an update or a delete finds
 * the row's originals still stored, or finds them changed.
 */
function writeOutcome(operation: WriteOperation): string {
  if (operation.statement === 'insert')
    return operation.matched
      ? 'studyPoeaa.record-set.model.worked.inserted'
      : 'studyPoeaa.record-set.model.worked.taken';
  return operation.matched
    ? 'studyPoeaa.record-set.model.worked.matched'
    : 'studyPoeaa.record-set.model.worked.unmatched';
}

/** The statement a write sends with the guard it carries, and what that guard found. */
function writeLines(t: StudyTranslate, operation: WriteOperation, sent: number): readonly string[] {
  return [
    t('studyPoeaa.record-set.model.worked.statement', {
      sent,
      statement: t(statements[operation.statement]),
      name: nameOf(t, operation.id),
      guard:
        operation.statement === 'insert'
          ? t('studyPoeaa.record-set.model.worked.guardFree')
          : t('studyPoeaa.record-set.model.worked.guardOriginals'),
    }),
    t(writeOutcome(operation)),
  ];
}

/** The note under the worked lines: whether the adapter stopped, wrote, or has yet to write. */
function workedNote(t: StudyTranslate, step: RecordSetStep): string {
  if (step.stopped) return t('studyPoeaa.record-set.model.worked.stopped');
  return step.operation.kind === 'write'
    ? t('studyPoeaa.record-set.model.worked.ownWrite')
    : t('studyPoeaa.record-set.model.worked.beforeWrite');
}

/** The changed rows, the statements so far and, at a write, the statement and its guard. */
function workedOf(t: StudyTranslate, moment: RecordSetMoment): StudyWorkedStep {
  const step = stepAt(moment);
  const { operation, set, table } = step;
  const changed = set.rows.filter((row) => statementFor(row) !== null);
  return {
    title: t('studyPoeaa.record-set.model.worked.title', { step: moment.index }),
    lines: [
      t('studyPoeaa.record-set.model.worked.changed', {
        names: namesOf(
          t,
          changed.map(({ id }) => id),
        ),
      }),
      t('studyPoeaa.record-set.model.worked.sent', { sent: table.statements }),
      t('studyPoeaa.record-set.model.worked.refused', {
        names: namesOf(
          t,
          set.rows.filter(({ refused }) => refused).map(({ id }) => id),
        ),
      }),
      ...(operation.kind === 'write' ? writeLines(t, operation, table.statements) : []),
    ],
    note: workedNote(t, step),
  };
}

/** The values the record's prose reads at a moment, with the example's own inputs among them. */
function textOf(t: StudyTranslate, moment: RecordSetMoment): StatesMomentText {
  const { set, table } = stepAt(moment);
  const { example, parameters } = moment.run;
  return {
    values: {
      ...studyParameterValues(parameters, t),
      sent: String(table.statements),
      refused: String(set.rows.filter(({ refused }) => refused).length),
      rival:
        example.rivalSaves > 0
          ? t('studyPoeaa.record-set.model.values.rival')
          : t('studyPoeaa.record-set.model.values.noRival'),
      onError: example.continueOnError
        ? t('studyPoeaa.record-set.model.values.goOn')
        : t('studyPoeaa.record-set.model.values.stop'),
      refusal: example.continueOnError
        ? t('studyPoeaa.record-set.model.values.refusalGoesOn')
        : t('studyPoeaa.record-set.model.values.refusalStops'),
    },
    note: stepNote(t, moment),
    worked: workedOf(t, moment),
    notes: Object.fromEntries(set.rows.map((row) => [row.id, rowNote(t, moment, row)])),
  };
}

const inputsOf = (t: StudyTranslate): readonly StudyInput[] => [
  {
    name: 'rivalSaves',
    label: t('studyPoeaa.record-set.model.inputs.rivalSaves'),
    unit: t('studyPoeaa.record-set.model.inputs.inAll'),
    min: 0,
    max: 1,
    step: 1,
  },
  {
    name: 'continueOnError',
    label: t('studyPoeaa.record-set.model.inputs.continueOnError'),
    unit: t('studyPoeaa.record-set.model.inputs.yesOrNo'),
    min: 0,
    max: 1,
    step: 1,
  },
];

/** The named moments: the first change, the added row, a rival save, the first write and the end. */
function momentsOf(t: StudyTranslate, run: RecordSetRun): readonly StudyMoment[] {
  const first = (found: (step: RecordSetStep) => boolean) => run.steps.findIndex(found);
  const kind = (wanted: RecordSetStep['operation']['kind']) => (step: RecordSetStep) =>
    step.operation.kind === wanted;
  const moments: StudyMoment[] = [
    { label: t('studyPoeaa.record-set.model.moments.modified'), step: first(kind('set')) },
    { label: t('studyPoeaa.record-set.model.moments.added'), step: first(kind('add')) },
  ];
  if (first(kind('rival')) >= 0)
    moments.push({
      label: t('studyPoeaa.record-set.model.moments.rival'),
      step: first(kind('rival')),
    });
  moments.push({
    label: t('studyPoeaa.record-set.model.moments.firstWrite'),
    step: first(kind('write')),
  });
  const refused = first(({ operation }) => operation.kind === 'write' && !operation.matched);
  moments.push(
    refused >= 0
      ? { label: t('studyPoeaa.record-set.model.moments.refused'), step: refused }
      : { label: t('studyPoeaa.record-set.model.moments.lastWrite'), step: run.steps.length - 1 },
  );
  return moments;
}

/** The run drawn as a register: each composition's row, its row state as the column, at every step. */
export function present(run: RecordSetRun, t: StudyTranslate): StatesStudyModel {
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

import type { StudyParameters } from '@dotln-angular/models';

import {
  statesModel,
  type StatesMomentText,
  type StatesShape,
  type StatesSnapshot,
} from '../states';
import { studyParameterValues } from '../study-message';
import type {
  StatesStudyModel,
  StateTransition,
  StudyInput,
  StudyMoment,
  StudyWorkedStep,
} from '../study-model';
import type { StudyTranslate } from '../study-translate';
import {
  type ColumnName,
  columns,
  type CompositionId,
  compositions,
  type RecordRow,
  type RecordSetParameters,
  type RecordSetStep,
  rowOf,
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

const stepAt = ({ run, index }: RecordSetMoment) => run.steps[index];

function nameOf(t: StudyTranslate, id: CompositionId): string {
  switch (id) {
    case 'wood':
      return t('studyPoeaa.record-set.model.names.wood');
    case 'bridge':
      return t('studyPoeaa.record-set.model.names.bridge');
    case 'ford':
      return t('studyPoeaa.record-set.model.names.ford');
    default:
      return t('studyPoeaa.record-set.model.names.raid');
  }
}

const columnOf = (t: StudyTranslate, column: ColumnName) =>
  column === 'title'
    ? t('studyPoeaa.record-set.model.columns.title')
    : t('studyPoeaa.record-set.model.columns.note');

function statementOf(t: StudyTranslate, statement: Statement): string {
  switch (statement) {
    case 'insert':
      return t('studyPoeaa.record-set.model.statements.insert');
    case 'update':
      return t('studyPoeaa.record-set.model.statements.update');
    default:
      return t('studyPoeaa.record-set.model.statements.delete');
  }
}

const listOf = (t: StudyTranslate, words: readonly string[]) =>
  words.length ? words.join(t('studyCommon.states.listSeparator')) : t('studyCommon.states.empty');

const shapeOf = (t: StudyTranslate): StatesShape => {
  // Each way between row states, named by the operation that takes it.
  const operation = (
    id: string,
    from: string | null,
    to: string | null,
    label: string,
  ): StateTransition => ({ id, from, to, label });
  return {
    nodes: [
      { id: 'unchanged', label: t('studyPoeaa.record-set.model.states.unchanged') },
      { id: 'modified', label: t('studyPoeaa.record-set.model.states.modified'), tone: 'subject' },
      { id: 'added', label: t('studyPoeaa.record-set.model.states.added'), tone: 'subject' },
      { id: 'deleted', label: t('studyPoeaa.record-set.model.states.deleted'), tone: 'subject' },
    ],
    objects: compositions.map((id) => ({
      id,
      label: nameOf(t, id),
      key: id === 'wood' ? 'W' : id === 'bridge' ? 'B' : id === 'ford' ? 'F' : 'D',
    })),
    transitions: [
      operation('fill', null, 'unchanged', t('studyPoeaa.record-set.model.operations.fill')),
      operation(
        'setValue',
        'unchanged',
        'modified',
        t('studyPoeaa.record-set.model.operations.set'),
      ),
      operation('addRow', null, 'added', t('studyPoeaa.record-set.model.operations.add')),
      operation(
        'deleteRow',
        'unchanged',
        'deleted',
        t('studyPoeaa.record-set.model.operations.delete'),
      ),
      operation(
        'acceptUpdate',
        'modified',
        'unchanged',
        t('studyPoeaa.record-set.model.operations.writeBack'),
      ),
      operation(
        'acceptInsert',
        'added',
        'unchanged',
        t('studyPoeaa.record-set.model.operations.writeBack'),
      ),
      operation(
        'acceptDelete',
        'deleted',
        null,
        t('studyPoeaa.record-set.model.operations.writeBack'),
      ),
      operation(
        'refuseUpdate',
        'modified',
        'modified',
        t('studyPoeaa.record-set.model.operations.refused'),
      ),
    ],
  };
};

/** Which transition the row a step acts on took, by the operation performed on it. */
function tookAt(step: RecordSetStep): Readonly<Record<string, string>> {
  const { operation } = step;
  switch (operation.kind) {
    case 'set':
      return { [operation.id]: 'setValue' };
    case 'add':
      return { [operation.id]: 'addRow' };
    case 'delete':
      return { [operation.id]: 'deleteRow' };
    case 'write':
      if (!operation.matched)
        return operation.statement === 'update' ? { [operation.id]: 'refuseUpdate' } : {};
      return {
        [operation.id]:
          operation.statement === 'insert'
            ? 'acceptInsert'
            : operation.statement === 'update'
              ? 'acceptUpdate'
              : 'acceptDelete',
      };
    default:
      return {};
  }
}

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
  switch (row.state) {
    case 'added':
      return t('studyPoeaa.record-set.model.notes.added');
    case 'deleted':
      return t('studyPoeaa.record-set.model.notes.deleted');
    case 'modified':
      return stale === null
        ? t('studyPoeaa.record-set.model.notes.modified', { columns: changedColumns(t, row) })
        : t('studyPoeaa.record-set.model.notes.stale', {
            columns: changedColumns(t, row),
            column: columnOf(t, stale),
          });
    default:
      return columns.every((column) => row.current[column] === 0)
        ? t('studyPoeaa.record-set.model.notes.asRead')
        : t('studyPoeaa.record-set.model.notes.written');
  }
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
function writeNote(t: StudyTranslate, moment: RecordSetMoment): string {
  const { operation, set, table, stopped } = stepAt(moment);
  if (operation.kind !== 'write') throw new Error('Not a step of the write-back.');
  const name = nameOf(t, operation.id);
  const sent = table.statements;
  if (operation.matched) {
    if (operation.statement === 'insert')
      return t('studyPoeaa.record-set.model.steps.inserted', { sent, name });
    return operation.statement === 'update'
      ? t('studyPoeaa.record-set.model.steps.updated', { sent, name })
      : t('studyPoeaa.record-set.model.steps.deleted', { sent, name });
  }
  const row = rowOf(set, operation.id);
  const stale = row ? staleColumn(row, table) : null;
  const column = stale === null ? t('studyCommon.states.empty') : columnOf(t, stale);
  return stopped
    ? t('studyPoeaa.record-set.model.steps.refusedStop', {
        sent,
        name,
        column,
        unsent: listOf(
          t,
          unsentAfter(moment, operation.id).map((id) => nameOf(t, id)),
        ),
      })
    : t('studyPoeaa.record-set.model.steps.refusedOn', { sent, name, column });
}

/** The sentence under the drawing: what the session, the other tab or the adapter did. */
function stepNote(t: StudyTranslate, moment: RecordSetMoment): string {
  const { operation } = stepAt(moment);
  switch (operation.kind) {
    case 'fill':
      return t('studyPoeaa.record-set.model.steps.fill');
    case 'set':
      return t('studyPoeaa.record-set.model.steps.set', {
        name: nameOf(t, operation.id),
        column: columnOf(t, operation.column),
      });
    case 'delete':
      return t('studyPoeaa.record-set.model.steps.delete', { name: nameOf(t, operation.id) });
    case 'add':
      return t('studyPoeaa.record-set.model.steps.add', { name: nameOf(t, operation.id) });
    case 'rival':
      return t('studyPoeaa.record-set.model.steps.rival', {
        name: nameOf(t, operation.id),
        column: columnOf(t, operation.column),
      });
    default:
      return writeNote(t, moment);
  }
}

/** The changed rows, the statements so far and, at a write, the statement and its guard. */
function workedOf(t: StudyTranslate, moment: RecordSetMoment): StudyWorkedStep {
  const { operation, set, table, stopped } = stepAt(moment);
  const changed = set.rows.filter((row) => statementFor(row) !== null);
  const lines = [
    t('studyPoeaa.record-set.model.worked.changed', {
      names: listOf(
        t,
        changed.map(({ id }) => nameOf(t, id)),
      ),
    }),
    t('studyPoeaa.record-set.model.worked.sent', { sent: table.statements }),
    t('studyPoeaa.record-set.model.worked.refused', {
      names: listOf(
        t,
        set.rows.filter(({ refused }) => refused).map(({ id }) => nameOf(t, id)),
      ),
    }),
  ];
  if (operation.kind === 'write')
    lines.push(
      t('studyPoeaa.record-set.model.worked.statement', {
        sent: table.statements,
        statement: statementOf(t, operation.statement),
        name: nameOf(t, operation.id),
        guard:
          operation.statement === 'insert'
            ? t('studyPoeaa.record-set.model.worked.guardFree')
            : t('studyPoeaa.record-set.model.worked.guardOriginals'),
      }),
      operation.statement === 'insert'
        ? operation.matched
          ? t('studyPoeaa.record-set.model.worked.inserted')
          : t('studyPoeaa.record-set.model.worked.taken')
        : operation.matched
          ? t('studyPoeaa.record-set.model.worked.matched')
          : t('studyPoeaa.record-set.model.worked.unmatched'),
    );
  const note = stopped
    ? t('studyPoeaa.record-set.model.worked.stopped')
    : operation.kind === 'write'
      ? t('studyPoeaa.record-set.model.worked.ownWrite')
      : t('studyPoeaa.record-set.model.worked.beforeWrite');
  return {
    title: t('studyPoeaa.record-set.model.worked.title', { step: moment.index }),
    lines,
    note,
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
      onError:
        example.continueOnError > 0
          ? t('studyPoeaa.record-set.model.values.goOn')
          : t('studyPoeaa.record-set.model.values.stop'),
      refusal:
        example.continueOnError > 0
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

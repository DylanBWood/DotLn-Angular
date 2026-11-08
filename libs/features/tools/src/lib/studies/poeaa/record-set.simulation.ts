import type { StudyParameters } from '@dotln-angular/models';

import { booleanParameter, numberParameter } from '../parameters';

/** The example's inputs: a rival save, and what the adapter does with a refused row. */
export interface RecordSetParameters {
  /** How many times another tab saves a new note for Hold the bridge before the write-back. */
  readonly rivalSaves: number;
  /** True when the adapter skips a refused row and goes on; false when it stops at the first refusal. */
  readonly continueOnError: boolean;
}

/** The compositions of the example, by id: three stored, and one the session adds. */
export const compositions = ['wood', 'bridge', 'ford', 'raid'] as const;
export type CompositionId = (typeof compositions)[number];

/** The record set's columns besides the id, by the names the query returned them under. */
export const columns = ['title', 'note'] as const;
export type ColumnName = (typeof columns)[number];

/**
 * A row's values by column. Each value is the number of the write that produced it: 0 for what
 * was first stored, and every later change, this session's or another tab's, takes the next
 * number, so two cells hold equal numbers only when they hold the same value.
 */
export type RowValues = Readonly<Record<ColumnName, number>>;

export type RowState = 'unchanged' | 'modified' | 'added' | 'deleted';

/** One row of the record set: its state, its current values and the values it was read with. */
export interface RecordRow {
  readonly id: CompositionId;
  readonly state: RowState;
  readonly current: RowValues;
  /** The values read at the fill, or last accepted; null for an added row, which has none. */
  readonly original: RowValues | null;
  /** True once a write-back has refused the row; it keeps its state and its values. */
  readonly refused: boolean;
}

/** The record set, disconnected from the store: its rows in table order. */
export interface RecordSet {
  readonly rows: readonly RecordRow[];
}

/** The stored table the record set was filled from: its rows by id, and the statements it has run. */
export interface CompositionTable {
  readonly rows: Readonly<Partial<Record<CompositionId, RowValues>>>;
  readonly statements: number;
}

export type Statement = 'insert' | 'update' | 'delete';

export type RecordSetOperation =
  | { readonly kind: 'fill' }
  | { readonly kind: 'set'; readonly id: CompositionId; readonly column: ColumnName }
  | { readonly kind: 'delete'; readonly id: CompositionId }
  | { readonly kind: 'add'; readonly id: CompositionId }
  | { readonly kind: 'rival'; readonly id: CompositionId; readonly column: ColumnName }
  | {
      readonly kind: 'write';
      readonly id: CompositionId;
      readonly statement: Statement;
      readonly matched: boolean;
    };

/** One moment of the run: what was done, and the record set and the stored table afterwards. */
export interface RecordSetStep {
  readonly operation: RecordSetOperation;
  readonly set: RecordSet;
  readonly table: CompositionTable;
  /** True once the adapter has stopped at a refused row, leaving the rows after it unsent. */
  readonly stopped: boolean;
}

export const readParameters = (parameters: StudyParameters): RecordSetParameters => ({
  rivalSaves: numberParameter(parameters, 'rivalSaves'),
  continueOnError: booleanParameter(parameters, 'continueOnError'),
});

/** The row of a composition in the record set; undefined once a deletion has been accepted. */
export const rowOf = (set: RecordSet, id: CompositionId): RecordRow | undefined =>
  set.rows.find((row) => row.id === id);

const replaced = (set: RecordSet, row: RecordRow): RecordSet => ({
  rows: set.rows.map((each) => (each.id === row.id ? row : each)),
});

const existing = (set: RecordSet, id: CompositionId): RecordRow => {
  const row = rowOf(set, id);
  if (!row) throw new Error(`${id} is not in the record set.`);
  return row;
};

/** One query fills the record set: every stored row Unchanged, its values kept as its originals. */
export function fill(table: CompositionTable, ids: readonly CompositionId[]): RecordSet {
  return {
    rows: ids.flatMap((id): RecordRow[] => {
      const stored = table.rows[id];
      return stored
        ? [{ id, state: 'unchanged', current: stored, original: stored, refused: false }]
        : [];
    }),
  };
}

/** Sets one cell by its column's name; an Unchanged row becomes Modified, its originals kept. */
export function setValue(
  set: RecordSet,
  id: CompositionId,
  column: ColumnName,
  write: number,
): RecordSet {
  const row = existing(set, id);
  if (row.state === 'deleted') throw new Error(`${id} is deleted.`);
  return replaced(set, {
    ...row,
    state: row.state === 'unchanged' ? 'modified' : row.state,
    current: { ...row.current, [column]: write },
  });
}

/** Adds a row at the end of the table: Added, with values but no originals. */
export function addRow(set: RecordSet, id: CompositionId, write: number): RecordSet {
  if (rowOf(set, id)) throw new Error(`${id} is already in the record set.`);
  const current: RowValues = { title: write, note: write };
  return {
    rows: [...set.rows, { id, state: 'added', current, original: null, refused: false }],
  };
}

/** Marks a row Deleted, keeping it and its originals for the write-back; an added row just goes. */
export function deleteRow(set: RecordSet, id: CompositionId): RecordSet {
  const row = existing(set, id);
  return row.state === 'added'
    ? { rows: set.rows.filter((each) => each.id !== id) }
    : replaced(set, { ...row, state: 'deleted' });
}

/** Another tab's own save of one cell: the stored row moves on without this record set knowing. */
export function rivalSave(
  table: CompositionTable,
  id: CompositionId,
  column: ColumnName,
  write: number,
): CompositionTable {
  const stored = table.rows[id];
  if (!stored) throw new Error(`${id} is not stored.`);
  return { ...table, rows: { ...table.rows, [id]: { ...stored, [column]: write } } };
}

// The statement the adapter builds for a row in each state; none for an Unchanged row.
const statements: Readonly<Record<RowState, Statement | null>> = {
  unchanged: null,
  modified: 'update',
  added: 'insert',
  deleted: 'delete',
};

/** The statement the adapter builds for a row from its state; none for an Unchanged row. */
export const statementFor = (row: RecordRow): Statement | null => statements[row.state];

/**
 * Whether a row's statement finds what it expects: an insert needs its id free, and an update or
 * a delete needs the stored row to hold every original value, not only the ones that changed.
 */
export function matches(row: RecordRow, table: CompositionTable): boolean {
  const stored = table.rows[row.id];
  if (row.state === 'added') return stored === undefined;
  const { original } = row;
  return (
    stored !== undefined &&
    original !== null &&
    columns.every((column) => stored[column] === original[column])
  );
}

/** The first column whose stored value no longer equals the row's original; null when none differs. */
export function staleColumn(row: RecordRow, table: CompositionTable): ColumnName | null {
  const stored = table.rows[row.id];
  const { original } = row;
  if (!stored || !original) return null;
  return columns.find((column) => stored[column] !== original[column]) ?? null;
}

/**
 * Sends one row's statement as a write of its own. A match is accepted: the stored row takes the
 * current values, or goes for a delete, and the row's originals become its current values, or the
 * row leaves the set. A statement that matches nothing changes no stored row, and the row is
 * marked refused with its state and values as they were.
 */
export function writeRow(
  set: RecordSet,
  table: CompositionTable,
  id: CompositionId,
): {
  readonly set: RecordSet;
  readonly table: CompositionTable;
  readonly statement: Statement;
  readonly matched: boolean;
} {
  const row = existing(set, id);
  const statement = statementFor(row);
  if (statement === null) throw new Error(`${id} has nothing to write.`);
  const matched = matches(row, table);
  const statements = table.statements + 1;
  if (!matched)
    return {
      set: replaced(set, { ...row, refused: true }),
      table: { ...table, statements },
      statement,
      matched,
    };
  if (statement === 'delete') {
    const { [id]: _deleted, ...rows } = table.rows;
    return {
      set: { rows: set.rows.filter((each) => each.id !== id) },
      table: { rows, statements },
      statement,
      matched,
    };
  }
  return {
    set: replaced(set, { ...row, state: 'unchanged', original: row.current, refused: false }),
    table: { rows: { ...table.rows, [id]: row.current }, statements },
    statement,
    matched,
  };
}

/**
 * The example as the session runs it: fill from three stored compositions, change a note and a
 * title, delete one row and add another, perhaps let another tab save first, then write the
 * changed rows back one at a time in table order, stopping at a refused row unless told to go on.
 */
export function recordSetRun(example: RecordSetParameters): readonly RecordSetStep[] {
  const stored: RowValues = { title: 0, note: 0 };
  let table: CompositionTable = {
    rows: { wood: stored, bridge: stored, ford: stored },
    statements: 0,
  };
  let set = fill(table, ['wood', 'bridge', 'ford']);
  let writes = 0;
  const nextWrite = () => (writes += 1);
  let stopped = false;
  const steps: RecordSetStep[] = [{ operation: { kind: 'fill' }, set, table, stopped }];
  const record = (operation: RecordSetOperation) => steps.push({ operation, set, table, stopped });
  set = setValue(set, 'wood', 'note', nextWrite());
  record({ kind: 'set', id: 'wood', column: 'note' });
  set = setValue(set, 'bridge', 'title', nextWrite());
  record({ kind: 'set', id: 'bridge', column: 'title' });
  set = deleteRow(set, 'ford');
  record({ kind: 'delete', id: 'ford' });
  set = addRow(set, 'raid', nextWrite());
  record({ kind: 'add', id: 'raid' });
  for (let save = 0; save < example.rivalSaves; save++) {
    table = rivalSave(table, 'bridge', 'note', nextWrite());
    record({ kind: 'rival', id: 'bridge', column: 'note' });
  }
  const changed = set.rows.filter((row) => statementFor(row) !== null).map(({ id }) => id);
  for (const id of changed) {
    const written = writeRow(set, table, id);
    set = written.set;
    table = written.table;
    stopped = !written.matched && !example.continueOnError;
    record({ kind: 'write', id, statement: written.statement, matched: written.matched });
    if (stopped) break;
  }
  return steps;
}

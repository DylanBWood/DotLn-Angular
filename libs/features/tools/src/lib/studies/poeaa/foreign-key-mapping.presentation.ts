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
  StudyComparison,
  StudyInput,
  StudyMoment,
  StudyWorkedStep,
} from '../study-model';
import type { StudyTranslate } from '../study-translate';
import {
  type CatalogRow,
  catalogRows,
  type FollowedKey,
  type ForeignKeyParameters,
  foreignKeyRun,
  type ForeignKeyStep,
  type Loader,
  placeOf,
  type RowId,
} from './foreign-key-mapping.simulation';

/** The whole run as the presentation reads it: the example, its rows, its steps and the inputs. */
export interface ForeignKeyRun {
  readonly example: ForeignKeyParameters;
  readonly catalog: readonly CatalogRow[];
  readonly steps: readonly ForeignKeyStep[];
  readonly parameters: StudyParameters;
}

/** One moment of the run: the run, and which of its steps this is. */
interface ForeignKeyMoment {
  readonly run: ForeignKeyRun;
  readonly index: number;
}

const stepAt = ({ run, index }: ForeignKeyMoment) => run.steps[index];
const usesMap = (run: ForeignKeyRun) => run.example.identityMap > 0;

function nameOf(t: StudyTranslate, id: RowId): string {
  switch (id) {
    case 'dataMapper':
      return t('studyPoeaa.foreign-key-mapping.model.names.dataMapper');
    case 'identityMap':
      return t('studyPoeaa.foreign-key-mapping.model.names.identityMap');
    default:
      return t('studyPoeaa.foreign-key-mapping.model.names.unitOfWork');
  }
}

const namesOf = (t: StudyTranslate, ids: readonly RowId[]) =>
  ids.length
    ? ids.map((id) => nameOf(t, id)).join(t('studyCommon.states.listSeparator'))
    : t('studyCommon.states.empty');

const keyOf = (t: StudyTranslate, line: number) =>
  t('studyPoeaa.foreign-key-mapping.model.key', { line });

const keysOf = (t: StudyTranslate, row: CatalogRow) =>
  row.keys.map((line) => keyOf(t, line)).join(t('studyCommon.states.listSeparator'));

function rowOf(run: ForeignKeyRun, id: RowId): CatalogRow {
  const row = run.catalog.find((candidate) => candidate.id === id);
  if (!row) throw new Error(`The example's catalog has no ${id}.`);
  return row;
}

const shapeOf = (t: StudyTranslate): StatesShape => ({
  nodes: [
    { id: 'stored', label: t('studyPoeaa.foreign-key-mapping.model.places.stored') },
    {
      id: 'resolving',
      label: t('studyPoeaa.foreign-key-mapping.model.places.resolving'),
      tone: 'subject',
    },
    {
      id: 'resolved',
      label: t('studyPoeaa.foreign-key-mapping.model.places.resolved'),
      tone: 'subject',
    },
  ],
  objects: catalogRows.map((id) => ({
    id,
    label: nameOf(t, id),
    key: id === 'dataMapper' ? 'D' : id === 'identityMap' ? 'I' : 'U',
  })),
  transitions: [
    {
      id: 'load',
      from: 'stored',
      to: 'resolving',
      label: t('studyPoeaa.foreign-key-mapping.model.operations.load'),
    },
    {
      id: 'reload',
      from: 'resolving',
      to: 'resolving',
      label: t('studyPoeaa.foreign-key-mapping.model.operations.load'),
    },
    {
      id: 'findResolving',
      from: 'resolving',
      to: 'resolving',
      label: t('studyPoeaa.foreign-key-mapping.model.operations.find'),
    },
    {
      id: 'findResolved',
      from: 'resolved',
      to: 'resolved',
      label: t('studyPoeaa.foreign-key-mapping.model.operations.find'),
    },
    {
      id: 'resolve',
      from: 'resolving',
      to: 'resolved',
      label: t('studyPoeaa.foreign-key-mapping.model.operations.resolve'),
    },
  ],
});

/** The rows that became resolved at a step: finished, with no other object of theirs still pending. */
function newlyResolved(moment: ForeignKeyMoment): readonly RowId[] {
  const { operation, loader } = stepAt(moment);
  if (operation.kind !== 'follow') return [];
  return operation.resolved.filter((row) => placeOf(loader, row) === 'resolved');
}

/** Which transition each row took at a step; a row that finishes takes resolve whatever else it did. */
function tookAt(moment: ForeignKeyMoment): Readonly<Record<string, string>> {
  const { operation } = stepAt(moment);
  if (operation.kind === 'open') return { [operation.row]: 'load' };
  if (operation.kind !== 'follow') return {};
  const before = moment.run.steps[moment.index - 1].loader;
  const reached =
    operation.how === 'found'
      ? placeOf(before, operation.to) === 'resolved'
        ? 'findResolved'
        : 'findResolving'
      : operation.how;
  return {
    [operation.to]: reached,
    ...Object.fromEntries(newlyResolved(moment).map((row) => [row, 'resolve'])),
  };
}

const snapshotOf = (moment: ForeignKeyMoment): StatesSnapshot => ({
  at: Object.fromEntries(catalogRows.map((id) => [id, placeOf(stepAt(moment).loader, id)])),
  took: tookAt(moment),
});

/** The few words beside a row's name: its stored keys, how far its object has got, or what it refers to. */
function rowNote(t: StudyTranslate, moment: ForeignKeyMoment, id: RowId): string {
  const { loader } = stepAt(moment);
  const row = rowOf(moment.run, id);
  const built = loader.objects.filter((object) => object.row === id);
  switch (placeOf(loader, id)) {
    case 'stored':
      return t('studyPoeaa.foreign-key-mapping.model.notes.stored', { keys: keysOf(t, row) });
    case 'resolving': {
      if (built.length > 1)
        return t('studyPoeaa.foreign-key-mapping.model.notes.copies', { copies: built.length });
      const index = loader.objects.indexOf(built[0]);
      const pending = loader.pending.find(({ object }) => object === index);
      return t('studyPoeaa.foreign-key-mapping.model.notes.resolving', {
        followed: pending?.next ?? 0,
        keys: row.keys.length,
      });
    }
    default:
      return t('studyPoeaa.foreign-key-mapping.model.notes.resolved', {
        names: namesOf(
          t,
          built[0].references.map((reference) => loader.objects[reference].row),
        ),
      });
  }
}

/** The sentence for one followed key, by how it became a reference. */
function followNote(t: StudyTranslate, moment: ForeignKeyMoment, operation: FollowedKey): string {
  const { loader } = stepAt(moment);
  const words = {
    from: nameOf(t, operation.from),
    key: keyOf(t, operation.key),
    to: nameOf(t, operation.to),
  };
  if (operation.how === 'load') return t('studyPoeaa.foreign-key-mapping.model.steps.load', words);
  if (operation.how === 'reload')
    return t('studyPoeaa.foreign-key-mapping.model.steps.reload', {
      ...words,
      copy: loader.objects.filter(({ row }) => row === operation.to).length,
    });
  return t('studyPoeaa.foreign-key-mapping.model.steps.found', words);
}

/** The sentence under the drawing: what the loader did at this step, in the pattern's terms. */
function stepNote(t: StudyTranslate, moment: ForeignKeyMoment): string {
  const { operation, loader } = stepAt(moment);
  switch (operation.kind) {
    case 'start':
      return t('studyPoeaa.foreign-key-mapping.model.steps.start');
    case 'open':
      return usesMap(moment.run)
        ? t('studyPoeaa.foreign-key-mapping.model.steps.open', { name: nameOf(t, operation.row) })
        : t('studyPoeaa.foreign-key-mapping.model.steps.openNoMap', {
            name: nameOf(t, operation.row),
          });
    case 'stopped':
      return t('studyPoeaa.foreign-key-mapping.model.steps.stopped', {
        reads: loader.reads,
        rows: moment.run.catalog.length,
        limit: moment.run.example.readLimit,
      });
    default: {
      const resolved = newlyResolved(moment);
      return resolved.length
        ? t('studyPoeaa.foreign-key-mapping.model.steps.withResolved', {
            followed: followNote(t, moment, operation),
            resolved: namesOf(t, resolved),
          })
        : followNote(t, moment, operation);
    }
  }
}

/** The line the step's own operation is worth showing: the row read, the key found, or the stop. */
function operationLines(t: StudyTranslate, moment: ForeignKeyMoment): readonly string[] {
  const { operation, loader } = stepAt(moment);
  switch (operation.kind) {
    case 'open': {
      const row = rowOf(moment.run, operation.row);
      return [
        t('studyPoeaa.foreign-key-mapping.model.worked.opened', {
          key: keyOf(t, row.line),
          name: nameOf(t, row.id),
          keys: keysOf(t, row),
        }),
      ];
    }
    case 'follow': {
      const target = rowOf(moment.run, operation.to);
      const words = { key: keyOf(t, operation.key), name: nameOf(t, target.id) };
      const line =
        operation.how === 'load'
          ? t('studyPoeaa.foreign-key-mapping.model.worked.loaded', {
              ...words,
              keys: keysOf(t, target),
            })
          : operation.how === 'reload'
            ? t('studyPoeaa.foreign-key-mapping.model.worked.reloaded', {
                ...words,
                copy: loader.objects.filter(({ row }) => row === target.id).length,
              })
            : t('studyPoeaa.foreign-key-mapping.model.worked.found', words);
      const resolved = newlyResolved(moment);
      return resolved.length
        ? [
            line,
            t('studyPoeaa.foreign-key-mapping.model.worked.resolved', {
              names: namesOf(t, resolved),
            }),
          ]
        : [line];
    }
    case 'stopped':
      return [
        t('studyPoeaa.foreign-key-mapping.model.worked.stopped', {
          reads: loader.reads,
          limit: moment.run.example.readLimit,
        }),
      ];
    default:
      return [];
  }
}

const referencesIn = (loader: Loader) =>
  loader.objects.reduce((total, { references }) => total + references.length, 0);

/** The identity map, or the objects built without one, the counts, then the step's own lines. */
function workedOf(t: StudyTranslate, moment: ForeignKeyMoment): StudyWorkedStep {
  const { loader } = stepAt(moment);
  const mapped = catalogRows.filter((id) => loader.identityMap[id] !== undefined);
  return {
    title: t('studyPoeaa.foreign-key-mapping.model.worked.title', { step: moment.index }),
    lines: [
      usesMap(moment.run)
        ? t('studyPoeaa.foreign-key-mapping.model.worked.identityMap', {
            names: namesOf(t, mapped),
          })
        : t('studyPoeaa.foreign-key-mapping.model.worked.noMap', {
            objects: loader.objects.length,
          }),
      t('studyPoeaa.foreign-key-mapping.model.worked.counts', {
        reads: loader.reads,
        rows: moment.run.catalog.length,
        references: referencesIn(loader),
      }),
      ...operationLines(t, moment),
    ],
    note: usesMap(moment.run)
      ? t('studyPoeaa.foreign-key-mapping.model.worked.noteMap')
      : t('studyPoeaa.foreign-key-mapping.model.worked.noteNoMap'),
  };
}

/** The values the record's prose reads at a moment, with the example's own inputs among them. */
function textOf(t: StudyTranslate, moment: ForeignKeyMoment): StatesMomentText {
  const { loader } = stepAt(moment);
  return {
    values: {
      ...studyParameterValues(moment.run.parameters, t),
      reads: String(loader.reads),
      rows: String(moment.run.catalog.length),
      objects: String(loader.objects.length),
      references: String(referencesIn(loader)),
      resolving: usesMap(moment.run)
        ? t('studyPoeaa.foreign-key-mapping.model.values.throughMap')
        : t('studyPoeaa.foreign-key-mapping.model.values.noMap', {
            limit: moment.run.example.readLimit,
          }),
    },
    note: stepNote(t, moment),
    worked: workedOf(t, moment),
    notes: Object.fromEntries(catalogRows.map((id) => [id, rowNote(t, moment, id)])),
  };
}

/** Rows read at each step of a run, held at the last count once the run is over. */
const readsOver = (steps: readonly ForeignKeyStep[], length: number) =>
  Array.from({ length }, (_, index) => steps[Math.min(index, steps.length - 1)].loader.reads);

/** The same opening run with and without the identity map, charted by the rows each has read. */
function comparisonOf(t: StudyTranslate, run: ForeignKeyRun): StudyComparison {
  const through = foreignKeyRun({ ...run.example, identityMap: 1 });
  const without = foreignKeyRun({ ...run.example, identityMap: 0 });
  const length = Math.max(through.length, without.length);
  const lastWithout = without[without.length - 1].loader;
  return {
    title: t('studyPoeaa.foreign-key-mapping.model.comparison.title'),
    intro: t('studyPoeaa.foreign-key-mapping.model.comparison.intro'),
    timeline: {
      title: t('studyPoeaa.foreign-key-mapping.model.comparison.chart'),
      xLabel: t('studyPoeaa.foreign-key-mapping.model.comparison.xLabel'),
      yLabel: t('studyPoeaa.foreign-key-mapping.model.comparison.yLabel'),
      seconds: Array.from({ length }, (_, index) => index),
      series: [
        {
          id: 'through',
          label: t('studyPoeaa.foreign-key-mapping.model.comparison.through'),
          tone: 'actual',
          values: readsOver(through, length),
        },
        {
          id: 'without',
          label: t('studyPoeaa.foreign-key-mapping.model.comparison.without'),
          tone: 'desired',
          values: readsOver(without, length),
        },
      ],
      xTicks: Array.from({ length }, (_, index) => index),
    },
    findings: [
      t('studyPoeaa.foreign-key-mapping.model.comparison.reads', {
        rows: run.catalog.length,
        through: through[through.length - 1].loader.reads,
        without: lastWithout.reads,
      }),
      t('studyPoeaa.foreign-key-mapping.model.comparison.copies', {
        copies: lastWithout.objects.filter(({ row }) => row === 'identityMap').length,
      }),
    ],
  };
}

const inputsOf = (t: StudyTranslate): readonly StudyInput[] => [
  {
    name: 'identityMap',
    label: t('studyPoeaa.foreign-key-mapping.model.inputs.identityMap'),
    unit: t('studyPoeaa.foreign-key-mapping.model.inputs.choice'),
    min: 0,
    max: 1,
    step: 1,
  },
];

/** The named moments: the opening, the first load, the first find or second read, the first finish, the end. */
function momentsOf(t: StudyTranslate, run: ForeignKeyRun): readonly StudyMoment[] {
  const first = (how: string) =>
    run.steps.findIndex(({ operation }) => operation.kind === 'follow' && operation.how === how);
  const resolved = run.steps.findIndex((_, index) => newlyResolved({ run, index }).length > 0);
  const moments: StudyMoment[] = [
    {
      label: t('studyPoeaa.foreign-key-mapping.model.moments.open'),
      step: run.steps.findIndex(({ operation }) => operation.kind === 'open'),
    },
  ];
  const optional: readonly (readonly [string, number])[] = [
    [t('studyPoeaa.foreign-key-mapping.model.moments.load'), first('load')],
    [t('studyPoeaa.foreign-key-mapping.model.moments.found'), first('found')],
    [t('studyPoeaa.foreign-key-mapping.model.moments.reload'), first('reload')],
    [t('studyPoeaa.foreign-key-mapping.model.moments.resolved'), resolved],
  ];
  for (const [label, step] of optional) if (step >= 0) moments.push({ label, step });
  const last = run.steps.length - 1;
  moments.push({
    label:
      run.steps[last].operation.kind === 'stopped'
        ? t('studyPoeaa.foreign-key-mapping.model.moments.stopped')
        : t('studyPoeaa.foreign-key-mapping.model.moments.done'),
    step: last,
  });
  return moments;
}

/** The run drawn as a register: each row's line, the column of where its object has got, at every step. */
export function present(run: ForeignKeyRun, t: StudyTranslate): StatesStudyModel {
  return statesModel(
    {
      shape: shapeOf(t),
      snapshots: run.steps.map((_, index) => snapshotOf({ run, index })),
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

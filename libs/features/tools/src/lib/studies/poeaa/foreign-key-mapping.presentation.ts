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
  type ForeignKeyStep,
  type Loader,
  placeOf,
  type Resolution,
  type RowId,
  type RowPlace,
} from './foreign-key-mapping.simulation';

/** The whole run as the presentation reads it: the example, its rows, its steps and the inputs. */
export interface ForeignKeyRun {
  readonly example: ForeignKeyParameters;
  readonly catalog: readonly CatalogRow[];
  readonly steps: readonly ForeignKeyStep[];
  /** The same opening run through an identity map and without one, which the comparison charts. */
  readonly through: readonly ForeignKeyStep[];
  readonly without: readonly ForeignKeyStep[];
  readonly parameters: StudyParameters;
}

/** One moment of the run: the run, and which of its steps this is. */
interface ForeignKeyMoment {
  readonly run: ForeignKeyRun;
  readonly index: number;
}

const stepAt = ({ run, index }: ForeignKeyMoment) => run.steps[index];

// Each row's name and the letter its token shows; the compiler requires an entry for every row the
// example's catalog has.
const names = {
  dataMapper: 'studyPoeaa.foreign-key-mapping.model.names.dataMapper',
  identityMap: 'studyPoeaa.foreign-key-mapping.model.names.identityMap',
  unitOfWork: 'studyPoeaa.foreign-key-mapping.model.names.unitOfWork',
} as const satisfies Record<RowId, string>;
const tokens = { dataMapper: 'D', identityMap: 'I', unitOfWork: 'U' } as const satisfies Record<
  RowId,
  string
>;

const nameOf = (t: StudyTranslate, id: RowId): string => t(names[id]);

const namesOf = (t: StudyTranslate, ids: readonly RowId[]) =>
  listOf(
    t,
    ids.map((id) => nameOf(t, id)),
  );

const keyOf = (t: StudyTranslate, line: number) =>
  t('studyPoeaa.foreign-key-mapping.model.key', { line });

const keysOf = (t: StudyTranslate, row: CatalogRow) =>
  listOf(
    t,
    row.keys.map((line) => keyOf(t, line)),
  );

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
  objects: catalogRows.map((id) => ({ id, label: nameOf(t, id), key: tokens[id] })),
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

/**
 * The transitions a step's moves cannot be told by their states alone: a key followed to a row that
 * stays where it stood, read again or found in the identity map. Loading a stored row and finishing
 * one each join their two states by a transition of their own.
 */
function tookAt(moment: ForeignKeyMoment): Readonly<Record<string, string>> {
  const { operation, loader } = stepAt(moment);
  if (operation.kind !== 'follow') return {};
  const place = placeOf(moment.run.steps[moment.index - 1].loader, operation.to);
  if (place !== placeOf(loader, operation.to)) return {};
  if (operation.how === 'reload') return { [operation.to]: 'reload' };
  return { [operation.to]: place === 'resolved' ? 'findResolved' : 'findResolving' };
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
  const notes: Record<RowPlace, () => string> = {
    stored: () => t('studyPoeaa.foreign-key-mapping.model.notes.stored', { keys: keysOf(t, row) }),
    resolving: () => {
      if (built.length > 1)
        return t('studyPoeaa.foreign-key-mapping.model.notes.copies', { copies: built.length });
      const index = loader.objects.indexOf(built[0]);
      const pending = loader.pending.find(({ object }) => object === index);
      return t('studyPoeaa.foreign-key-mapping.model.notes.resolving', {
        followed: pending?.next ?? 0,
        keys: row.keys.length,
      });
    },
    resolved: () =>
      t('studyPoeaa.foreign-key-mapping.model.notes.resolved', {
        names: namesOf(
          t,
          built[0].references.map((reference) => loader.objects[reference].row),
        ),
      }),
  };
  return notes[placeOf(loader, id)]();
}

/** The sentence for one followed key, by how it became a reference. */
function followNote(t: StudyTranslate, moment: ForeignKeyMoment, operation: FollowedKey): string {
  const { loader } = stepAt(moment);
  const words = {
    from: nameOf(t, operation.from),
    key: keyOf(t, operation.key),
    to: nameOf(t, operation.to),
  };
  const notes: Record<Resolution, () => string> = {
    load: () => t('studyPoeaa.foreign-key-mapping.model.steps.load', words),
    reload: () =>
      t('studyPoeaa.foreign-key-mapping.model.steps.reload', {
        ...words,
        copy: loader.objects.filter(({ row }) => row === operation.to).length,
      }),
    found: () => t('studyPoeaa.foreign-key-mapping.model.steps.found', words),
  };
  return notes[operation.how]();
}

/** The sentence under the drawing: what the loader did at this step, in the pattern's terms. */
function stepNote(t: StudyTranslate, moment: ForeignKeyMoment): string {
  const { operation, loader } = stepAt(moment);
  return matchKind(operation, {
    start: () => t('studyPoeaa.foreign-key-mapping.model.steps.start'),
    open: ({ row }) =>
      moment.run.example.identityMap
        ? t('studyPoeaa.foreign-key-mapping.model.steps.open', { name: nameOf(t, row) })
        : t('studyPoeaa.foreign-key-mapping.model.steps.openNoMap', { name: nameOf(t, row) }),
    follow: (followed) => {
      const resolved = newlyResolved(moment);
      return resolved.length
        ? t('studyPoeaa.foreign-key-mapping.model.steps.withResolved', {
            followed: followNote(t, moment, followed),
            resolved: namesOf(t, resolved),
          })
        : followNote(t, moment, followed);
    },
    stopped: () =>
      t('studyPoeaa.foreign-key-mapping.model.steps.stopped', {
        reads: loader.reads,
        rows: moment.run.catalog.length,
        limit: moment.run.example.readLimit,
      }),
  });
}

/** The worked line for one followed key, by how it became a reference. */
function followLine(t: StudyTranslate, moment: ForeignKeyMoment, operation: FollowedKey): string {
  const { loader } = stepAt(moment);
  const target = rowOf(moment.run, operation.to);
  const words = { key: keyOf(t, operation.key), name: nameOf(t, target.id) };
  const lines: Record<Resolution, () => string> = {
    load: () =>
      t('studyPoeaa.foreign-key-mapping.model.worked.loaded', {
        ...words,
        keys: keysOf(t, target),
      }),
    reload: () =>
      t('studyPoeaa.foreign-key-mapping.model.worked.reloaded', {
        ...words,
        copy: loader.objects.filter(({ row }) => row === target.id).length,
      }),
    found: () => t('studyPoeaa.foreign-key-mapping.model.worked.found', words),
  };
  return lines[operation.how]();
}

/** The line the step's own operation is worth showing: the row read, the key found, or the stop. */
function operationLines(t: StudyTranslate, moment: ForeignKeyMoment): readonly string[] {
  const { operation, loader } = stepAt(moment);
  return matchKind(operation, {
    start: () => [],
    open: ({ row: id }) => {
      const row = rowOf(moment.run, id);
      return [
        t('studyPoeaa.foreign-key-mapping.model.worked.opened', {
          key: keyOf(t, row.line),
          name: nameOf(t, row.id),
          keys: keysOf(t, row),
        }),
      ];
    },
    follow: (followed) => {
      const line = followLine(t, moment, followed);
      const resolved = newlyResolved(moment);
      return resolved.length
        ? [
            line,
            t('studyPoeaa.foreign-key-mapping.model.worked.resolved', {
              names: namesOf(t, resolved),
            }),
          ]
        : [line];
    },
    stopped: () => [
      t('studyPoeaa.foreign-key-mapping.model.worked.stopped', {
        reads: loader.reads,
        limit: moment.run.example.readLimit,
      }),
    ],
  });
}

const referencesIn = (loader: Loader) =>
  loader.objects.reduce((total, { references }) => total + references.length, 0);

/** The identity map, or the objects built without one, the counts, then the step's own lines. */
function workedOf(t: StudyTranslate, moment: ForeignKeyMoment): StudyWorkedStep {
  const { loader } = stepAt(moment);
  const mapped = catalogRows.filter((id) => loader.identityMap[id] !== undefined);
  const { identityMap } = moment.run.example;
  return {
    title: t('studyPoeaa.foreign-key-mapping.model.worked.title', { step: moment.index }),
    lines: [
      identityMap
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
    note: identityMap
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
      resolving: moment.run.example.identityMap
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
function comparisonOf(t: StudyTranslate, run: ForeignKeyRun): StudyComparison<'steps'> {
  const { through, without } = run;
  const length = Math.max(through.length, without.length);
  const lastWithout = without[without.length - 1].loader;
  const steps = Array.from({ length }, (_, index) => index);
  return {
    title: t('studyPoeaa.foreign-key-mapping.model.comparison.title'),
    intro: t('studyPoeaa.foreign-key-mapping.model.comparison.intro'),
    timeline: {
      title: t('studyPoeaa.foreign-key-mapping.model.comparison.chart'),
      xLabel: t('studyPoeaa.foreign-key-mapping.model.comparison.xLabel'),
      yLabel: t('studyPoeaa.foreign-key-mapping.model.comparison.yLabel'),
      steps,
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
      xTicks: steps,
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
  const first = (how: Resolution) =>
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

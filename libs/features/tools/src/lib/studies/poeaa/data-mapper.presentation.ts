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
  type CompositionId,
  compositions,
  type DataMapperParameters,
  type DataMapperStep,
  type Place,
  placeOf,
} from './data-mapper.simulation';

/** The whole run as the presentation reads it: the example, its steps and the record's inputs. */
export interface DataMapperRun {
  readonly example: DataMapperParameters;
  readonly steps: readonly DataMapperStep[];
  readonly parameters: StudyParameters;
}

/** One moment of the run: the run, and which of its steps this is. */
interface DataMapperMoment {
  readonly run: DataMapperRun;
  readonly index: number;
}

const stepAt = ({ run, index }: DataMapperMoment) => run.steps[index];

// Each composition's name and the letter its token shows; the compiler requires an entry for every
// composition the example has.
const names = {
  flank: 'studyPoeaa.data-mapper.model.names.flank',
  ridge: 'studyPoeaa.data-mapper.model.names.ridge',
  dawn: 'studyPoeaa.data-mapper.model.names.dawn',
} as const satisfies Record<CompositionId, string>;
const tokens = { flank: 'F', ridge: 'R', dawn: 'D' } as const satisfies Record<
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
    { id: 'stored', label: t('studyPoeaa.data-mapper.model.places.stored') },
    { id: 'mapped', label: t('studyPoeaa.data-mapper.model.places.mapped'), tone: 'subject' },
    { id: 'edited', label: t('studyPoeaa.data-mapper.model.places.edited') },
    { id: 'unmapped', label: t('studyPoeaa.data-mapper.model.places.unmapped'), tone: 'subject' },
  ],
  objects: compositions.map((id) => ({ id, label: nameOf(t, id), key: tokens[id] })),
  transitions: [
    {
      id: 'load',
      from: 'stored',
      to: 'mapped',
      label: t('studyPoeaa.data-mapper.model.operations.load'),
    },
    {
      id: 'refuse',
      from: 'stored',
      to: 'unmapped',
      label: t('studyPoeaa.data-mapper.model.operations.load'),
    },
    {
      id: 'find',
      from: 'mapped',
      to: 'mapped',
      label: t('studyPoeaa.data-mapper.model.operations.find'),
    },
    {
      id: 'rename',
      from: 'mapped',
      to: 'edited',
      label: t('studyPoeaa.data-mapper.model.operations.rename'),
    },
    {
      id: 'update',
      from: 'edited',
      to: 'mapped',
      label: t('studyPoeaa.data-mapper.model.operations.update'),
    },
    {
      id: 'saveAllRewrite',
      from: 'mapped',
      to: 'mapped',
      label: t('studyPoeaa.data-mapper.model.operations.saveAll'),
    },
    {
      id: 'saveAllUpdate',
      from: 'edited',
      to: 'mapped',
      label: t('studyPoeaa.data-mapper.model.operations.saveAll'),
    },
    {
      id: 'saveAllDrop',
      from: 'unmapped',
      to: null,
      label: t('studyPoeaa.data-mapper.model.operations.saveAll'),
    },
  ],
});

/**
 * The transitions a step's moves cannot be told by their states alone: a find, or a whole-library
 * save's rewrite, leaves an object where it stood, and an edited object goes back to Mapped either
 * by its own update or by the whole-library save.
 */
function tookAt(moment: DataMapperMoment): Readonly<Record<string, string>> {
  const { operation } = stepAt(moment);
  if (operation.kind === 'find' || operation.kind === 'update')
    return { [operation.id]: operation.kind };
  if (operation.kind !== 'saveAll') return {};
  const before = moment.run.steps[moment.index - 1];
  const { formatRead } = moment.run.example;
  return Object.fromEntries(
    operation.written.map((id) => [
      id,
      placeOf(before, id, formatRead) === 'edited' ? 'saveAllUpdate' : 'saveAllRewrite',
    ]),
  );
}

function snapshotOf(moment: DataMapperMoment): StatesSnapshot {
  const step = stepAt(moment);
  const { formatRead } = moment.run.example;
  return {
    at: Object.fromEntries(compositions.map((id) => [id, placeOf(step, id, formatRead)])),
    took: tookAt(moment),
  };
}

/** The few words beside a composition's name: what its row or its object holds now. */
function objectNote(t: StudyTranslate, moment: DataMapperMoment, id: CompositionId): string | null {
  const step = stepAt(moment);
  const { formatRead } = moment.run.example;
  const place = placeOf(step, id, formatRead);
  if (place === null) return null;
  const format = step.storage.rows[id]?.format ?? 0;
  const notes: Record<Place, () => string> = {
    stored: () => t('studyPoeaa.data-mapper.model.notes.stored', { format }),
    unmapped: () => t('studyPoeaa.data-mapper.model.notes.unmapped', { format, formatRead }),
    edited: () => t('studyPoeaa.data-mapper.model.notes.edited'),
    mapped: () =>
      step.operation.kind === 'find' && step.operation.id === id
        ? t('studyPoeaa.data-mapper.model.notes.foundAgain')
        : t('studyPoeaa.data-mapper.model.notes.mapped', {
            steps: step.mapper.identityMap[id]?.steps ?? 0,
          }),
  };
  return notes[place]();
}

/** The sentence under the drawing: what the scene and the mapper did at this step. */
function stepNote(t: StudyTranslate, moment: DataMapperMoment): string {
  const { operation, storage } = stepAt(moment);
  const { formatRead } = moment.run.example;
  return matchKind(operation, {
    start: () => t('studyPoeaa.data-mapper.model.steps.start'),
    load: ({ id, mapped }) => {
      const row = storage.rows[id];
      const words = { name: nameOf(t, id), format: row?.format ?? 0 };
      return mapped
        ? t('studyPoeaa.data-mapper.model.steps.load', { ...words, steps: row?.steps ?? 0 })
        : t('studyPoeaa.data-mapper.model.steps.refuse', { ...words, formatRead });
    },
    find: ({ id }) => t('studyPoeaa.data-mapper.model.steps.find', { name: nameOf(t, id) }),
    rename: ({ id }) =>
      t('studyPoeaa.data-mapper.model.steps.rename', {
        name: nameOf(t, id),
        renamed: t('studyPoeaa.data-mapper.model.names.ridgeRenamed'),
      }),
    update: ({ id }) => t('studyPoeaa.data-mapper.model.steps.update', { name: nameOf(t, id) }),
    saveAll: ({ written, dropped }) =>
      dropped.length
        ? t('studyPoeaa.data-mapper.model.steps.saveAllDropped', {
            written: namesOf(t, written),
            dropped: namesOf(t, dropped),
          })
        : t('studyPoeaa.data-mapper.model.steps.saveAll', { written: namesOf(t, written) }),
  });
}

/** The line of arithmetic or checking the step's own operation is worth showing. */
function operationLines(t: StudyTranslate, moment: DataMapperMoment): readonly string[] {
  const { operation, storage } = stepAt(moment);
  const { formatRead } = moment.run.example;
  return matchKind(operation, {
    start: () => [],
    load: ({ id, mapped }) => {
      const row = storage.rows[id];
      const words = { name: nameOf(t, id), format: row?.format ?? 0, formatRead };
      return [
        mapped
          ? t('studyPoeaa.data-mapper.model.worked.mapped', { ...words, steps: row?.steps ?? 0 })
          : t('studyPoeaa.data-mapper.model.worked.refused', words),
      ];
    },
    find: ({ id }) => [t('studyPoeaa.data-mapper.model.worked.found', { name: nameOf(t, id) })],
    rename: ({ id }) => [t('studyPoeaa.data-mapper.model.worked.renamed', { name: nameOf(t, id) })],
    update: ({ id }) => [t('studyPoeaa.data-mapper.model.worked.updated', { name: nameOf(t, id) })],
    saveAll: ({ written, dropped }) => [
      t('studyPoeaa.data-mapper.model.worked.savedAll', {
        count: written.length,
        written: namesOf(t, written),
      }),
      t('studyPoeaa.data-mapper.model.worked.dropped', { dropped: namesOf(t, dropped) }),
    ],
  });
}

/** The mapper's identity map, its unmapped rows and the storage counts, then the step's own line. */
function workedOf(t: StudyTranslate, moment: DataMapperMoment): StudyWorkedStep {
  const { mapper, storage } = stepAt(moment);
  const held = compositions.filter((id) => mapper.identityMap[id] !== undefined);
  return {
    title: t('studyPoeaa.data-mapper.model.worked.title', { step: moment.index }),
    lines: [
      t('studyPoeaa.data-mapper.model.worked.identityMap', { names: namesOf(t, held) }),
      t('studyPoeaa.data-mapper.model.worked.unmapped', { names: namesOf(t, mapper.unmapped) }),
      t('studyPoeaa.data-mapper.model.worked.counts', {
        reads: mapper.reads,
        writes: storage.writes,
        rows: Object.keys(storage.rows).length,
      }),
      ...operationLines(t, moment),
    ],
    note: t('studyPoeaa.data-mapper.model.worked.note'),
  };
}

/** The values the record's prose reads at a moment, with the example's own inputs among them. */
function textOf(t: StudyTranslate, moment: DataMapperMoment): StatesMomentText {
  const { mapper, storage } = stepAt(moment);
  const { example } = moment.run;
  return {
    values: {
      ...studyParameterValues(moment.run.parameters, t),
      reads: String(mapper.reads),
      writes: String(storage.writes),
      rows: String(Object.keys(storage.rows).length),
      mapped: String(Object.keys(mapper.identityMap).length),
      dawn:
        example.formatDawn === example.formatRead
          ? t('studyPoeaa.data-mapper.model.values.dawnReadable')
          : t('studyPoeaa.data-mapper.model.values.dawnUnreadable'),
      saving: example.eachRow
        ? t('studyPoeaa.data-mapper.model.values.eachRow')
        : t('studyPoeaa.data-mapper.model.values.wholeLibrary'),
    },
    note: stepNote(t, moment),
    worked: workedOf(t, moment),
    notes: Object.fromEntries(compositions.map((id) => [id, objectNote(t, moment, id)])),
  };
}

const inputsOf = (t: StudyTranslate, example: DataMapperParameters): readonly StudyInput[] => [
  {
    name: 'eachRow',
    label: t('studyPoeaa.data-mapper.model.inputs.eachRow'),
    unit: t('studyPoeaa.data-mapper.model.inputs.choice'),
    min: 0,
    max: 1,
    step: 1,
  },
  {
    name: 'formatDawn',
    label: t('studyPoeaa.data-mapper.model.inputs.formatDawn'),
    unit: t('studyPoeaa.data-mapper.model.inputs.formatRead', { formatRead: example.formatRead }),
    min: 1,
    max: 2,
    step: 1,
  },
];

/** The named moments: the first row mapped, a row refused, the identity map, the edit, the save. */
function momentsOf(t: StudyTranslate, run: DataMapperRun): readonly StudyMoment[] {
  const at = (test: (step: DataMapperStep) => boolean) => run.steps.findIndex(test);
  const refused = at(({ operation }) => operation.kind === 'load' && !operation.mapped);
  const moments: StudyMoment[] = [
    {
      label: t('studyPoeaa.data-mapper.model.moments.mapped'),
      step: at(({ operation }) => operation.kind === 'load' && operation.mapped),
    },
  ];
  if (refused >= 0)
    moments.push({ label: t('studyPoeaa.data-mapper.model.moments.unmapped'), step: refused });
  moments.push(
    {
      label: t('studyPoeaa.data-mapper.model.moments.found'),
      step: at(({ operation }) => operation.kind === 'find'),
    },
    {
      label: t('studyPoeaa.data-mapper.model.moments.edited'),
      step: at(({ operation }) => operation.kind === 'rename'),
    },
    { label: t('studyPoeaa.data-mapper.model.moments.saved'), step: run.steps.length - 1 },
  );
  return moments;
}

/** The run drawn as a register: each composition's row, its place's column, at every step. */
export function present(run: DataMapperRun, t: StudyTranslate): StatesStudyModel {
  return statesModel(
    {
      shape: shapeOf(t),
      snapshots: run.steps.map((_, index) => snapshotOf({ run, index })),
      text: run.steps.map((_, index) => textOf(t, { run, index })),
    },
    {
      moments: momentsOf(t, run),
      inputs: inputsOf(t, run.example),
    },
    t,
  );
}

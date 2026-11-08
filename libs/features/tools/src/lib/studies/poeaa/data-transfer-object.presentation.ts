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
  byteLength,
  type DataTransferParameters,
  type DataTransferStep,
  objectIds,
  transferred,
  type TransferredId,
  type TransferState,
  transferState,
} from './data-transfer-object.simulation';

/** The whole run as the presentation reads it: the example, its steps and the record's inputs. */
export interface DataTransferRun {
  readonly example: DataTransferParameters;
  readonly steps: readonly DataTransferStep[];
  /** Whether the server's objects could have been encoded as they stand, without an assembler. */
  readonly encodesDirectly: boolean;
  readonly parameters: StudyParameters;
}

/** One moment of the run, by its place in the steps. */
interface DataTransferMoment {
  readonly run: DataTransferRun;
  readonly index: number;
}

const stepAt = ({ run, index }: DataTransferMoment) => run.steps[index];

// Each object's name, the machine id it travels under in the words the reader sees it as, and the
// letter its token shows; the compiler requires an entry for every object the example transfers.
const names = {
  actor: 'studyPoeaa.data-transfer-object.model.names.actor',
  build: 'studyPoeaa.data-transfer-object.model.names.build',
  evidence: 'studyPoeaa.data-transfer-object.model.names.evidence',
} as const satisfies Record<TransferredId, string>;
const ids = {
  actor: 'studyPoeaa.data-transfer-object.model.ids.actor',
  build: 'studyPoeaa.data-transfer-object.model.ids.build',
  evidence: 'studyPoeaa.data-transfer-object.model.ids.evidence',
} as const satisfies Record<TransferredId, string>;
const tokens = { actor: 'A', build: 'B', evidence: 'E' } as const satisfies Record<
  TransferredId,
  string
>;

const nameOf = (t: StudyTranslate, id: TransferredId): string => t(names[id]);

const idOf = (t: StudyTranslate, id: TransferredId): string => t(ids[id]);

const versionOf = (t: StudyTranslate, version: number) =>
  t('studyPoeaa.data-transfer-object.model.values.versionName', { version });

const shapeOf = (t: StudyTranslate): StatesShape => ({
  nodes: [
    { id: 'domain', label: t('studyPoeaa.data-transfer-object.model.states.domain') },
    { id: 'dto', label: t('studyPoeaa.data-transfer-object.model.states.dto'), tone: 'subject' },
    { id: 'wire', label: t('studyPoeaa.data-transfer-object.model.states.wire'), tone: 'subject' },
    { id: 'view', label: t('studyPoeaa.data-transfer-object.model.states.view') },
    { id: 'refused', label: t('studyPoeaa.data-transfer-object.model.states.refused') },
  ],
  objects: transferred.map((id) => ({ id, label: nameOf(t, id), key: tokens[id] })),
  transitions: [
    {
      id: 'assemble',
      from: 'domain',
      to: 'dto',
      label: t('studyPoeaa.data-transfer-object.model.operations.assemble'),
    },
    {
      id: 'encode',
      from: 'dto',
      to: 'wire',
      label: t('studyPoeaa.data-transfer-object.model.operations.encode'),
    },
    {
      id: 'decode',
      from: 'wire',
      to: 'view',
      label: t('studyPoeaa.data-transfer-object.model.operations.decode'),
    },
    {
      id: 'decodeRefused',
      from: 'wire',
      to: 'refused',
      label: t('studyPoeaa.data-transfer-object.model.operations.decode'),
    },
  ],
});

// Each of the four transitions joins its own two states, so every move takes its name from them.
const snapshotOf = (step: DataTransferStep): StatesSnapshot => ({
  at: Object.fromEntries(transferred.map((id) => [id, transferState(step, id)])),
});

/** How many cells the page read for an object's row, once it has accepted the document. */
const cellsRead = (step: DataTransferStep, id: TransferredId): number =>
  step.decoded?.read ? (step.decoded.view.cells[objectIds[id]] ?? 0) : 0;

// The words for each object while it is a server object, once it is copied, as the step that
// copies it says, and as that step's worked line puts it. Each message reads only the values it names.
const domainNotes: Readonly<Record<TransferredId, string>> = {
  actor: 'studyPoeaa.data-transfer-object.model.notes.domainActor',
  build: 'studyPoeaa.data-transfer-object.model.notes.domainBuild',
  evidence: 'studyPoeaa.data-transfer-object.model.notes.domainEvidence',
};
const copiedNotes: Readonly<Record<TransferredId, string>> = {
  actor: 'studyPoeaa.data-transfer-object.model.notes.dtoActor',
  build: 'studyPoeaa.data-transfer-object.model.notes.dtoBuild',
  evidence: 'studyPoeaa.data-transfer-object.model.notes.dtoEvidence',
};
const assembleNotes: Readonly<Record<TransferredId, string>> = {
  actor: 'studyPoeaa.data-transfer-object.model.steps.assembleActor',
  build: 'studyPoeaa.data-transfer-object.model.steps.assembleBuild',
  evidence: 'studyPoeaa.data-transfer-object.model.steps.assembleEvidence',
};
const assembleLines: Readonly<Record<TransferredId, string>> = {
  actor: 'studyPoeaa.data-transfer-object.model.worked.actor',
  build: 'studyPoeaa.data-transfer-object.model.worked.build',
  evidence: 'studyPoeaa.data-transfer-object.model.worked.evidence',
};

/** What a message about copying an object may read: the ids references become, and the steps. */
const copyValues = (t: StudyTranslate, moment: DataTransferMoment) => ({
  build: idOf(t, 'build'),
  evidence: idOf(t, 'evidence'),
  steps: moment.run.example.buildSteps,
});

/** The few words beside an object's name: what it holds where it stands now. */
function objectNote(t: StudyTranslate, moment: DataTransferMoment, id: TransferredId): string {
  const step = stepAt(moment);
  const notes: Record<TransferState, () => string> = {
    domain: () => t(domainNotes[id], copyValues(t, moment)),
    dto: () => t(copiedNotes[id], copyValues(t, moment)),
    wire: () =>
      t('studyPoeaa.data-transfer-object.model.notes.wire', { bytes: byteLength(step.text ?? '') }),
    view: () =>
      id === 'evidence'
        ? t('studyPoeaa.data-transfer-object.model.notes.viewEvidence')
        : t('studyPoeaa.data-transfer-object.model.notes.viewRow', { cells: cellsRead(step, id) }),
    refused: () =>
      t('studyPoeaa.data-transfer-object.model.notes.refused', {
        sent: versionOf(t, step.decoded?.sent ?? 0),
      }),
  };
  return notes[transferState(step, id)]();
}

/** The sentence under the drawing: what the assembler, the encoder or the page did at this step. */
function stepNote(t: StudyTranslate, moment: DataTransferMoment): string {
  const { operation, text, decoded } = stepAt(moment);
  const { example } = moment.run;
  return matchKind(operation, {
    start: () => t('studyPoeaa.data-transfer-object.model.steps.start'),
    assemble: ({ id }) => t(assembleNotes[id], copyValues(t, moment)),
    encode: () =>
      t('studyPoeaa.data-transfer-object.model.steps.encode', {
        bytes: byteLength(text ?? ''),
        version: versionOf(t, example.serverVersion),
      }),
    decode: () =>
      decoded?.read
        ? t('studyPoeaa.data-transfer-object.model.steps.decoded', {
            expected: versionOf(t, example.pageVersion),
            build: idOf(t, 'build'),
          })
        : t('studyPoeaa.data-transfer-object.model.steps.refused', {
            expected: versionOf(t, example.pageVersion),
            sent: versionOf(t, decoded?.sent ?? 0),
          }),
  });
}

/** The line the worked step adds for what this step did. */
function operationLine(t: StudyTranslate, moment: DataTransferMoment): string {
  const { operation, text, decoded, assembled } = stepAt(moment);
  return matchKind(operation, {
    start: () =>
      moment.run.encodesDirectly
        ? t('studyPoeaa.data-transfer-object.model.worked.direct')
        : t('studyPoeaa.data-transfer-object.model.worked.cycle'),
    assemble: ({ id }) => t(assembleLines[id], copyValues(t, moment)),
    encode: () =>
      t('studyPoeaa.data-transfer-object.model.worked.bytes', {
        bytes: byteLength(text ?? ''),
        objects: assembled.length,
      }),
    decode: () =>
      t('studyPoeaa.data-transfer-object.model.worked.check', {
        sent: versionOf(t, decoded?.sent ?? 0),
        expected: versionOf(t, moment.run.example.pageVersion),
      }),
  });
}

/** The transfer object at this moment, as the mechanism's worked lines. */
function workedOf(t: StudyTranslate, moment: DataTransferMoment): StudyWorkedStep {
  const { transfer, decoded } = stepAt(moment);
  const rows = Object.values(transfer.panels).reduce((sum, list) => sum + list.length, 0);
  const lines = [
    operationLine(t, moment),
    t('studyPoeaa.data-transfer-object.model.worked.rows', {
      rows,
      entries: transfer.evidence.length,
    }),
  ];
  if (decoded?.read)
    lines.push(
      t('studyPoeaa.data-transfer-object.model.worked.links', {
        resolved: decoded.view.resolved.length,
        links: decoded.view.resolved.length + decoded.view.dangling.length,
      }),
    );
  return {
    title: t('studyPoeaa.data-transfer-object.model.worked.title', { step: moment.index }),
    lines,
    note: t('studyPoeaa.data-transfer-object.model.worked.note'),
  };
}

/** The values the record's prose reads at a moment, with the example's own inputs among them. */
function textOf(t: StudyTranslate, moment: DataTransferMoment): StatesMomentText {
  const { text } = stepAt(moment);
  const { example } = moment.run;
  return {
    values: {
      ...studyParameterValues(moment.run.parameters, t),
      encoded:
        text === null
          ? t('studyPoeaa.data-transfer-object.model.values.notYet')
          : t('studyPoeaa.data-transfer-object.model.values.encoded', {
              bytes: byteLength(text),
              version: versionOf(t, example.serverVersion),
            }),
    },
    note: stepNote(t, moment),
    worked: workedOf(t, moment),
    notes: Object.fromEntries(transferred.map((id) => [id, objectNote(t, moment, id)])),
  };
}

const inputsOf = (t: StudyTranslate): readonly StudyInput[] => [
  {
    name: 'serverVersion',
    label: t('studyPoeaa.data-transfer-object.model.inputs.serverVersion'),
    unit: t('studyPoeaa.data-transfer-object.model.inputs.version'),
    min: 1,
    max: 2,
    step: 1,
  },
];

/** The named moments: the server's objects, the first copy, the encoding and the page's verdict. */
function momentsOf(t: StudyTranslate, run: DataTransferRun): readonly StudyMoment[] {
  const last = run.steps[run.steps.length - 1];
  const encoded = run.steps.findIndex(({ operation }) => operation.kind === 'encode');
  return [
    { label: t('studyPoeaa.data-transfer-object.model.moments.domain'), step: 0 },
    { label: t('studyPoeaa.data-transfer-object.model.moments.assembled'), step: 1 },
    { label: t('studyPoeaa.data-transfer-object.model.moments.encoded'), step: encoded },
    {
      label: last.decoded?.read
        ? t('studyPoeaa.data-transfer-object.model.moments.decoded')
        : t('studyPoeaa.data-transfer-object.model.moments.refused'),
      step: run.steps.length - 1,
    },
  ];
}

/** The run drawn as a register: each object's row, the column of where it stands, at every step. */
export function present(run: DataTransferRun, t: StudyTranslate): StatesStudyModel {
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

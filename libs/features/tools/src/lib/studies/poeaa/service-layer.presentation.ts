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
  type ClientKind,
  type CompositionName,
  type DraftName,
  drafts,
  highestId,
  type SavedComposition,
  type SaveStage,
  type ServiceLayerParameters,
  type ServiceLayerStep,
  stageOf,
  type TabId,
} from './service-layer.simulation';

/** The whole run as the presentation reads it: the example, its steps and the record's inputs. */
export interface ServiceLayerRun {
  readonly example: ServiceLayerParameters;
  readonly steps: readonly ServiceLayerStep[];
  readonly parameters: StudyParameters;
}

/** One moment of the run, by its index. */
interface ServiceLayerMoment {
  readonly run: ServiceLayerRun;
  readonly index: number;
}

const stepAt = ({ run, index }: ServiceLayerMoment) => run.steps[index];

// Each composition's name, the letter each saved composition's token shows, and each tab's and
// each kind of client's name; the compiler requires an entry for every one the example has.
const names = {
  flank: 'studyPoeaa.service-layer.model.names.flank',
  ridge: 'studyPoeaa.service-layer.model.names.ridge',
  night: 'studyPoeaa.service-layer.model.names.night',
  dawn: 'studyPoeaa.service-layer.model.names.dawn',
  river: 'studyPoeaa.service-layer.model.names.river',
} as const satisfies Record<CompositionName, string>;
const tokens = { night: 'N', dawn: 'D', river: 'R' } as const satisfies Record<DraftName, string>;
const tabNames = {
  a: 'studyPoeaa.service-layer.model.tabs.a',
  b: 'studyPoeaa.service-layer.model.tabs.b',
} as const satisfies Record<TabId, string>;
const clientNames = {
  saveButton: 'studyPoeaa.service-layer.model.clients.saveButton',
  importBox: 'studyPoeaa.service-layer.model.clients.importBox',
} as const satisfies Record<ClientKind, string>;

const nameOf = (t: StudyTranslate, name: CompositionName): string => t(names[name]);

const namesOf = (t: StudyTranslate, list: readonly CompositionName[]) =>
  listOf(
    t,
    list.map((name) => nameOf(t, name)),
  );

const tabOf = (t: StudyTranslate, tab: TabId) => t(tabNames[tab]);

const clientOf = (t: StudyTranslate, client: ClientKind) => t(clientNames[client]);

const idOf = (t: StudyTranslate, id: number) =>
  t('studyPoeaa.service-layer.model.composition', { id });

/** A stored list in words: each composition's name with its id. */
const savedList = (t: StudyTranslate, list: readonly SavedComposition[]) =>
  listOf(
    t,
    list.map(({ name, id }) =>
      t('studyPoeaa.service-layer.model.named', { name: nameOf(t, name), id: idOf(t, id) }),
    ),
  );

const shapeOf = (t: StudyTranslate): StatesShape => ({
  nodes: [
    { id: 'draft', label: t('studyPoeaa.service-layer.model.stages.draft') },
    {
      id: 'accepted',
      label: t('studyPoeaa.service-layer.model.stages.accepted'),
      tone: 'subject',
    },
    { id: 'stored', label: t('studyPoeaa.service-layer.model.stages.stored'), tone: 'subject' },
    {
      id: 'announced',
      label: t('studyPoeaa.service-layer.model.stages.announced'),
      tone: 'subject',
    },
    { id: 'refused', label: t('studyPoeaa.service-layer.model.stages.refused'), tone: 'subject' },
  ],
  objects: drafts.map((name) => ({ id: name, label: nameOf(t, name), key: tokens[name] })),
  transitions: [
    {
      id: 'check',
      from: 'draft',
      to: 'accepted',
      label: t('studyPoeaa.service-layer.model.operations.check'),
    },
    {
      id: 'refuse',
      from: 'draft',
      to: 'refused',
      label: t('studyPoeaa.service-layer.model.operations.check'),
    },
    {
      id: 'write',
      from: 'accepted',
      to: 'stored',
      label: t('studyPoeaa.service-layer.model.operations.setItem'),
    },
    {
      id: 'announce',
      from: 'stored',
      to: 'announced',
      label: t('studyPoeaa.service-layer.model.operations.announce'),
    },
    {
      id: 'writeDirect',
      from: 'draft',
      to: 'stored',
      label: t('studyPoeaa.service-layer.model.operations.directSetItem'),
    },
    {
      id: 'overwritten',
      from: 'announced',
      to: null,
      label: t('studyPoeaa.service-layer.model.operations.directSetItem'),
    },
  ],
});

// Each of the six transitions joins its own two stages, so every move takes its name from them.
const snapshotOf = (step: ServiceLayerStep): StatesSnapshot => ({
  at: Object.fromEntries(drafts.map((name) => [name, stageOf(step.state, name)])),
});

/** The id a composition has in storage, or in the save still in progress for it. */
function heldId(step: ServiceLayerStep, name: DraftName): number {
  const { stored, pending } = step.state;
  const saved =
    stored.find((each) => each.name === name) ??
    Object.values(pending).find((each) => each?.composition.name === name)?.composition;
  return saved?.id ?? 0;
}

/** The few words beside a composition's name: where it waits, or its id and who lists it. */
function objectNote(t: StudyTranslate, moment: ServiceLayerMoment, name: DraftName): string | null {
  const step = stepAt(moment);
  const stage = stageOf(step.state, name);
  if (stage === null) return null;
  const id = idOf(t, heldId(step, name));
  const ownTab = tabOf(t, name === 'dawn' ? 'b' : 'a');
  const notes: Record<SaveStage, () => string> = {
    draft: () => {
      if (name !== 'river')
        return t('studyPoeaa.service-layer.model.notes.unsaved', { tab: ownTab });
      return moment.run.example.importForeign
        ? t('studyPoeaa.service-layer.model.notes.foreignExport')
        : t('studyPoeaa.service-layer.model.notes.export', { tab: ownTab });
    },
    accepted: () => t('studyPoeaa.service-layer.model.notes.accepted', { id }),
    stored: () => t('studyPoeaa.service-layer.model.notes.stored', { id }),
    refused: () => t('studyPoeaa.service-layer.model.notes.refused'),
    announced: () => {
      const tabs = (['a', 'b'] as const).filter((tab) =>
        step.state.listed[tab].some((each) => each.name === name),
      );
      return t('studyPoeaa.service-layer.model.notes.announced', {
        id,
        tabs: listOf(
          t,
          tabs.map((tab) => tabOf(t, tab)),
        ),
      });
    },
  };
  return notes[stage]();
}

/** The sentence under the drawing: what the client asked and which part answered. */
function stepNote(t: StudyTranslate, moment: ServiceLayerMoment): string {
  const { operation, state } = stepAt(moment);
  if (operation.kind === 'start') return t('studyPoeaa.service-layer.model.steps.start');
  const { tab, client, draft } = operation.call;
  const words = {
    tab: tabOf(t, tab),
    client: clientOf(t, client),
    name: nameOf(t, draft.name),
    id: idOf(t, heldId(stepAt(moment), draft.name)),
    count: state.stored.length,
  };
  return matchKind(operation, {
    check: ({ verdict, read }) =>
      verdict.kind === 'accepted'
        ? t('studyPoeaa.service-layer.model.steps.check', { ...words, count: read.length })
        : t('studyPoeaa.service-layer.model.steps.refuse', words),
    write: () => t('studyPoeaa.service-layer.model.steps.write', words),
    announce: () => t('studyPoeaa.service-layer.model.steps.announce', words),
    writeDirect: ({ lost }) => {
      const overwrote = { ...words, lost: namesOf(t, lost) };
      return draft.ownScene
        ? t('studyPoeaa.service-layer.model.steps.writeDirect', overwrote)
        : t('studyPoeaa.service-layer.model.steps.writeDirectForeign', overwrote);
    },
  });
}

/** The lines the operation itself worked out at this step, in the order it did them. */
function operationLines(t: StudyTranslate, moment: ServiceLayerMoment): readonly string[] {
  const step = stepAt(moment);
  const { operation, state } = step;
  if (operation.kind === 'start') return [];
  const name = nameOf(t, operation.call.draft.name);
  const id = idOf(t, heldId(step, operation.call.draft.name));
  return matchKind(operation, {
    check: ({ read, verdict, call }) => {
      const readLine = t('studyPoeaa.service-layer.model.worked.read', {
        names: savedList(t, read),
      });
      if (verdict.kind === 'refused')
        return [readLine, t('studyPoeaa.service-layer.model.worked.otherScene')];
      const highest = t('studyPoeaa.service-layer.model.worked.highest', {
        highest: highestId(read),
        name,
        id,
      });
      return call.client === 'importBox'
        ? [readLine, t('studyPoeaa.service-layer.model.worked.sameScene'), highest]
        : [readLine, highest];
    },
    write: () => [
      t('studyPoeaa.service-layer.model.worked.write', { count: state.stored.length, name }),
    ],
    announce: ({ call }) => [
      t('studyPoeaa.service-layer.model.worked.announce', { tab: tabOf(t, call.tab), name }),
    ],
    writeDirect: ({ call, held, lost }) => [
      t('studyPoeaa.service-layer.model.worked.held', {
        tab: tabOf(t, call.tab),
        names: savedList(t, held),
      }),
      t('studyPoeaa.service-layer.model.worked.directId', { highest: highestId(held), name, id }),
      t('studyPoeaa.service-layer.model.worked.direct', { count: state.stored.length, name }),
      t('studyPoeaa.service-layer.model.worked.lost', { names: namesOf(t, lost) }),
    ],
  });
}

/** Why the step matters for the pattern, in one line beside the worked lines. */
function workedNote(t: StudyTranslate, step: ServiceLayerStep): string {
  return matchKind(step.operation, {
    start: () => t('studyPoeaa.service-layer.model.worked.notes.start'),
    check: ({ verdict }) =>
      verdict.kind === 'accepted'
        ? t('studyPoeaa.service-layer.model.worked.notes.check')
        : t('studyPoeaa.service-layer.model.worked.notes.refuse'),
    write: () => t('studyPoeaa.service-layer.model.worked.notes.write'),
    announce: () => t('studyPoeaa.service-layer.model.worked.notes.announce'),
    writeDirect: () => t('studyPoeaa.service-layer.model.worked.notes.writeDirect'),
  });
}

/** The operation's own lines, then storage, both tabs' lists and the writes so far. */
function workedOf(t: StudyTranslate, moment: ServiceLayerMoment): StudyWorkedStep {
  const step = stepAt(moment);
  const { stored, listed, writes } = step.state;
  return {
    title: t('studyPoeaa.service-layer.model.worked.title', { step: moment.index }),
    lines: [
      ...operationLines(t, moment),
      t('studyPoeaa.service-layer.model.worked.storage', { names: savedList(t, stored) }),
      t('studyPoeaa.service-layer.model.worked.listed', {
        tab: tabOf(t, 'a'),
        names: savedList(t, listed.a),
      }),
      t('studyPoeaa.service-layer.model.worked.listed', {
        tab: tabOf(t, 'b'),
        names: savedList(t, listed.b),
      }),
      t('studyPoeaa.service-layer.model.worked.writes', { writes }),
    ],
    note: workedNote(t, step),
  };
}

/** The values the record's prose reads at a moment, with the example's own inputs among them. */
function textOf(t: StudyTranslate, moment: ServiceLayerMoment): StatesMomentText {
  const { example, parameters } = moment.run;
  const { stored, writes } = stepAt(moment).state;
  return {
    values: {
      ...studyParameterValues(parameters, t),
      stored: savedList(t, stored),
      writes: String(writes),
      importFile: example.importForeign
        ? t('studyPoeaa.service-layer.model.values.foreignFile')
        : t('studyPoeaa.service-layer.model.values.ownFile'),
      importRoute: example.importBypasses
        ? t('studyPoeaa.service-layer.model.values.bypass')
        : t('studyPoeaa.service-layer.model.values.service'),
    },
    note: stepNote(t, moment),
    worked: workedOf(t, moment),
    notes: Object.fromEntries(drafts.map((name) => [name, objectNote(t, moment, name)])),
  };
}

const inputsOf = (t: StudyTranslate): readonly StudyInput[] => [
  {
    name: 'importBypasses',
    label: t('studyPoeaa.service-layer.model.inputs.importBypasses'),
    unit: t('studyPoeaa.service-layer.model.inputs.ofOne'),
    min: 0,
    max: 1,
    step: 1,
  },
  {
    name: 'importForeign',
    label: t('studyPoeaa.service-layer.model.inputs.importForeign'),
    unit: t('studyPoeaa.service-layer.model.inputs.ofOne'),
    min: 0,
    max: 1,
    step: 1,
  },
];

/** The named moments: the first check and announcement, the other tab's save and the import. */
function momentsOf(t: StudyTranslate, run: ServiceLayerRun): readonly StudyMoment[] {
  const first = (found: (step: ServiceLayerStep) => boolean) => run.steps.findIndex(found);
  return [
    {
      label: t('studyPoeaa.service-layer.model.moments.check'),
      step: first(({ operation }) => operation.kind === 'check'),
    },
    {
      label: t('studyPoeaa.service-layer.model.moments.announce'),
      step: first(({ operation }) => operation.kind === 'announce'),
    },
    {
      label: t('studyPoeaa.service-layer.model.moments.otherTab'),
      step: first(({ operation }) => 'call' in operation && operation.call.tab === 'b'),
    },
    {
      label: t('studyPoeaa.service-layer.model.moments.import'),
      step: first(({ operation }) => 'call' in operation && operation.call.client === 'importBox'),
    },
  ];
}

/** The run drawn as a register: each saved composition's row, its stage's column, at every step. */
export function present(run: ServiceLayerRun, t: StudyTranslate): StatesStudyModel {
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

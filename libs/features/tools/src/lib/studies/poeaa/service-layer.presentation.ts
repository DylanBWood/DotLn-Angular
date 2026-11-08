import type { StudyParameters } from '@dotln-angular/models';

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
  type ClientKind,
  type CompositionName,
  type DraftName,
  drafts,
  highestId,
  type SavedComposition,
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

function nameOf(t: StudyTranslate, name: CompositionName): string {
  switch (name) {
    case 'flank':
      return t('studyPoeaa.service-layer.model.names.flank');
    case 'ridge':
      return t('studyPoeaa.service-layer.model.names.ridge');
    case 'night':
      return t('studyPoeaa.service-layer.model.names.night');
    case 'dawn':
      return t('studyPoeaa.service-layer.model.names.dawn');
    default:
      return t('studyPoeaa.service-layer.model.names.river');
  }
}

const tabOf = (t: StudyTranslate, tab: TabId) =>
  tab === 'a'
    ? t('studyPoeaa.service-layer.model.tabs.a')
    : t('studyPoeaa.service-layer.model.tabs.b');

const clientOf = (t: StudyTranslate, client: ClientKind) =>
  client === 'saveButton'
    ? t('studyPoeaa.service-layer.model.clients.saveButton')
    : t('studyPoeaa.service-layer.model.clients.importBox');

const idOf = (t: StudyTranslate, id: number) =>
  t('studyPoeaa.service-layer.model.composition', { id });

const listOf = (t: StudyTranslate, items: readonly string[]) =>
  items.length ? items.join(t('studyCommon.states.listSeparator')) : t('studyCommon.states.empty');

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
  objects: drafts.map((name) => ({
    id: name,
    label: nameOf(t, name),
    key: name === 'night' ? 'N' : name === 'dawn' ? 'D' : 'R',
  })),
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

const isDraft = (name: CompositionName): name is DraftName =>
  drafts.some((draft) => draft === name);

/** Which transition each composition took at a step, by the operation that ran. */
function tookAt(step: ServiceLayerStep): Readonly<Record<string, string>> {
  const { operation } = step;
  switch (operation.kind) {
    case 'check':
      return {
        [operation.call.draft.name]: operation.verdict.kind === 'accepted' ? 'check' : 'refuse',
      };
    case 'write':
    case 'announce':
      return { [operation.call.draft.name]: operation.kind };
    case 'writeDirect':
      return Object.fromEntries([
        [operation.call.draft.name, 'writeDirect'],
        ...operation.lost.filter(isDraft).map((name) => [name, 'overwritten']),
      ]);
    default:
      return {};
  }
}

const snapshotOf = (step: ServiceLayerStep): StatesSnapshot => ({
  at: Object.fromEntries(
    drafts.flatMap((name) => {
      const stage = stageOf(step.state, name);
      return stage === null ? [] : [[name, stage]];
    }),
  ),
  took: tookAt(step),
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
  const id = idOf(t, heldId(step, name));
  const ownTab = tabOf(t, name === 'dawn' ? 'b' : 'a');
  switch (stage) {
    case null:
      return null;
    case 'draft':
      if (name !== 'river')
        return t('studyPoeaa.service-layer.model.notes.unsaved', { tab: ownTab });
      return moment.run.example.importForeign > 0
        ? t('studyPoeaa.service-layer.model.notes.foreignExport')
        : t('studyPoeaa.service-layer.model.notes.export', { tab: ownTab });
    case 'accepted':
      return t('studyPoeaa.service-layer.model.notes.accepted', { id });
    case 'stored':
      return t('studyPoeaa.service-layer.model.notes.stored', { id });
    case 'refused':
      return t('studyPoeaa.service-layer.model.notes.refused');
    default: {
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
    }
  }
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
  switch (operation.kind) {
    case 'check':
      return operation.verdict.kind === 'accepted'
        ? t('studyPoeaa.service-layer.model.steps.check', {
            ...words,
            count: operation.read.length,
          })
        : t('studyPoeaa.service-layer.model.steps.refuse', words);
    case 'write':
      return t('studyPoeaa.service-layer.model.steps.write', words);
    case 'announce':
      return t('studyPoeaa.service-layer.model.steps.announce', words);
    default: {
      const lost = {
        ...words,
        lost: listOf(
          t,
          operation.lost.map((name) => nameOf(t, name)),
        ),
      };
      return draft.ownScene
        ? t('studyPoeaa.service-layer.model.steps.writeDirect', lost)
        : t('studyPoeaa.service-layer.model.steps.writeDirectForeign', lost);
    }
  }
}

/** The lines the operation itself worked out at this step, in the order it did them. */
function operationLines(t: StudyTranslate, moment: ServiceLayerMoment): readonly string[] {
  const step = stepAt(moment);
  const { operation, state } = step;
  if (operation.kind === 'start') return [];
  const name = nameOf(t, operation.call.draft.name);
  const id = idOf(t, heldId(step, operation.call.draft.name));
  switch (operation.kind) {
    case 'check': {
      const read = t('studyPoeaa.service-layer.model.worked.read', {
        names: savedList(t, operation.read),
      });
      if (operation.verdict.kind === 'refused')
        return [read, t('studyPoeaa.service-layer.model.worked.otherScene')];
      const highest = t('studyPoeaa.service-layer.model.worked.highest', {
        highest: highestId(operation.read),
        name,
        id,
      });
      return operation.call.client === 'importBox'
        ? [read, t('studyPoeaa.service-layer.model.worked.sameScene'), highest]
        : [read, highest];
    }
    case 'write':
      return [
        t('studyPoeaa.service-layer.model.worked.write', { count: state.stored.length, name }),
      ];
    case 'announce':
      return [
        t('studyPoeaa.service-layer.model.worked.announce', {
          tab: tabOf(t, operation.call.tab),
          name,
        }),
      ];
    default:
      return [
        t('studyPoeaa.service-layer.model.worked.held', {
          tab: tabOf(t, operation.call.tab),
          names: savedList(t, operation.held),
        }),
        t('studyPoeaa.service-layer.model.worked.directId', {
          highest: highestId(operation.held),
          name,
          id,
        }),
        t('studyPoeaa.service-layer.model.worked.direct', { count: state.stored.length, name }),
        t('studyPoeaa.service-layer.model.worked.lost', {
          names: listOf(
            t,
            operation.lost.map((lost) => nameOf(t, lost)),
          ),
        }),
      ];
  }
}

/** Why the step matters for the pattern, in one line beside the worked lines. */
function workedNote(t: StudyTranslate, step: ServiceLayerStep): string {
  const { operation } = step;
  switch (operation.kind) {
    case 'start':
      return t('studyPoeaa.service-layer.model.worked.notes.start');
    case 'check':
      return operation.verdict.kind === 'accepted'
        ? t('studyPoeaa.service-layer.model.worked.notes.check')
        : t('studyPoeaa.service-layer.model.worked.notes.refuse');
    case 'write':
      return t('studyPoeaa.service-layer.model.worked.notes.write');
    case 'announce':
      return t('studyPoeaa.service-layer.model.worked.notes.announce');
    default:
      return t('studyPoeaa.service-layer.model.worked.notes.writeDirect');
  }
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
  const notes = Object.fromEntries(
    drafts.flatMap((name) => {
      const note = objectNote(t, moment, name);
      return note === null ? [] : [[name, note]];
    }),
  );
  return {
    values: {
      ...studyParameterValues(parameters, t),
      stored: savedList(t, stored),
      writes: String(writes),
      importFile:
        example.importForeign > 0
          ? t('studyPoeaa.service-layer.model.values.foreignFile')
          : t('studyPoeaa.service-layer.model.values.ownFile'),
      importRoute:
        example.importBypasses > 0
          ? t('studyPoeaa.service-layer.model.values.bypass')
          : t('studyPoeaa.service-layer.model.values.service'),
    },
    note: stepNote(t, moment),
    worked: workedOf(t, moment),
    notes,
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

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
  collisionsIn,
  type CompositionId,
  compositions,
  highestKey,
  type IdentityFieldOperation,
  type IdentityFieldParameters,
  type IdentityFieldStep,
  isStored,
  type KeyedComposition,
  keyOf,
  open,
  type Scene,
  sharersOf,
  type TabId,
  tabs,
} from './identity-field.simulation';

/** The whole run as the presentation reads it: the example, its steps and the record's inputs. */
export interface IdentityFieldRun {
  readonly example: IdentityFieldParameters;
  readonly steps: readonly IdentityFieldStep[];
  readonly parameters: StudyParameters;
}

/** One moment of the run, by its place in the run. */
interface IdentityFieldMoment {
  readonly run: IdentityFieldRun;
  readonly index: number;
}

type SaveOperation = Extract<IdentityFieldOperation, { readonly kind: 'save' }>;
type OpenOperation = Extract<IdentityFieldOperation, { readonly kind: 'open' }>;

const stepAt = ({ run, index }: IdentityFieldMoment) => run.steps[index];

function nameOf(t: StudyTranslate, id: CompositionId): string {
  switch (id) {
    case 'flank':
      return t('studyPoeaa.identity-field.model.names.flank');
    case 'ridge':
      return t('studyPoeaa.identity-field.model.names.ridge');
    case 'dawn':
      return t('studyPoeaa.identity-field.model.names.dawn');
    default:
      return t('studyPoeaa.identity-field.model.names.night');
  }
}

const tabOf = (t: StudyTranslate, tab: TabId) =>
  tab === 'here'
    ? t('studyPoeaa.identity-field.model.tabs.here')
    : t('studyPoeaa.identity-field.model.tabs.other');

/** A key as the scene writes it, through the message that owns its prefix. */
const keyText = (t: StudyTranslate, key: number) =>
  t('studyPoeaa.identity-field.model.key', { number: key });

const joined = (t: StudyTranslate, words: readonly string[]) =>
  words.length ? words.join(t('studyCommon.states.listSeparator')) : t('studyCommon.states.empty');

const keysIn = (t: StudyTranslate, list: readonly KeyedComposition[]) =>
  joined(
    t,
    list.map(({ key }) => keyText(t, key)),
  );

const shapeOf = (t: StudyTranslate): StatesShape => ({
  nodes: [
    { id: 'unkeyed', label: t('studyPoeaa.identity-field.model.standings.unkeyed') },
    {
      id: 'own',
      label: t('studyPoeaa.identity-field.model.standings.own'),
      tone: 'subject',
    },
    {
      id: 'shared',
      label: t('studyPoeaa.identity-field.model.standings.shared'),
      tone: 'subject',
    },
  ],
  objects: compositions.map((id) => ({
    id,
    label: nameOf(t, id),
    key: { flank: 'F', ridge: 'R', dawn: 'D', night: 'N' }[id],
  })),
  transitions: [
    {
      id: 'compose',
      from: null,
      to: 'unkeyed',
      label: t('studyPoeaa.identity-field.model.operations.compose'),
    },
    {
      id: 'save',
      from: 'unkeyed',
      to: 'own',
      label: t('studyPoeaa.identity-field.model.operations.save'),
    },
    {
      id: 'saveShared',
      from: 'unkeyed',
      to: 'shared',
      label: t('studyPoeaa.identity-field.model.operations.save'),
    },
    {
      id: 'keyTaken',
      from: 'own',
      to: 'shared',
      label: t('studyPoeaa.identity-field.model.operations.keyTaken'),
    },
    {
      id: 'open',
      from: 'own',
      to: 'own',
      label: t('studyPoeaa.identity-field.model.operations.open'),
    },
    {
      id: 'openShared',
      from: 'shared',
      to: 'shared',
      label: t('studyPoeaa.identity-field.model.operations.open'),
    },
  ],
});

/** Where a composition stands: a draft without a key, holding a key alone, or sharing it. */
type Standing = 'unkeyed' | 'own' | 'shared';

/** A composition's standing after a step; null for one not yet made. */
function standingOf(scene: Scene, id: CompositionId): Standing | null {
  if (Object.values(scene.tabs).some(({ drafts }) => drafts.includes(id))) return 'unkeyed';
  if (keyOf(scene, id) === null) return null;
  return sharersOf(scene, id).length ? 'shared' : 'own';
}

/** Which transition each composition took at a step, read from the operation and where it ends up. */
function tookAt(moment: IdentityFieldMoment): Readonly<Record<string, string>> {
  const { operation, scene } = stepAt(moment);
  switch (operation.kind) {
    case 'compose':
      return Object.fromEntries(operation.made.map(({ id }) => [id, 'compose']));
    case 'save': {
      const before = moment.run.steps[moment.index - 1].scene;
      const taken = compositions.filter(
        (id) =>
          id !== operation.id &&
          standingOf(before, id) === 'own' &&
          standingOf(scene, id) === 'shared',
      );
      return {
        [operation.id]: standingOf(scene, operation.id) === 'own' ? 'save' : 'saveShared',
        ...Object.fromEntries(taken.map((id) => [id, 'keyTaken'])),
      };
    }
    case 'open':
      if (operation.found === null) return {};
      return {
        [operation.found]: standingOf(scene, operation.found) === 'own' ? 'open' : 'openShared',
      };
    default:
      return {};
  }
}

/** Where every composition made so far stands after a step, and how it got there. */
function snapshotOf(moment: IdentityFieldMoment): StatesSnapshot {
  const { scene } = stepAt(moment);
  return {
    at: Object.fromEntries(
      compositions.flatMap((id) => {
        const standing = standingOf(scene, id);
        return standing === null ? [] : [[id, standing]];
      }),
    ),
    took: tookAt(moment),
  };
}

/** The few words beside a composition's name: its key, who else holds it, whether it is stored. */
function objectNote(t: StudyTranslate, scene: Scene, id: CompositionId): string | null {
  const standing = standingOf(scene, id);
  if (standing === null) return null;
  const key = keyOf(scene, id);
  if (standing === 'unkeyed' || key === null)
    return t('studyPoeaa.identity-field.model.notes.noKey');
  const number = keyText(t, key);
  const sharers = sharersOf(scene, id);
  if (!sharers.length)
    return isStored(scene, id)
      ? t('studyPoeaa.identity-field.model.notes.own', { key: number })
      : t('studyPoeaa.identity-field.model.notes.ownUnstored', { key: number });
  const words = {
    key: number,
    other: joined(
      t,
      sharers.map((each) => nameOf(t, each)),
    ),
  };
  return isStored(scene, id)
    ? t('studyPoeaa.identity-field.model.notes.shared', words)
    : t('studyPoeaa.identity-field.model.notes.sharedUnstored', words);
}

/** The composition a chosen key already belonged to before this save, if any. */
function holderBefore(moment: IdentityFieldMoment, operation: SaveOperation): CompositionId | null {
  const before = moment.run.steps[moment.index - 1].scene;
  return (
    compositions.find((id) => id !== operation.id && keyOf(before, id) === operation.key) ?? null
  );
}

/** At a save, how the key was chosen and whether it was free; at an open, what the key found. */
function keyingOf(t: StudyTranslate, moment: IdentityFieldMoment): string {
  const { operation, scene } = stepAt(moment);
  if (operation.kind === 'open') return openSentence(t, scene, operation);
  if (operation.kind !== 'save') return t('studyPoeaa.identity-field.model.keying.none');
  const holder = holderBefore(moment, operation);
  const words = {
    tab: tabOf(t, operation.tab),
    name: nameOf(t, operation.id),
    highest: highestKey(operation.read),
    key: keyText(t, operation.key),
  };
  if (holder === null)
    return operation.reread
      ? t('studyPoeaa.identity-field.model.keying.rereadFree', words)
      : t('studyPoeaa.identity-field.model.keying.heldFree', words);
  const taken = { ...words, holder: nameOf(t, holder) };
  return operation.reread
    ? t('studyPoeaa.identity-field.model.keying.rereadTaken', taken)
    : t('studyPoeaa.identity-field.model.keying.heldTaken', taken);
}

/** At an open, what the key found and whether any other composition holds the same key. */
function openSentence(t: StudyTranslate, scene: Scene, operation: OpenOperation): string {
  const words = { tab: tabOf(t, operation.tab), key: keyText(t, operation.key) };
  if (operation.found === null) return t('studyPoeaa.identity-field.model.keying.openNone', words);
  const sharers = sharersOf(scene, operation.found);
  const found = { ...words, name: nameOf(t, operation.found) };
  return sharers.length
    ? t('studyPoeaa.identity-field.model.keying.openShared', {
        ...found,
        other: joined(
          t,
          sharers.map((id) => nameOf(t, id)),
        ),
      })
    : t('studyPoeaa.identity-field.model.keying.openOwn', found);
}

/** The sentence under the drawing: what the operator or a tab did at this step. */
function stepNote(t: StudyTranslate, moment: IdentityFieldMoment): string {
  const { operation, scene } = stepAt(moment);
  switch (operation.kind) {
    case 'start':
      return t('studyPoeaa.identity-field.model.steps.start');
    case 'compose':
      return t('studyPoeaa.identity-field.model.steps.compose');
    case 'save': {
      const holder = holderBefore(moment, operation);
      const words = {
        tab: tabOf(t, operation.tab),
        name: nameOf(t, operation.id),
        key: keyText(t, operation.key),
      };
      if (holder === null) return t('studyPoeaa.identity-field.model.steps.saved', words);
      const taken = { ...words, holder: nameOf(t, holder) };
      return isStored(scene, holder)
        ? t('studyPoeaa.identity-field.model.steps.collided', taken)
        : t('studyPoeaa.identity-field.model.steps.collidedDropped', taken);
    }
    default:
      return openNote(t, scene, operation);
  }
}

/** What an open found, and what the same key opens in the other tab when it names another. */
function openNote(t: StudyTranslate, scene: Scene, operation: OpenOperation): string {
  const words = { tab: tabOf(t, operation.tab), key: keyText(t, operation.key) };
  if (operation.found === null) return t('studyPoeaa.identity-field.model.steps.openedNone', words);
  const found = { ...words, name: nameOf(t, operation.found) };
  const elsewhere = tabs.find((tab) => tab !== operation.tab) ?? operation.tab;
  const there = open(scene, elsewhere, operation.key);
  if (there === null || there === operation.found)
    return t('studyPoeaa.identity-field.model.steps.opened', found);
  return t('studyPoeaa.identity-field.model.steps.openedShared', {
    ...found,
    where:
      elsewhere === 'here'
        ? t('studyPoeaa.identity-field.model.where.here')
        : t('studyPoeaa.identity-field.model.where.other'),
    other: nameOf(t, there),
  });
}

/** The key arithmetic of a save, the list an open searched, or the stored list at any other step. */
function workedOf(t: StudyTranslate, moment: IdentityFieldMoment): StudyWorkedStep {
  const { operation, scene } = stepAt(moment);
  const title = t('studyPoeaa.identity-field.model.worked.title', { step: moment.index });
  const collisions = t('studyPoeaa.identity-field.model.worked.collisions', {
    collisions: collisionsIn(scene),
  });
  if (operation.kind === 'open') {
    const list = scene.tabs[operation.tab].list;
    return {
      title,
      lines: [
        t('studyPoeaa.identity-field.model.worked.searched', {
          tab: tabOf(t, operation.tab),
          keys: keysIn(t, list),
        }),
        operation.found === null
          ? t('studyPoeaa.identity-field.model.worked.foundNone', {
              key: keyText(t, operation.key),
            })
          : t('studyPoeaa.identity-field.model.worked.found', {
              key: keyText(t, operation.key),
              name: nameOf(t, operation.found),
            }),
        collisions,
      ],
    };
  }
  if (operation.kind !== 'save')
    return {
      title,
      lines: [
        t('studyPoeaa.identity-field.model.worked.stored', { keys: keysIn(t, scene.storage) }),
        collisions,
      ],
    };
  const holder = holderBefore(moment, operation);
  return {
    title,
    lines: [
      t('studyPoeaa.identity-field.model.worked.read', { keys: keysIn(t, operation.read) }),
      t('studyPoeaa.identity-field.model.worked.next', {
        highest: highestKey(operation.read),
        key: keyText(t, operation.key),
      }),
      holder === null
        ? t('studyPoeaa.identity-field.model.worked.free', { key: keyText(t, operation.key) })
        : t('studyPoeaa.identity-field.model.worked.taken', { holder: nameOf(t, holder) }),
      collisions,
    ],
    note: operation.reread
      ? t('studyPoeaa.identity-field.model.worked.reread')
      : t('studyPoeaa.identity-field.model.worked.held'),
  };
}

/** Every tracked composition with the key it holds, in the example's order. */
function keysHeld(t: StudyTranslate, scene: Scene): string {
  return compositions
    .flatMap((id) => {
      const standing = standingOf(scene, id);
      if (standing === null) return [];
      const key = keyOf(scene, id);
      return [
        standing === 'unkeyed' || key === null
          ? t('studyPoeaa.identity-field.model.values.unkeyed', { name: nameOf(t, id) })
          : t('studyPoeaa.identity-field.model.values.keyed', {
              name: nameOf(t, id),
              key: keyText(t, key),
            }),
      ];
    })
    .join(t('studyCommon.states.sentenceSeparator'));
}

/** The values the record's prose reads at a moment, with the example's own inputs among them. */
function textOf(t: StudyTranslate, moment: IdentityFieldMoment): StatesMomentText {
  const { scene } = stepAt(moment);
  const notes = Object.fromEntries(
    compositions.flatMap((id) => {
      const note = objectNote(t, scene, id);
      return note === null ? [] : [[id, note]];
    }),
  );
  return {
    values: {
      ...studyParameterValues(moment.run.parameters, t),
      keying: keyingOf(t, moment),
      keys: keysHeld(t, scene),
      collisions: String(collisionsIn(scene)),
      rereadSentence:
        moment.run.example.rereads > 0
          ? t('studyPoeaa.identity-field.model.values.reread')
          : t('studyPoeaa.identity-field.model.values.noReread'),
    },
    note: stepNote(t, moment),
    worked: workedOf(t, moment),
    notes,
  };
}

const inputsOf = (t: StudyTranslate): readonly StudyInput[] => [
  {
    name: 'rereads',
    label: t('studyPoeaa.identity-field.model.inputs.rereads'),
    unit: t('studyPoeaa.identity-field.model.inputs.perSave'),
    min: 0,
    max: 1,
    step: 1,
  },
];

/** The named moments: the drafts, the first key chosen, the second, and the first open by key. */
function momentsOf(t: StudyTranslate, run: IdentityFieldRun): readonly StudyMoment[] {
  const saves = run.steps.flatMap(({ operation }, step) =>
    operation.kind === 'save' ? [step] : [],
  );
  const second = saves[1];
  const collided = collisionsIn(run.steps[second].scene) > 0;
  return [
    {
      label: t('studyPoeaa.identity-field.model.moments.compose'),
      step: run.steps.findIndex(({ operation }) => operation.kind === 'compose'),
    },
    { label: t('studyPoeaa.identity-field.model.moments.firstKey'), step: saves[0] },
    {
      label: collided
        ? t('studyPoeaa.identity-field.model.moments.collision')
        : t('studyPoeaa.identity-field.model.moments.reread'),
      step: second,
    },
    {
      label: t('studyPoeaa.identity-field.model.moments.open'),
      step: run.steps.findIndex(({ operation }) => operation.kind === 'open'),
    },
  ];
}

/** The run drawn as a register: each composition's row, the column of how it holds its key. */
export function present(run: IdentityFieldRun, t: StudyTranslate): StatesStudyModel {
  const moments = run.steps.map((_, index) => ({ run, index }));
  return statesModel(
    {
      shape: shapeOf(t),
      snapshots: moments.map(snapshotOf),
      text: moments.map((moment) => textOf(t, moment)),
    },
    {
      moments: momentsOf(t, run),
      inputs: inputsOf(t),
    },
    t,
  );
}

import type { StudyParameters } from '@dotln-angular/models';

import { countTicks } from '../drawing';
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
  type Caller,
  copiesOf,
  type IdentityMap,
  type IdentityMapOperation,
  type IdentityMapParameters,
  type IdentityMapStep,
  type Session,
  studies,
  type StudyId,
} from './identity-map.simulation';

/** The whole run as the presentation reads it: the example, its steps and the record's inputs. */
export interface IdentityMapRun {
  readonly example: IdentityMapParameters;
  readonly steps: readonly IdentityMapStep[];
  readonly parameters: StudyParameters;
}

/** One moment of the run, by its place in the run. */
interface IdentityMapMoment {
  readonly run: IdentityMapRun;
  readonly index: number;
}

const stepAt = ({ run, index }: IdentityMapMoment) => run.steps[index];

/** Where a study stands at a moment: no object for it, one in a map, or one in each of two. */
const standings = ['stored', 'mapped', 'twice'] as const;

// Each study's name, the id it is read under in the words the reader sees, and the letter its token
// shows, and each caller's name; the compiler requires an entry for every study and every caller.
const names = {
  unitOfWork: 'studyPoeaa.identity-map.model.names.unitOfWork',
  identityMap: 'studyPoeaa.identity-map.model.names.identityMap',
} as const satisfies Record<StudyId, string>;
const ids = {
  unitOfWork: 'studyPoeaa.identity-map.model.ids.unitOfWork',
  identityMap: 'studyPoeaa.identity-map.model.ids.identityMap',
} as const satisfies Record<StudyId, string>;
const tokens = { unitOfWork: 'U', identityMap: 'I' } as const satisfies Record<StudyId, string>;
const callers = {
  reading: 'studyPoeaa.identity-map.model.callers.reading',
  nearby: 'studyPoeaa.identity-map.model.callers.nearby',
} as const satisfies Record<Caller, string>;

const nameOf = (t: StudyTranslate, id: StudyId) => t(names[id]);

const idOf = (t: StudyTranslate, id: StudyId) => t(ids[id]);

const reviewOf = (t: StudyTranslate, checked: boolean) =>
  checked
    ? t('studyPoeaa.identity-map.model.words.checked')
    : t('studyPoeaa.identity-map.model.words.draft');

const shapeOf = (t: StudyTranslate): StatesShape => ({
  nodes: [
    { id: 'stored', label: t('studyPoeaa.identity-map.model.standings.stored') },
    {
      id: 'mapped',
      label: t('studyPoeaa.identity-map.model.standings.mapped'),
      tone: 'subject',
    },
    { id: 'twice', label: t('studyPoeaa.identity-map.model.standings.twice') },
  ],
  objects: studies.map((id) => ({ id, label: nameOf(t, id), key: tokens[id] })),
  transitions: [
    {
      id: 'miss',
      from: 'stored',
      to: 'mapped',
      label: t('studyPoeaa.identity-map.model.operations.miss'),
    },
    {
      id: 'hit',
      from: 'mapped',
      to: 'mapped',
      label: t('studyPoeaa.identity-map.model.operations.hit'),
    },
    {
      id: 'missElsewhere',
      from: 'mapped',
      to: 'twice',
      label: t('studyPoeaa.identity-map.model.operations.missElsewhere'),
    },
    {
      id: 'hitTwice',
      from: 'twice',
      to: 'twice',
      label: t('studyPoeaa.identity-map.model.operations.hit'),
    },
    {
      id: 'endMapped',
      from: 'mapped',
      to: 'stored',
      label: t('studyPoeaa.identity-map.model.operations.newSession'),
    },
    {
      id: 'endTwice',
      from: 'twice',
      to: 'stored',
      label: t('studyPoeaa.identity-map.model.operations.newSession'),
    },
  ],
});

const standingOf = (session: Session, id: StudyId) => standings[copiesOf(session, id)];

/**
 * The transition a step's moves cannot be told by their standings alone: a hit leaves the study
 * where it stood. A miss and a new session each join their two standings by a transition of their
 * own.
 */
function tookAt(moment: IdentityMapMoment): Readonly<Record<string, string>> {
  const { operation, session } = stepAt(moment);
  if (operation.kind !== 'find' || !operation.hit) return {};
  return { [operation.id]: standingOf(session, operation.id) === 'twice' ? 'hitTwice' : 'hit' };
}

const snapshotOf = (moment: IdentityMapMoment): StatesSnapshot => ({
  at: Object.fromEntries(studies.map((id) => [id, standingOf(stepAt(moment).session, id)])),
  took: tookAt(moment),
});

/** The few words beside a study's name: what each object the session holds for it says. */
function objectNote(t: StudyTranslate, moment: IdentityMapMoment, id: StudyId): string {
  const { session, store } = stepAt(moment);
  const held = session.maps.flatMap((map) => map[id] ?? []);
  const [first, second] = held;
  if (!first) return t('studyPoeaa.identity-map.model.notes.unread');
  if (second)
    return t('studyPoeaa.identity-map.model.notes.twice', {
      first: reviewOf(t, first.checked),
      second: reviewOf(t, second.checked),
    });
  const stored = store.rows[id].checked;
  return stored === first.checked
    ? t('studyPoeaa.identity-map.model.notes.held', { held: reviewOf(t, first.checked) })
    : t('studyPoeaa.identity-map.model.notes.stale', {
        held: reviewOf(t, first.checked),
        stored: reviewOf(t, stored),
      });
}

/** At a lookup, whether it hit or missed and why; at any other step, that there was none. */
function lookupOf(t: StudyTranslate, moment: IdentityMapMoment): string {
  const { operation } = stepAt(moment);
  if (operation.kind !== 'find') return t('studyPoeaa.identity-map.model.lookup.none');
  const words = {
    caller: t(callers[operation.caller]),
    id: idOf(t, operation.id),
    read: operation.study.read,
  };
  if (operation.hit) return t('studyPoeaa.identity-map.model.lookup.hit', words);
  return operation.map > 0
    ? t('studyPoeaa.identity-map.model.lookup.missElsewhere', words)
    : t('studyPoeaa.identity-map.model.lookup.miss', words);
}

type FindOperation = Extract<IdentityMapOperation, { readonly kind: 'find' }>;

/** The sentence for a lookup: what the reader asked for, and what the map it went through held. */
function findNote(t: StudyTranslate, moment: IdentityMapMoment, operation: FindOperation): string {
  const read = operation.study.read;
  if (operation.caller === 'nearby' && operation.hit)
    return t('studyPoeaa.identity-map.model.steps.nearbyHit');
  // A miss in the nearby list's own map, while the reading's map holds an object of its own.
  const reading = stepAt(moment).session.maps[0][operation.id];
  if (operation.caller === 'nearby' && reading && reading !== operation.study)
    return t('studyPoeaa.identity-map.model.steps.nearbyMiss', {
      first: reviewOf(t, reading.checked),
      second: reviewOf(t, operation.study.checked),
    });
  if (operation.id === 'identityMap')
    return t('studyPoeaa.identity-map.model.steps.followed', { read });
  if (operation.hit) return t('studyPoeaa.identity-map.model.steps.revisited');
  const reloaded = moment.run.steps
    .slice(0, moment.index)
    .some((step) => step.operation.kind === 'newSession');
  return reloaded
    ? t('studyPoeaa.identity-map.model.steps.reopened', { read })
    : t('studyPoeaa.identity-map.model.steps.opened', { read });
}

/** The sentence under the drawing: what the reader did at this step, and what the map did. */
function stepNote(t: StudyTranslate, moment: IdentityMapMoment): string {
  return matchKind(stepAt(moment).operation, {
    start: () => t('studyPoeaa.identity-map.model.steps.start'),
    find: (operation) => findNote(t, moment, operation),
    check: () => t('studyPoeaa.identity-map.model.steps.check'),
    newSession: () => t('studyPoeaa.identity-map.model.steps.newSession'),
  });
}

/** The ids a map holds, in the example's order, or the shared word for none. */
const idsIn = (t: StudyTranslate, map: IdentityMap) =>
  listOf(
    t,
    studies.filter((id) => map[id] !== undefined).map((id) => idOf(t, id)),
  );

/** What a lookup found, or that the step made none, as the worked line under the maps. */
function outcomeLine(t: StudyTranslate, moment: IdentityMapMoment): string | null {
  const { operation } = stepAt(moment);
  if (operation.kind !== 'find') return null;
  const words = { id: idOf(t, operation.id), read: operation.study.read };
  if (operation.hit) return t('studyPoeaa.identity-map.model.worked.found', words);
  return operation.map > 0
    ? t('studyPoeaa.identity-map.model.worked.missingElsewhere', words)
    : t('studyPoeaa.identity-map.model.worked.missing', words);
}

/** Each map's ids after the step, the lookup's outcome and the counts so far. */
function workedOf(t: StudyTranslate, moment: IdentityMapMoment): StudyWorkedStep {
  const { session, store, hits, lookups } = stepAt(moment);
  const [shared, own] = session.maps;
  const maps = own
    ? [
        t('studyPoeaa.identity-map.model.worked.readingMap', { ids: idsIn(t, shared) }),
        t('studyPoeaa.identity-map.model.worked.nearbyMap', { ids: idsIn(t, own) }),
      ]
    : [t('studyPoeaa.identity-map.model.worked.sharedMap', { ids: idsIn(t, shared) })];
  const outcome = outcomeLine(t, moment);
  return {
    title: t('studyPoeaa.identity-map.model.worked.title', { step: moment.index }),
    lines: [
      ...maps,
      ...(outcome === null ? [] : [outcome]),
      t('studyPoeaa.identity-map.model.worked.counts', { reads: store.reads, hits }),
    ],
    note: t('studyPoeaa.identity-map.model.worked.unmapped', { lookups }),
  };
}

/** How the record's description says the reader goes back: not at all, once or several times. */
function revisitsPhrase(t: StudyTranslate, revisits: number): string {
  if (revisits === 0) return t('studyPoeaa.identity-map.model.values.revisitsNone');
  return revisits === 1
    ? t('studyPoeaa.identity-map.model.values.revisitsOnce')
    : t('studyPoeaa.identity-map.model.values.revisitsMany', { count: revisits });
}

/** The values the record's prose reads at a moment, with the example's own inputs among them. */
function textOf(t: StudyTranslate, moment: IdentityMapMoment): StatesMomentText {
  const { store, hits, lookups } = stepAt(moment);
  const { example } = moment.run;
  return {
    values: {
      ...studyParameterValues(moment.run.parameters, t),
      reads: String(store.reads),
      hits: String(hits),
      lookups: String(lookups),
      lookup: lookupOf(t, moment),
      mapsSentence:
        example.maps > 1
          ? t('studyPoeaa.identity-map.model.values.twoMaps')
          : t('studyPoeaa.identity-map.model.values.oneMap'),
      revisitsPhrase: revisitsPhrase(t, example.revisits),
    },
    note: stepNote(t, moment),
    worked: workedOf(t, moment),
    notes: Object.fromEntries(studies.map((id) => [id, objectNote(t, moment, id)])),
  };
}

/** The same lookups made two ways: through the identity map, or with a read for every one. */
function comparisonOf(t: StudyTranslate, run: IdentityMapRun): StudyComparison<'steps'> {
  const last = run.steps[run.steps.length - 1];
  return {
    title: t('studyPoeaa.identity-map.model.comparison.title'),
    intro: t('studyPoeaa.identity-map.model.comparison.intro'),
    timeline: {
      title: t('studyPoeaa.identity-map.model.comparison.chart'),
      xLabel: t('studyPoeaa.identity-map.model.comparison.xLabel'),
      yLabel: t('studyPoeaa.identity-map.model.comparison.yLabel'),
      steps: run.steps.map((_, index) => index),
      series: [
        {
          id: 'mapped',
          label: t('studyPoeaa.identity-map.model.comparison.mapped'),
          tone: 'actual',
          values: run.steps.map(({ store }) => store.reads),
        },
        {
          id: 'unmapped',
          label: t('studyPoeaa.identity-map.model.comparison.unmapped'),
          tone: 'desired',
          values: run.steps.map(({ lookups }) => lookups),
        },
      ],
      xTicks: run.steps.map((_, index) => index),
      yTicks: countTicks([
        ...run.steps.map(({ store }) => store.reads),
        ...run.steps.map(({ lookups }) => lookups),
      ]),
    },
    findings: [
      t('studyPoeaa.identity-map.model.comparison.reads', {
        reads: last.store.reads,
        lookups: last.lookups,
        hits: last.hits,
      }),
      t('studyPoeaa.identity-map.model.comparison.objects'),
    ],
  };
}

const inputsOf = (t: StudyTranslate): readonly StudyInput[] => [
  {
    name: 'maps',
    label: t('studyPoeaa.identity-map.model.inputs.maps'),
    unit: t('studyPoeaa.identity-map.model.inputs.inAll'),
    min: 1,
    max: 2,
    step: 1,
  },
  {
    name: 'revisits',
    label: t('studyPoeaa.identity-map.model.inputs.revisits'),
    unit: t('studyPoeaa.identity-map.model.inputs.inAll'),
    min: 0,
    max: 3,
    step: 1,
  },
];

/** The named moments: the first miss, the store's change, a second copy if any, the first hit, the reload. */
function momentsOf(t: StudyTranslate, run: IdentityMapRun): readonly StudyMoment[] {
  const at = (found: (step: IdentityMapStep) => boolean) => run.steps.findIndex(found);
  const candidates = [
    {
      label: t('studyPoeaa.identity-map.model.moments.miss'),
      step: at(({ operation }) => operation.kind === 'find' && !operation.hit),
    },
    {
      label: t('studyPoeaa.identity-map.model.moments.check'),
      step: at(({ operation }) => operation.kind === 'check'),
    },
    {
      label: t('studyPoeaa.identity-map.model.moments.twice'),
      step: at(({ operation }) => operation.kind === 'find' && operation.map > 0 && !operation.hit),
    },
    {
      label: t('studyPoeaa.identity-map.model.moments.hit'),
      step: at(({ operation }) => operation.kind === 'find' && operation.hit),
    },
    {
      label: t('studyPoeaa.identity-map.model.moments.newSession'),
      step: at(({ operation }) => operation.kind === 'newSession'),
    },
  ];
  return candidates.filter(({ step }) => step >= 0).sort((a, b) => a.step - b.step);
}

/** The run drawn as a register: each study's row, the column of how many objects the page holds for it. */
export function present(run: IdentityMapRun, t: StudyTranslate): StatesStudyModel {
  const moments = run.steps.map((_, index) => ({ run, index }));
  return statesModel(
    {
      shape: shapeOf(t),
      snapshots: moments.map(snapshotOf),
      text: moments.map((moment) => textOf(t, moment)),
    },
    {
      moments: momentsOf(t, run),
      comparison: comparisonOf(t, run),
      inputs: inputsOf(t),
    },
    t,
  );
}

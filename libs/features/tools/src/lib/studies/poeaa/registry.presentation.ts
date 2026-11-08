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
  catalogKey,
  type PageId,
  type PageOpening,
  pages,
  type RegistryOperation,
  type RegistryParameters,
  type RegistryStep,
  type ScopeId,
  stateOf,
} from './registry.simulation';

/** The whole run as the presentation reads it: the example, its steps and the record's inputs. */
export interface RegistryRun {
  readonly example: RegistryParameters;
  readonly steps: readonly RegistryStep[];
  readonly parameters: StudyParameters;
}

/** One moment of the run: the run, and which of its steps this is. */
interface RegistryMoment {
  readonly run: RegistryRun;
  readonly index: number;
}

const stepAt = ({ run, index }: RegistryMoment) => run.steps[index];

/** The scopes in the order the worked lines list them. */
const scopeOrder: readonly ScopeId[] = ['tools', 'home', 'catalog', 'scene'];

function pageName(t: StudyTranslate, page: PageId): string {
  switch (page) {
    case 'home':
      return t('studyPoeaa.registry.model.pages.home');
    case 'catalog':
      return t('studyPoeaa.registry.model.pages.catalog');
    default:
      return t('studyPoeaa.registry.model.pages.scene');
  }
}

function scopeName(t: StudyTranslate, scope: ScopeId): string {
  switch (scope) {
    case 'tools':
      return t('studyPoeaa.registry.model.scopes.tools');
    case 'home':
      return t('studyPoeaa.registry.model.scopes.home');
    case 'catalog':
      return t('studyPoeaa.registry.model.scopes.catalog');
    default:
      return t('studyPoeaa.registry.model.scopes.scene');
  }
}

const shapeOf = (t: StudyTranslate): StatesShape => ({
  nodes: [
    { id: 'waiting', label: t('studyPoeaa.registry.model.states.waiting') },
    { id: 'built', label: t('studyPoeaa.registry.model.states.built'), tone: 'subject' },
    { id: 'shared', label: t('studyPoeaa.registry.model.states.shared'), tone: 'subject' },
  ],
  objects: pages.map((id) => ({
    id,
    label: pageName(t, id),
    key: id === 'home' ? 'H' : id === 'catalog' ? 'C' : 'S',
  })),
  transitions: [
    { id: 'lookupBuilds', from: 'waiting', to: 'built' },
    { id: 'lookupShares', from: 'waiting', to: 'shared' },
    { id: 'lookupBuildsAgain', from: 'built', to: 'built' },
    { id: 'lookupSharesAgain', from: 'shared', to: 'shared' },
  ].map((transition) => ({
    ...transition,
    label: t('studyPoeaa.registry.model.operations.lookup'),
  })),
});

/**
 * The moment at a step: where every page stands, and the transition the page that opened took,
 * chosen by where that page stood before and what the registry handed it.
 */
function snapshotOf(run: RegistryRun, index: number): StatesSnapshot {
  const step = run.steps[index];
  const at = Object.fromEntries(pages.map((page) => [page, stateOf(step, page)]));
  const { operation } = step;
  if (operation.kind === 'start' || operation.answer.kind === 'refused') return { at };
  const before = stateOf(run.steps[index - 1], operation.page);
  const built = operation.answer.kind === 'built';
  const took =
    before === 'waiting'
      ? built
        ? 'lookupBuilds'
        : 'lookupShares'
      : built
        ? 'lookupBuildsAgain'
        : 'lookupSharesAgain';
  return { at, took: { [operation.page]: took } };
}

/** The few words beside a page: the loader it holds, and whether that loader has gone. */
function pageNote(t: StudyTranslate, step: RegistryStep, page: PageId): string | null {
  const holding = step.held[page];
  if (!holding) return null;
  const loader = holding.loader;
  if (holding.discarded) return t('studyPoeaa.registry.model.notes.discarded', { loader });
  return holding.answer === 'built'
    ? t('studyPoeaa.registry.model.notes.built', { loader })
    : t('studyPoeaa.registry.model.notes.shared', { loader });
}

/** The sentence for a page opening, before any word about a scope that closed as the reader left. */
function openingNote(t: StudyTranslate, step: RegistryStep, opening: PageOpening): string {
  const holding = step.held[opening.page];
  if (opening.answer.kind === 'refused' || !holding)
    return t('studyPoeaa.registry.model.steps.refused');
  const values = { loader: holding.loader, scope: scopeName(t, holding.scope) };
  const built = opening.answer.kind === 'built';
  if (opening.page === 'home') return t('studyPoeaa.registry.model.steps.home', values);
  if (opening.page === 'scene') return t('studyPoeaa.registry.model.steps.scene', values);
  if (opening.visit === 0)
    return built
      ? t('studyPoeaa.registry.model.steps.catalogBuilt', values)
      : t('studyPoeaa.registry.model.steps.catalogShared', values);
  return built
    ? t('studyPoeaa.registry.model.steps.returnBuilt', values)
    : t('studyPoeaa.registry.model.steps.returnShared', values);
}

/** The sentence under the drawing: what the page that opened was handed, and what closed. */
function stepNote(t: StudyTranslate, moment: RegistryMoment): string {
  const step = stepAt(moment);
  const { operation } = step;
  if (operation.kind === 'start')
    return moment.run.example.perPage > 0
      ? t('studyPoeaa.registry.model.steps.startPerPage')
      : t('studyPoeaa.registry.model.steps.startRoutes');
  const next = openingNote(t, step, operation);
  return operation.closed === null
    ? next
    : t('studyPoeaa.registry.model.steps.afterClose', { next, loader: operation.closed.loader });
}

/** Why this step's lookup built a loader or did not, beside the worked lines. */
function answerNote(t: StudyTranslate, operation: RegistryOperation): string {
  if (operation.kind === 'start') return t('studyPoeaa.registry.model.worked.start');
  switch (operation.answer.kind) {
    case 'built':
      return t('studyPoeaa.registry.model.worked.built');
    case 'shared':
      return t('studyPoeaa.registry.model.worked.shared');
    default:
      return t('studyPoeaa.registry.model.worked.refused');
  }
}

/** What every open scope holds at this moment, and the counts the prose reads. */
function workedOf(t: StudyTranslate, moment: RegistryMoment): StudyWorkedStep {
  const { operation, registry } = stepAt(moment);
  const lines = scopeOrder.flatMap((scope) => {
    const entry = registry.scopes[scope]?.[catalogKey];
    if (!entry) return [];
    const holds =
      entry.loader === null
        ? t('studyPoeaa.registry.model.worked.factoryOnly')
        : t('studyPoeaa.registry.model.worked.loader', { loader: entry.loader });
    return [t('studyPoeaa.registry.model.worked.entry', { scope: scopeName(t, scope), holds })];
  });
  lines.push(
    t('studyPoeaa.registry.model.worked.counts', {
      lookups: registry.lookups,
      built: registry.built,
      reads: registry.read.length,
    }),
  );
  return {
    title: t('studyPoeaa.registry.model.worked.title', { step: moment.index }),
    lines,
    note: answerNote(t, operation),
  };
}

/** The values the record's prose reads at a moment, with the example's own inputs among them. */
function textOf(t: StudyTranslate, moment: RegistryMoment): StatesMomentText {
  const step = stepAt(moment);
  const notes = Object.fromEntries(
    pages.flatMap((page) => {
      const note = pageNote(t, step, page);
      return note === null ? [] : [[page, note]];
    }),
  );
  return {
    values: {
      ...studyParameterValues(moment.run.parameters, t),
      lookups: String(step.registry.lookups),
      built: String(step.registry.built),
      reads: String(step.registry.read.length),
      scoping:
        moment.run.example.perPage > 0
          ? t('studyPoeaa.registry.model.values.perPage')
          : t('studyPoeaa.registry.model.values.perRoute'),
    },
    note: stepNote(t, moment),
    worked: workedOf(t, moment),
    notes,
  };
}

const inputsOf = (t: StudyTranslate): readonly StudyInput[] => [
  {
    name: 'perPage',
    label: t('studyPoeaa.registry.model.inputs.perPage'),
    unit: t('studyPoeaa.registry.model.inputs.toggle'),
    min: 0,
    max: 1,
    step: 1,
  },
  {
    name: 'returns',
    label: t('studyPoeaa.registry.model.inputs.returns'),
    unit: t('studyPoeaa.registry.model.inputs.inAll'),
    min: 0,
    max: 3,
    step: 1,
  },
];

/** The named moments: each page's first lookup, and the first return when there is one. */
function momentsOf(t: StudyTranslate, run: RegistryRun): readonly StudyMoment[] {
  const first = (page: PageId, visit: number) =>
    run.steps.findIndex(
      ({ operation }) =>
        operation.kind === 'open' && operation.page === page && operation.visit === visit,
    );
  const moments: StudyMoment[] = [
    { label: t('studyPoeaa.registry.model.moments.home'), step: first('home', 0) },
    { label: t('studyPoeaa.registry.model.moments.catalog'), step: first('catalog', 0) },
    { label: t('studyPoeaa.registry.model.moments.scene'), step: first('scene', 0) },
  ];
  const back = first('catalog', 1);
  if (back >= 0) moments.push({ label: t('studyPoeaa.registry.model.moments.return'), step: back });
  return moments;
}

/** The run drawn as a register: each page's row, the column of what its lookup handed it. */
export function present(run: RegistryRun, t: StudyTranslate): StatesStudyModel {
  return statesModel(
    {
      shape: shapeOf(t),
      snapshots: run.steps.map((_, index) => snapshotOf(run, index)),
      text: run.steps.map((_, index) => textOf(t, { run, index })),
    },
    {
      moments: momentsOf(t, run),
      inputs: inputsOf(t),
    },
    t,
  );
}

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
  type EnvironmentId,
  environments,
  isLinked,
  type PainterName,
  type PluginParameters,
  type PluginStep,
  totalsOf,
} from './plugin.simulation';

/** The whole run as the presentation reads it: the example, its steps and the record's inputs. */
export interface PluginRun {
  readonly example: PluginParameters;
  readonly steps: readonly PluginStep[];
  readonly parameters: StudyParameters;
}

/** One moment of the run: the run, and which of its steps this is. */
interface PluginMoment {
  readonly run: PluginRun;
  readonly index: number;
}

const stepAt = ({ run, index }: PluginMoment) => run.steps[index];

// Each environment's name as its row carries it and as a sentence carries it after its first word,
// with the letter its token shows, and each linked painter's name; the compiler requires an entry
// for every environment and every painter the build links.
const names = {
  development: 'studyPoeaa.plugin.model.environments.development',
  tests: 'studyPoeaa.plugin.model.environments.tests',
  production: 'studyPoeaa.plugin.model.environments.production',
} as const satisfies Record<EnvironmentId, string>;
const phrases = {
  development: 'studyPoeaa.plugin.model.phrases.development',
  tests: 'studyPoeaa.plugin.model.phrases.tests',
  production: 'studyPoeaa.plugin.model.phrases.production',
} as const satisfies Record<EnvironmentId, string>;
const tokens = { development: 'D', tests: 'T', production: 'P' } as const satisfies Record<
  EnvironmentId,
  string
>;
const painters = {
  canvas: 'studyPoeaa.plugin.model.names.canvas',
  null: 'studyPoeaa.plugin.model.names.null',
} as const satisfies Record<PainterName, string>;

const environmentName = (t: StudyTranslate, environment: EnvironmentId) => t(names[environment]);

const environmentPhrase = (t: StudyTranslate, environment: EnvironmentId) =>
  t(phrases[environment]);

/** A configured painter's name in words: one of the linked two, or one the build lacks. */
const painterName = (t: StudyTranslate, name: string): string =>
  isLinked(name) ? t(painters[name]) : t('studyPoeaa.plugin.model.names.unlinked');

const shapeOf = (t: StudyTranslate): StatesShape => {
  const bind = t('studyPoeaa.plugin.model.operations.bind');
  const draw = t('studyPoeaa.plugin.model.operations.draw');
  return {
    nodes: [
      { id: 'unbound', label: t('studyPoeaa.plugin.model.states.unbound') },
      { id: 'canvas', label: t('studyPoeaa.plugin.model.states.canvas'), tone: 'subject' },
      { id: 'null', label: t('studyPoeaa.plugin.model.states.null'), tone: 'subject' },
    ],
    objects: environments.map((id) => ({ id, label: environmentName(t, id), key: tokens[id] })),
    transitions: [
      { id: 'bindCanvas', from: 'unbound', to: 'canvas', label: bind },
      { id: 'bindNull', from: 'unbound', to: 'null', label: bind },
      { id: 'drawCanvas', from: 'canvas', to: 'canvas', label: draw },
      { id: 'drawNull', from: 'null', to: 'null', label: draw },
    ],
  };
};

// The transition a frame drawn with each painter takes, back into the state of the painter bound.
const draws = { canvas: 'drawCanvas', null: 'drawNull' } as const satisfies Record<
  PainterName,
  string
>;

/**
 * The transition a step's moves cannot be told by their states alone: a frame drawn leaves the
 * environment bound where it was. Binding a painter joins its two states by a transition of its own.
 */
function tookAt(step: PluginStep): Readonly<Record<string, string>> {
  const { operation } = step;
  if (operation.kind !== 'draw') return {};
  const painter = step.bindings[operation.environment]?.painter;
  return painter ? { [operation.environment]: draws[painter] } : {};
}

const snapshotOf = (step: PluginStep): StatesSnapshot => ({
  at: Object.fromEntries(
    environments.map((environment) => [
      environment,
      step.bindings[environment]?.painter ?? 'unbound',
    ]),
  ),
  took: tookAt(step),
});

/** True once the environment has tried to start, whether its painter was bound or refused. */
const hasStarted = (moment: PluginMoment, environment: EnvironmentId) =>
  moment.run.steps
    .slice(0, moment.index + 1)
    .some(({ operation }) => operation.kind === 'bind' && operation.environment === environment);

/** The few words beside an environment, and the same reading for the worked lines. */
function bindingWords(
  t: StudyTranslate,
  moment: PluginMoment,
  environment: EnvironmentId,
): { readonly note: string; readonly worked: string } {
  const step = stepAt(moment);
  const binding = step.bindings[environment];
  const name = painterName(t, step.configuration[environment]);
  if (!binding) {
    if (!hasStarted(moment, environment))
      return {
        note: t('studyPoeaa.plugin.model.notes.configured', { name }),
        worked: t('studyPoeaa.plugin.model.worked.notStarted'),
      };
    const refused = t('studyPoeaa.plugin.model.notes.refused');
    return { note: refused, worked: refused };
  }
  const bound = painterName(t, binding.painter);
  if (binding.drawn === 0)
    return {
      note: t('studyPoeaa.plugin.model.notes.bound', { name: bound }),
      worked: t('studyPoeaa.plugin.model.worked.bound', { name: bound }),
    };
  const drew = t('studyPoeaa.plugin.model.notes.drew', {
    drawn: binding.drawn,
    shown: binding.shown,
  });
  return { note: drew, worked: drew };
}

/** The sentence under the drawing: what the factory or the scene did at this step. */
function stepNote(t: StudyTranslate, step: PluginStep): string {
  const { operation } = step;
  if (operation.kind === 'start') return t('studyPoeaa.plugin.model.steps.start');
  const environment = environmentPhrase(t, operation.environment);
  if (operation.kind === 'bind') {
    if (operation.result.kind === 'refused')
      return t('studyPoeaa.plugin.model.steps.refused', { environment });
    if (operation.result.painter === 'canvas')
      return t('studyPoeaa.plugin.model.steps.boundCanvas', { environment });
    return operation.environment === 'production'
      ? t('studyPoeaa.plugin.model.steps.productionNull')
      : t('studyPoeaa.plugin.model.steps.boundNull', { environment });
  }
  if (step.bindings[operation.environment]?.painter === 'canvas')
    return t('studyPoeaa.plugin.model.steps.drawCanvas', { environment });
  return operation.environment === 'tests'
    ? t('studyPoeaa.plugin.model.steps.drawNullTests')
    : t('studyPoeaa.plugin.model.steps.drawNullUnseen', { environment });
}

/** Every environment's configuration and binding at this moment, and the frames so far. */
function workedOf(t: StudyTranslate, moment: PluginMoment): StudyWorkedStep {
  const step = stepAt(moment);
  const { drawn, shown } = totalsOf(step);
  return {
    title: t('studyPoeaa.plugin.model.worked.title', { step: moment.index }),
    lines: [
      ...environments.map((environment) =>
        t('studyPoeaa.plugin.model.worked.environment', {
          environment: environmentName(t, environment),
          name: painterName(t, step.configuration[environment]),
          binding: bindingWords(t, moment, environment).worked,
        }),
      ),
      t('studyPoeaa.plugin.model.worked.totals', { drawn, shown }),
    ],
    note: t('studyPoeaa.plugin.model.worked.note'),
  };
}

/** The values the record's prose reads at a moment, with the example's own input among them. */
function textOf(t: StudyTranslate, moment: PluginMoment): StatesMomentText {
  const step = stepAt(moment);
  const { drawn, shown } = totalsOf(step);
  return {
    values: {
      ...studyParameterValues(moment.run.parameters, t),
      drawn: String(drawn),
      shown: String(shown),
      productionPainter: painterName(t, step.configuration.production),
      productionConfig: moment.run.example.productionStub
        ? t('studyPoeaa.plugin.model.values.stub')
        : t('studyPoeaa.plugin.model.values.canvas'),
    },
    note: stepNote(t, step),
    worked: workedOf(t, moment),
    notes: Object.fromEntries(
      environments.map((environment) => [environment, bindingWords(t, moment, environment).note]),
    ),
  };
}

const inputsOf = (t: StudyTranslate): readonly StudyInput[] => [
  {
    name: 'productionStub',
    label: t('studyPoeaa.plugin.model.inputs.productionStub'),
    unit: t('studyPoeaa.plugin.model.inputs.toggle'),
    min: 0,
    max: 1,
    step: 1,
  },
];

/** The named moments: each environment's start, then the frames of the tests and production. */
function momentsOf(t: StudyTranslate, run: PluginRun): readonly StudyMoment[] {
  const at = (kind: 'bind' | 'draw', environment: EnvironmentId) =>
    run.steps.findIndex(
      ({ operation }) => operation.kind === kind && operation.environment === environment,
    );
  const named: readonly [string, number][] = [
    [t('studyPoeaa.plugin.model.moments.development'), at('bind', 'development')],
    [t('studyPoeaa.plugin.model.moments.tests'), at('bind', 'tests')],
    [t('studyPoeaa.plugin.model.moments.production'), at('bind', 'production')],
    [t('studyPoeaa.plugin.model.moments.testFrame'), at('draw', 'tests')],
    [t('studyPoeaa.plugin.model.moments.productionFrame'), at('draw', 'production')],
  ];
  return named.filter(([, step]) => step >= 0).map(([label, step]) => ({ label, step }));
}

/** The run drawn as a register: each environment's row, in the column of the painter it bound. */
export function present(run: PluginRun, t: StudyTranslate): StatesStudyModel {
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

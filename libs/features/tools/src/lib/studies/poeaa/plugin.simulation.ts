import type { StudyParameters } from '@dotln-angular/models';

import { booleanParameter } from '../parameters';

/** The example's input: whether production's configuration names the tests' painter. */
export interface PluginParameters {
  /** True when production's configuration names the null painter, as if copied from the tests' file. */
  readonly productionStub: boolean;
}

/** The environments the scene runs in, in the order the example starts them. */
export const environments = ['development', 'tests', 'production'] as const;
export type EnvironmentId = (typeof environments)[number];

/** The painters the build links, by the name a configuration uses for each. */
export const linkedPainters = ['canvas', 'null'] as const;
export type PainterName = (typeof linkedPainters)[number];

/** Each environment's configuration: the painter it names, which may be one the build lacks. */
export type Configuration = Readonly<Record<EnvironmentId, string>>;

/** A bound painter in one environment: frames it was asked to draw, and frames it showed. */
export interface Binding {
  readonly painter: PainterName;
  readonly drawn: number;
  readonly shown: number;
}

/** What the factory made of a configured name: a linked painter, or a refusal at start-up. */
export type BindResult =
  { readonly kind: 'bound'; readonly painter: PainterName } | { readonly kind: 'refused' };

export type PluginOperation =
  | { readonly kind: 'start' }
  | { readonly kind: 'bind'; readonly environment: EnvironmentId; readonly result: BindResult }
  | { readonly kind: 'draw'; readonly environment: EnvironmentId };

/** One moment of the run: what happened, and every environment's binding afterwards. */
export interface PluginStep {
  readonly operation: PluginOperation;
  readonly configuration: Configuration;
  readonly bindings: Readonly<Partial<Record<EnvironmentId, Binding>>>;
}

export const readParameters = (parameters: StudyParameters): PluginParameters => ({
  productionStub: booleanParameter(parameters, 'productionStub'),
});

/** What each environment's configuration names: canvas where a screen is, null for unit tests. */
export const configurationOf = (example: PluginParameters): Configuration => ({
  development: 'canvas',
  tests: 'null',
  production: example.productionStub ? 'null' : 'canvas',
});

/** True for a configured name the build links a painter under. */
export const isLinked = (name: string): name is PainterName =>
  (linkedPainters as readonly string[]).includes(name);

/**
 * The plugin factory: looks a configured name up among the painters the build links and binds
 * that one. A name the build does not link is refused here, when the environment starts.
 */
export const bind = (name: string): BindResult =>
  isLinked(name) ? { kind: 'bound', painter: name } : { kind: 'refused' };

/** Draws one frame through the interface; only the canvas painter puts it on a screen. */
export const draw = (binding: Binding): Binding => ({
  ...binding,
  drawn: binding.drawn + 1,
  shown: binding.shown + (binding.painter === 'canvas' ? 1 : 0),
});

/**
 * The example as the build runs it: each environment starts and binds the painter its
 * configuration names, then each draws one frame of the scene through whatever it bound. An
 * environment whose name was refused never starts, so it draws nothing.
 */
export function pluginRun(configuration: Configuration): readonly PluginStep[] {
  let bindings: Partial<Record<EnvironmentId, Binding>> = {};
  const steps: PluginStep[] = [{ operation: { kind: 'start' }, configuration, bindings }];
  for (const environment of environments) {
    const result = bind(configuration[environment]);
    if (result.kind === 'bound')
      bindings = { ...bindings, [environment]: { painter: result.painter, drawn: 0, shown: 0 } };
    steps.push({ operation: { kind: 'bind', environment, result }, configuration, bindings });
  }
  for (const environment of environments) {
    const binding = bindings[environment];
    if (!binding) continue;
    bindings = { ...bindings, [environment]: draw(binding) };
    steps.push({ operation: { kind: 'draw', environment }, configuration, bindings });
  }
  return steps;
}

/** The frames drawn and shown across every environment after a step. */
export function totalsOf(step: PluginStep): { readonly drawn: number; readonly shown: number } {
  const bound = environments.flatMap((environment) => step.bindings[environment] ?? []);
  return {
    drawn: bound.reduce((sum, { drawn }) => sum + drawn, 0),
    shown: bound.reduce((sum, { shown }) => sum + shown, 0),
  };
}

import type { StudyParameters } from '@dotln-angular/models';

import { numberParameter } from '../parameters';

/** The example's inputs: where the Tools pages register the catalog, and how often the reader returns. */
export interface RegistryParameters {
  /** 1 when each Tools page registers the catalog among its own providers instead of the route's. */
  readonly perPage: number;
  /** How many times the reader opens the catalog page again, each time coming back from the scene. */
  readonly returns: number;
}

/** The pages that ask for the catalog, in the order the reader first opens them. */
export const pages = ['home', 'catalog', 'scene'] as const;
export type PageId = (typeof pages)[number];

/**
 * Where a registration lives: the Tools routes and the scene's route, as the app provides the
 * catalog, or one Tools page's own providers when each page registers it for itself.
 */
export type ScopeId = 'tools' | 'scene' | 'home' | 'catalog';

/** The key every page asks under; the example registers nothing else. */
export const catalogKey = 'catalog';

/** One registration: the loader its factory built at the first lookup, or null before that. */
export interface RegistryEntry {
  readonly loader: number | null;
}

/** What the registry holds: each open scope's entries by key, and what the loaders have done. */
export interface Registry {
  readonly scopes: Readonly<Partial<Record<ScopeId, Readonly<Record<string, RegistryEntry>>>>>;
  /** How many loaders the factories have built; loaders are numbered from 1 as they are built. */
  readonly built: number;
  readonly lookups: number;
  /** The loaders that have read the catalog; a second read through one comes from its cache. */
  readonly read: readonly number[];
}

/** What a lookup answered: a loader it has just built, one built before, or nothing registered. */
export type LookupAnswer =
  { readonly kind: 'built' | 'shared'; readonly loader: number } | { readonly kind: 'refused' };

/** The loader a page holds after asking, how its lookup got it, and whether it is gone. */
export interface PageHolding {
  readonly loader: number;
  readonly answer: 'built' | 'shared';
  readonly scope: ScopeId;
  /** True once the page's own scope has closed with the page, taking the loader with it. */
  readonly discarded: boolean;
}

/** A scope that closed with the page the reader left, and the loader that went with it. */
export interface ClosedScope {
  readonly scope: ScopeId;
  readonly loader: number;
}

/** The reader opening a page: the page looks the catalog up and reads through what it is handed. */
export interface PageOpening {
  readonly kind: 'open';
  readonly page: PageId;
  /** 0 for the page's first opening, 1 for the first return, and so on. */
  readonly visit: number;
  readonly answer: LookupAnswer;
  /** The scope of the page the reader left, when that page had one of its own; null otherwise. */
  readonly closed: ClosedScope | null;
}

export type RegistryOperation = { readonly kind: 'start' } | PageOpening;

/** One moment of the run: what the reader did, the registry afterwards and what each page holds. */
export interface RegistryStep {
  readonly operation: RegistryOperation;
  readonly registry: Registry;
  readonly held: Readonly<Partial<Record<PageId, PageHolding>>>;
}

export const readParameters = (parameters: StudyParameters): RegistryParameters => ({
  perPage: numberParameter(parameters, 'perPage'),
  returns: numberParameter(parameters, 'returns'),
});

export const emptyRegistry: Registry = { scopes: {}, built: 0, lookups: 0, read: [] };

/** Registers a key's factory in a scope. Nothing is built until something asks for it. */
export const provide = (registry: Registry, scope: ScopeId, key: string): Registry => ({
  ...registry,
  scopes: { ...registry.scopes, [scope]: { ...registry.scopes[scope], [key]: { loader: null } } },
});

/**
 * Looks a key up in a scope. The first lookup there builds the loader and keeps it; every later
 * one is handed the same loader. A key the scope does not register is refused.
 */
export function lookup(
  registry: Registry,
  scope: ScopeId,
  key: string,
): { readonly registry: Registry; readonly answer: LookupAnswer } {
  const counted = { ...registry, lookups: registry.lookups + 1 };
  const entries = registry.scopes[scope];
  const entry = entries?.[key];
  if (!entries || !entry) return { registry: counted, answer: { kind: 'refused' } };
  if (entry.loader !== null)
    return { registry: counted, answer: { kind: 'shared', loader: entry.loader } };
  const loader = registry.built + 1;
  return {
    registry: {
      ...counted,
      built: loader,
      scopes: { ...registry.scopes, [scope]: { ...entries, [key]: { loader } } },
    },
    answer: { kind: 'built', loader },
  };
}

/** Reads the catalog through a loader: its first read fetches, and later ones use its cache. */
export const readCatalog = (registry: Registry, loader: number): Registry =>
  registry.read.includes(loader) ? registry : { ...registry, read: [...registry.read, loader] };

/** Closes a scope: its entries, and the loaders they held, go with it. */
export function close(registry: Registry, scope: ScopeId): Registry {
  const { [scope]: _closed, ...scopes } = registry.scopes;
  return { ...registry, scopes };
}

/** The scope a page asks in: the scene always asks in its route's, a Tools page in the route's or its own. */
export const scopeOf = (example: RegistryParameters, page: PageId): ScopeId =>
  page === 'scene' ? 'scene' : example.perPage > 0 ? page : 'tools';

/**
 * A page's own providers open and close with the page. A route's registration outlives a visit
 * elsewhere, since the app's router keeps route injectors (it does not opt into cleaning them up).
 */
export const closesWithPage = (scope: ScopeId): boolean => scope === 'home' || scope === 'catalog';

/** The order the reader opens pages in: home, catalog page, scene, then the catalog page again. */
const visitsOf = (example: RegistryParameters): readonly PageId[] => [
  'home',
  'catalog',
  'scene',
  ...Array.from({ length: example.returns }, (): PageId => 'catalog'),
];

/**
 * The example as the reader runs it: the routes register the catalog at the start, then each page
 * the reader opens closes the page it replaces, looks the catalog up in its own scope and reads
 * the works through what it was handed. Between returns the reader looks at the scene again,
 * whose facade belongs to its route and so asks nothing new.
 */
export function registryRun(example: RegistryParameters): readonly RegistryStep[] {
  const routes: readonly ScopeId[] = example.perPage > 0 ? ['scene'] : ['tools', 'scene'];
  let registry = routes.reduce((each, scope) => provide(each, scope, catalogKey), emptyRegistry);
  let held: Partial<Record<PageId, PageHolding>> = {};
  let current: PageId | null = null;
  const opened = new Map<PageId, number>();
  const steps: RegistryStep[] = [{ operation: { kind: 'start' }, registry, held }];
  for (const page of visitsOf(example)) {
    const left = current === null ? undefined : held[current];
    let closed: ClosedScope | null = null;
    if (current !== null && left && closesWithPage(left.scope)) {
      closed = { scope: left.scope, loader: left.loader };
      registry = close(registry, left.scope);
      held = { ...held, [current]: { ...left, discarded: true } };
    }
    const scope = scopeOf(example, page);
    if (closesWithPage(scope)) registry = provide(registry, scope, catalogKey);
    const asked = lookup(registry, scope, catalogKey);
    registry = asked.registry;
    const { answer } = asked;
    if (answer.kind !== 'refused') {
      registry = readCatalog(registry, answer.loader);
      held = {
        ...held,
        [page]: { loader: answer.loader, answer: answer.kind, scope, discarded: false },
      };
    }
    const visit = opened.get(page) ?? 0;
    opened.set(page, visit + 1);
    current = page;
    steps.push({ operation: { kind: 'open', page, visit, answer, closed }, registry, held });
  }
  return steps;
}

/** The state each page is in after a step: not asked yet, holding a new loader or a shared one. */
export function stateOf(step: RegistryStep, page: PageId): 'waiting' | 'built' | 'shared' {
  const holding = step.held[page];
  if (!holding) return 'waiting';
  return holding.answer;
}

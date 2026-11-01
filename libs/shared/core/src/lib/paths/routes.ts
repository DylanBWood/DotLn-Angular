import type { RouteQueryParams } from '@dotln-angular/models';
import { R, RA } from '@dotln-angular/utils';

export enum BasePaths {
  Board = 'board',
  Scene = 'scene',
  Machinery = 'machinery',
  Tools = 'tools',
}

export enum ChildPaths {
  Root = '',
  Catalog = 'catalog',
  Reading = 'catalog/:toolId',
}

export type { RouteQueryValue, RouteQueryParams } from '@dotln-angular/models';

export interface RouteParameters {
  readonly child?: ChildPaths;
  /** The value of each `:name` segment of the child path. */
  readonly params?: Readonly<Record<string, string>>;
  readonly path?: readonly (string | number)[];
  readonly query?: RouteQueryParams;
}

const routeSegments = R.pipe(
  R.map((segment: BasePaths | ChildPaths) => String(segment)),
  R.filter(RA.isNonEmptyString),
);

const filledSegment = (params: RouteParameters['params']) => (segment: string) => {
  if (!segment.startsWith(':')) return segment;
  const value = params?.[segment.slice(1)];
  if (value === undefined) throw new Error(`Route parameter ${segment} has no value.`);
  return value;
};

export function buildRoute(base: BasePaths, parameters: RouteParameters = {}) {
  return {
    commands: [
      '/',
      ...routeSegments([base, parameters.child ?? ChildPaths.Root])
        .flatMap((segment) => segment.split('/'))
        .map(filledSegment(parameters.params)),
      ...(parameters.path ?? []),
    ],
    queryParams: { ...parameters.query },
  };
}

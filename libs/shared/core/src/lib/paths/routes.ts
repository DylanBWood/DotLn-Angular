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
}

export type { RouteQueryValue, RouteQueryParams } from '@dotln-angular/models';

export interface RouteParameters {
  readonly child?: ChildPaths;
  readonly path?: readonly (string | number)[];
  readonly query?: RouteQueryParams;
}

const routeSegments = R.pipe(
  R.map((segment: BasePaths | ChildPaths) => String(segment)),
  R.filter(RA.isNonEmptyString),
);

export function buildRoute(base: BasePaths, parameters: RouteParameters = {}) {
  return {
    commands: [
      '/',
      ...routeSegments([base, parameters.child ?? ChildPaths.Root]),
      ...(parameters.path ?? []),
    ],
    queryParams: { ...parameters.query },
  };
}

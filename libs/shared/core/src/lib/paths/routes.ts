import { R, RA } from '@dotln-angular/utils';

export enum BasePaths {
  Board = 'board',
}

export enum ChildPaths {
  Root = '',
}

export type RouteQueryValue = string | number | boolean | null | undefined;
export type RouteQueryParams = Readonly<
  Record<string, RouteQueryValue | readonly RouteQueryValue[]>
>;

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

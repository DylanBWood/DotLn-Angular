import { R, RA } from '@dotln-angular/utils';

export enum BasePaths {
  Home = 'home',
}

export enum HomePaths {
  Root = '',
}

export type RouteQueryValue = string | number | boolean | null | undefined;
export type RouteQueryParams = Readonly<
  Record<string, RouteQueryValue | readonly RouteQueryValue[]>
>;

export interface RouteParameters {
  readonly child?: HomePaths;
  readonly path?: readonly (string | number)[];
  readonly query?: RouteQueryParams;
}

const routeSegments = R.pipe(
  R.map((segment: BasePaths | HomePaths) => String(segment)),
  R.filter(RA.isNonEmptyString),
);

export function buildRoute(base: BasePaths, parameters: RouteParameters = {}) {
  return {
    commands: [
      '/',
      ...routeSegments([base, parameters.child ?? HomePaths.Root]),
      ...(parameters.path ?? []),
    ],
    queryParams: { ...parameters.query },
  };
}

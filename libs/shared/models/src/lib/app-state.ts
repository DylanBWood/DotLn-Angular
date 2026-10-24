export interface FeatureFlags {
  readonly sourcesFooter: boolean;
}

export type RouteId = 'board';
export type RouteQueryValue = string | number | boolean | null | undefined;
export type RouteQueryParams = Readonly<
  Record<string, RouteQueryValue | readonly RouteQueryValue[]>
>;

export interface NavigationIntent {
  readonly route: RouteId;
  readonly query?: RouteQueryParams;
  readonly fragment?: string;
  readonly queryParamsHandling?: 'merge' | 'preserve' | 'replace';
}

export type AppError = {
  readonly message: string;
  readonly correlationId: string;
  readonly url?: string;
} & (
  | { readonly kind: 'http'; readonly status: number }
  | { readonly kind: 'network' | 'timeout' | 'unknown' }
);

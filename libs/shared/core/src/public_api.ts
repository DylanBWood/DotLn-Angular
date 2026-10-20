export {
  EnvironmentConfigToken,
  provideEnvironmentConfig,
} from './lib/environment/environment-config';
export type { EnvironmentConfig } from './lib/environment/environment-config';
export { AppBasePathToken, provideAppBasePath } from './lib/paths/app-base-path';
export { BasePaths, HomePaths, buildRoute } from './lib/paths/routes';
export type { RouteParameters, RouteQueryParams, RouteQueryValue } from './lib/paths/routes';
export { provideDotlnCore } from './lib/providers/provide-dotln-core';
export { provideDotlnI18n } from './lib/i18n/provide-dotln-i18n';

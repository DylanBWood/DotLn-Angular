import { InjectionToken, Provider } from '@angular/core';

export interface EnvironmentConfig {
  readonly production: boolean;
  readonly apiBaseUrl: string;
  readonly mocks: boolean;
  readonly featureFlags: Readonly<Record<string, boolean>>;
  readonly i18n: {
    readonly defaultLang: string;
    readonly availableLangs: readonly string[];
  };
  readonly auth: unknown;
}

export const EnvironmentConfigToken = new InjectionToken<EnvironmentConfig>(
  'dotln-angular.shared.core.environment-config',
);

export function provideEnvironmentConfig(config: EnvironmentConfig): Provider[] {
  return [{ provide: EnvironmentConfigToken, useValue: config }];
}

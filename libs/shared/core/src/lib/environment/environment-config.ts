import { InjectionToken, Provider } from '@angular/core';

import type { FeatureFlags } from '@dotln-angular/models';

export interface EnvironmentConfig {
  readonly production: boolean;
  readonly apiBaseUrl: string;
  readonly mocks: boolean;
  readonly featureFlags: FeatureFlags;
  readonly featureFlagOverrides: boolean;
  readonly requestTimeoutMs: number;
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

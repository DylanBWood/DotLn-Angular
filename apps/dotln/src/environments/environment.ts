import { EnvironmentConfig } from '@dotln-angular/core';

export const environment: EnvironmentConfig = {
  production: false,
  apiBaseUrl: '/api',
  mocks: true,
  featureFlags: { sourcesFooter: true },
  featureFlagOverrides: true,
  requestTimeoutMs: 10000,
  i18n: { defaultLang: 'en', availableLangs: ['en'] },
  auth: null,
};

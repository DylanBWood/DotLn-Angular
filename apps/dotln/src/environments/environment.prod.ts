import { EnvironmentConfig } from '@dotln-angular/core';

import { publicConfig } from './public-config';

export const environment: EnvironmentConfig = {
  production: true,
  apiBaseUrl: publicConfig.apiBaseUrl,
  mocks: false,
  featureFlags: publicConfig.featureFlags,
  featureFlagOverrides: false,
  requestTimeoutMs: 10000,
  i18n: { defaultLang: 'en', availableLangs: ['en'] },
  auth: null,
};

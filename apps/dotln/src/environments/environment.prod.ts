import { EnvironmentConfig } from '@dotln-angular/core';

export const environment: EnvironmentConfig = {
  production: true,
  apiBaseUrl: '/api',
  mocks: false,
  featureFlags: {},
  i18n: { defaultLang: 'en', availableLangs: ['en'] },
  auth: null,
};

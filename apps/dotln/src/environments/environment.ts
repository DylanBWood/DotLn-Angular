import { EnvironmentConfig } from '@dotln-angular/core';

export const environment: EnvironmentConfig = {
  production: false,
  apiBaseUrl: '/api',
  mocks: true,
  featureFlags: {},
  i18n: { defaultLang: 'en', availableLangs: ['en'] },
  auth: null,
};

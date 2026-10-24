import { DOCUMENT } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import {
  AppBasePathToken,
  EnvironmentConfig,
  provideAppBasePath,
  provideEnvironmentConfig,
} from '../../../src';

export function provideEnvironmentConfigTokenTestKit(overrides: Partial<EnvironmentConfig> = {}) {
  const config: EnvironmentConfig = {
    production: false,
    apiBaseUrl: '/api',
    mocks: true,
    featureFlags: { sourcesFooter: true },
    featureFlagOverrides: true,
    requestTimeoutMs: 10000,
    i18n: { defaultLang: 'en', availableLangs: ['en'] },
    auth: null,
    ...overrides,
  };

  return { config, providers: provideEnvironmentConfig(config) };
}

export function provideAppBasePathTokenTestKit(doc: Document = document) {
  return {
    document: doc,
    providers: [{ provide: DOCUMENT, useValue: doc }, ...provideAppBasePath()],
  };
}

export function provideDotlnCoreTestKit(overrides: Partial<EnvironmentConfig> = {}) {
  const environment = provideEnvironmentConfigTokenTestKit(overrides);

  return {
    config: environment.config,
    providers: [
      ...environment.providers,
      { provide: AppBasePathToken, useValue: '/' },
      provideHttpClient(),
      provideRouter([]),
    ],
  };
}

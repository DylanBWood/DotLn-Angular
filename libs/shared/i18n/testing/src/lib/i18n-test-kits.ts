import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { importProvidersFrom } from '@angular/core';
import {
  provideTranslocoMissingHandler,
  Translation,
  TranslocoTestingModule,
} from '@jsverse/transloco';
import {
  I18nConfig,
  I18nConfigToken,
  MissingTranslationHandler,
  TranslocoHttpLoader,
} from '../../../src';

export function provideI18nConfigTokenTestKit(overrides: Partial<I18nConfig> = {}) {
  const config: I18nConfig = {
    production: false,
    basePath: '/',
    defaultLang: 'en',
    availableLangs: ['en'],
    ...overrides,
  };
  return { config, providers: [{ provide: I18nConfigToken, useValue: config }] };
}

export function provideTranslocoHttpLoaderTestKit(overrides: Partial<I18nConfig> = {}) {
  const kit = provideI18nConfigTokenTestKit(overrides);
  return {
    config: kit.config,
    providers: [
      ...kit.providers,
      provideHttpClient(),
      provideHttpClientTesting(),
      TranslocoHttpLoader,
    ],
  };
}

export function provideMissingTranslationHandlerTestKit(overrides: Partial<I18nConfig> = {}) {
  const kit = provideI18nConfigTokenTestKit(overrides);
  return {
    config: kit.config,
    providers: [...kit.providers, MissingTranslationHandler],
  };
}

export interface I18nTestKitOptions {
  readonly config?: Partial<I18nConfig>;
  readonly langs?: Record<string, Translation>;
}

export function provideDotlnI18nTestKit(options: I18nTestKitOptions = {}) {
  const kit = provideI18nConfigTokenTestKit(options.config);
  const langs = options.langs ?? { en: { home: { title: 'DotLn' } } };
  return {
    config: kit.config,
    langs,
    providers: [
      ...kit.providers,
      importProvidersFrom(
        TranslocoTestingModule.forRoot({
          langs,
          preloadLangs: true,
          translocoConfig: {
            defaultLang: kit.config.defaultLang,
            availableLangs: [...kit.config.availableLangs],
            prodMode: kit.config.production,
            reRenderOnLangChange: true,
            missingHandler: { logMissingKey: false, useFallbackTranslation: false },
          },
        }),
      ),
      provideTranslocoMissingHandler(MissingTranslationHandler),
    ],
  };
}

export function provideTPipeTestKit(options: I18nTestKitOptions = {}) {
  return provideDotlnI18nTestKit(options);
}

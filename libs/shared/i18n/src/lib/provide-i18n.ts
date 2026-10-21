import { inject, makeEnvironmentProviders } from '@angular/core';
import {
  provideTransloco,
  provideTranslocoMissingHandler,
  TRANSLOCO_CONFIG,
  translocoConfig,
} from '@jsverse/transloco';

import { I18nConfig, I18nConfigToken } from './i18n-config';
import { MissingTranslationHandler } from './missing-translation-handler';
import { TranslocoHttpLoader } from './transloco-http-loader';

export function provideI18n(config: I18nConfig | (() => I18nConfig)) {
  return makeEnvironmentProviders([
    {
      provide: I18nConfigToken,
      ...(typeof config === 'function' ? { useFactory: config } : { useValue: config }),
    },
    ...provideTransloco({ config: {}, loader: TranslocoHttpLoader }),
    {
      provide: TRANSLOCO_CONFIG,
      useFactory: () => {
        const options = inject(I18nConfigToken);
        return translocoConfig({
          defaultLang: options.defaultLang,
          availableLangs: [...options.availableLangs],
          prodMode: options.production,
          reRenderOnLangChange: true,
          missingHandler: { logMissingKey: false, useFallbackTranslation: false },
        });
      },
    },
    provideTranslocoMissingHandler(MissingTranslationHandler),
  ]);
}

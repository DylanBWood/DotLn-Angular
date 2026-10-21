import { inject, Injectable } from '@angular/core';
import { TranslocoMissingHandler } from '@jsverse/transloco';

import { I18nConfigToken } from './i18n-config';

@Injectable()
export class MissingTranslationHandler implements TranslocoMissingHandler {
  readonly #config = inject(I18nConfigToken);

  handle(key: string): string {
    if (!this.#config.production) {
      throw new Error(`Missing translation: ${key}`);
    }
    return key;
  }
}

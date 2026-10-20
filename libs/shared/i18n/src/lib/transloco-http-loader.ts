import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Translation, TranslocoLoader } from '@jsverse/transloco';
import { I18nConfigToken } from './i18n-config';

@Injectable()
export class TranslocoHttpLoader implements TranslocoLoader {
  readonly #http = inject(HttpClient);
  readonly #config = inject(I18nConfigToken);

  getTranslation(lang: string) {
    if (!this.#config.availableLangs.includes(lang)) {
      throw new Error('The requested translation language is not configured.');
    }
    const base = this.#config.basePath.replace(/\/?$/, '/');
    return this.#http.get<Translation>(`${base}i18n/${encodeURIComponent(lang)}.json`);
  }
}

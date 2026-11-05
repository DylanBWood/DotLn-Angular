import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Translation, TranslocoLoader } from '@jsverse/transloco';

import { I18nConfigToken } from './i18n-config';

@Injectable()
export class TranslocoHttpLoader implements TranslocoLoader {
  readonly #http = inject(HttpClient);
  readonly #document = inject(DOCUMENT);
  readonly #config = inject(I18nConfigToken);

  getTranslation(lang: string) {
    const segments = lang.split('/');
    const language = segments.at(-1) ?? '';
    const scopeIsSafe =
      segments.length === 1 ||
      (segments.length === 2 && /^[a-zA-Z][a-zA-Z0-9-]*$/.test(segments[0]));
    if (!scopeIsSafe || !this.#config.availableLangs.includes(language)) {
      throw new Error('The requested translation language is not configured.');
    }
    const base = this.#config.basePath.replace(/\/?$/, '/');
    return this.#http.get<Translation>(
      new URL(
        `${base}i18n/${segments.map(encodeURIComponent).join('/')}.json`,
        this.#document.baseURI,
      ).href,
    );
  }
}

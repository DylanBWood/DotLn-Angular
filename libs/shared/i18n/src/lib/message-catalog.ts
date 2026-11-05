import { inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoService } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';

/** A resolved message, with named values rather than language-dependent concatenation. */
export type TranslateMessage = (
  key: string,
  parameters?: Readonly<Record<string, string | number>>,
) => string;

/** Loads feature messages on demand and binds a translator to that completed language load. */
@Injectable()
export class MessageCatalog {
  readonly #translations = inject(TranslocoService);
  readonly language = toSignal(this.#translations.langChanges$, {
    initialValue: this.#translations.getActiveLang(),
  });

  async translator(
    scopes: readonly string[],
    language = this.language(),
  ): Promise<TranslateMessage> {
    await Promise.all(
      scopes.map((scope) => firstValueFrom(this.#translations.load(`${scope}/${language}`))),
    );
    return (key, parameters) => this.#translations.translate(key, parameters, language);
  }
}

/** Install at the lazy feature boundary that needs message scopes. */
export const provideMessageCatalog = () => [MessageCatalog];

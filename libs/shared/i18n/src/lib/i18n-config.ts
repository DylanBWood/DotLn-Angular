import { InjectionToken } from '@angular/core';

export interface I18nConfig {
  readonly production: boolean;
  readonly basePath: string;
  readonly defaultLang: string;
  readonly availableLangs: readonly string[];
}

export const I18nConfigToken = new InjectionToken<I18nConfig>('dotln-angular.shared.i18n.config');

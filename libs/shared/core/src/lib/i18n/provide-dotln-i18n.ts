import { inject } from '@angular/core';
import { provideI18n } from '@dotln-angular/i18n';
import { EnvironmentConfigToken } from '../environment/environment-config';
import { AppBasePathToken } from '../paths/app-base-path';

export function provideDotlnI18n() {
  return provideI18n(() => {
    const environment = inject(EnvironmentConfigToken);
    return {
      ...environment.i18n,
      production: environment.production,
      basePath: inject(AppBasePathToken),
    };
  });
}

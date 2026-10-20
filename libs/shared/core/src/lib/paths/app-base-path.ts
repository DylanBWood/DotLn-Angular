import { DOCUMENT } from '@angular/common';
import { inject, InjectionToken, Provider } from '@angular/core';

function readAppBasePath(): string {
  return inject(DOCUMENT).querySelector('base')?.getAttribute('href') ?? '/';
}

// The app base is the sole root-factory token; applications also provide it explicitly.
export const AppBasePathToken = new InjectionToken<string>(
  'dotln-angular.shared.core.app-base-path',
  { providedIn: 'root', factory: readAppBasePath },
);

export function provideAppBasePath(): Provider[] {
  return [{ provide: AppBasePathToken, useFactory: readAppBasePath }];
}

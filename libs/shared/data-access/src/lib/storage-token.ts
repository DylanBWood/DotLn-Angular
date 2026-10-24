import { DOCUMENT } from '@angular/common';
import { inject, InjectionToken } from '@angular/core';

import type { BrowserStorage } from './types';

export const StorageToken = new InjectionToken<BrowserStorage | null>(
  'dotln-angular.shared.data-access.storage',
);

export function provideDotlnStorage() {
  return [
    {
      provide: StorageToken,
      useFactory: () => {
        const document = inject(DOCUMENT);

        try {
          return document.defaultView?.localStorage ?? null;
        } catch {
          return null;
        }
      },
    },
  ];
}

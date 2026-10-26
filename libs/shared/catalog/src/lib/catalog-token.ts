import { InjectionToken } from '@angular/core';

import type { CatalogLoader } from './types';

export const CatalogToken = new InjectionToken<CatalogLoader>(
  'dotln-angular.shared.catalog.loader',
);

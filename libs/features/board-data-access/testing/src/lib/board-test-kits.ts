import type { EnvironmentConfig } from '@dotln-angular/core';
import {
  provideDotlnHttpTestKit,
  provideStorageTokenTestKit,
} from '@dotln-angular/data-access/testing';

import { BoardApi, provideBoardDataAccess } from '../../../src';

export function provideBoardApiTestKit(overrides: Partial<EnvironmentConfig> = {}) {
  return { providers: [...provideDotlnHttpTestKit(overrides).providers, BoardApi] };
}

export function provideBoardStoreTestKit(overrides: Partial<EnvironmentConfig> = {}) {
  const storage = provideStorageTokenTestKit();

  return {
    ...storage,
    providers: [
      ...provideDotlnHttpTestKit(overrides).providers,
      ...storage.providers,
      ...provideBoardDataAccess(),
    ],
  };
}

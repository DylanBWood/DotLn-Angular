import { provideRouter } from '@angular/router';

import { catalogFixture, provideCatalogTestKit } from '@dotln-angular/catalog/testing';
import { provideStorageTokenTestKit } from '@dotln-angular/data-access/testing';
import { provideDotlnI18nTestKit } from '@dotln-angular/i18n/testing';
import type { Tool } from '@dotln-angular/models';
import { provideDotlnStateTestKit } from '@dotln-angular/state/testing';
import { provideDotlnUi } from '@dotln-angular/ui';

import { ToolsFacade } from '../../../src/lib/facades/tools.facade';
import en from './tools-en.json';

export function provideToolsFacadeTestKit(tools: readonly Tool[] = catalogFixture) {
  const catalog = provideCatalogTestKit(tools);
  const storage = provideStorageTokenTestKit();
  return {
    catalog,
    storage,
    providers: [
      ...provideDotlnStateTestKit().providers,
      ...storage.providers,
      ...catalog.providers,
      ...provideDotlnI18nTestKit({ langs: { en } }).providers,
      provideRouter([]),
      provideDotlnUi(),
      ToolsFacade,
    ],
  };
}

export function provideToolsTestKit(tools: readonly Tool[] = catalogFixture) {
  return provideToolsFacadeTestKit(tools);
}

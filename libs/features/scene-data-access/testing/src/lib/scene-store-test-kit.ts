import { provideDispatcher } from '@ngrx/signals/events';

import type { BrowserStorage } from '@dotln-angular/data-access';
import { provideStorageTokenTestKit } from '@dotln-angular/data-access/testing';

import { provideSceneDataAccess } from '../../../src';

export function provideSceneStoreTestKit(backing?: BrowserStorage) {
  const storage = provideStorageTokenTestKit(backing);

  return {
    ...storage,
    providers: [provideDispatcher(), ...storage.providers, ...provideSceneDataAccess()],
  };
}

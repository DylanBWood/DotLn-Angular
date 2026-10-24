import { provideDispatcher } from '@ngrx/signals/events';

import type { EnvironmentConfig } from '@dotln-angular/core';
import { provideEnvironmentConfigTokenTestKit } from '@dotln-angular/core/testing';

import type { BrowserStorage } from '../../../src';
import { provideDotlnHttp, StorageToken } from '../../../src';

export function provideStorageTokenTestKit(storage?: BrowserStorage | null) {
  const values = new Map<string, string>();
  const writes: { readonly key: string; readonly value: string }[] = [];
  const fake: BrowserStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
      writes.push({ key, value });
    },
    removeItem: (key) => {
      values.delete(key);
    },
  };

  return {
    values,
    writes,
    storage: storage === undefined ? fake : storage,
    providers: [{ provide: StorageToken, useValue: storage === undefined ? fake : storage }],
  };
}

export function provideDotlnHttpTestKit(overrides: Partial<EnvironmentConfig> = {}) {
  const environment = provideEnvironmentConfigTokenTestKit({
    apiBaseUrl: 'http://localhost/api',
    ...overrides,
  });

  return {
    config: environment.config,
    providers: [...environment.providers, provideDispatcher(), provideDotlnHttp()],
  };
}

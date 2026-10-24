import type { setLoading, withStorageSync } from '@angular-architects/ngrx-toolkit';
import type { EmptyFeatureResult } from '@ngrx/signals';
import type { EventCreator } from '@ngrx/signals/events';
import type { Observable } from 'rxjs';

import type { AppError } from '@dotln-angular/models';

export type BrowserStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export type CommandCallState = ReturnType<typeof setLoading>;

export interface CommandConfig<Payload, Result> {
  readonly trigger: EventCreator<string, Payload>;
  readonly success: EventCreator<string, Result>;
  readonly failure: EventCreator<string, AppError>;
  readonly call: (payload: Payload) => Observable<Result>;
}

export interface PersistedStateConfig<State extends object> {
  readonly key: string;
  readonly select: (state: State) => unknown;
  readonly restore: (value: unknown) => Partial<State> | undefined;
}

export type StorageFeatureInput<State extends object> = Omit<EmptyFeatureResult, 'state'> & {
  state: State;
};

export type StorageStrategy<State extends object> = Parameters<
  typeof withStorageSync<StorageFeatureInput<State>>
>[1];

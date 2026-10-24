import type { EnvironmentConfig } from '@dotln-angular/core';
import { provideDotlnCoreTestKit } from '@dotln-angular/core/testing';

import { DotlnErrorHandler, provideDotlnState } from '../../../src';

export function provideDotlnStateTestKit(overrides: Partial<EnvironmentConfig> = {}) {
  return { providers: [...provideDotlnCoreTestKit(overrides).providers, provideDotlnState()] };
}

export function provideDotlnErrorHandlerTestKit() {
  return { providers: [...provideDotlnStateTestKit().providers, DotlnErrorHandler] };
}

export function provideFeatureFlagStoreTestKit(overrides: Partial<EnvironmentConfig> = {}) {
  return provideDotlnStateTestKit(overrides);
}

export function provideErrorStoreTestKit() {
  return provideDotlnStateTestKit();
}

export function provideNavigationStoreTestKit() {
  return provideDotlnStateTestKit();
}

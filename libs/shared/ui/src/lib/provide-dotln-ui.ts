import { A11yModule } from '@angular/cdk/a11y';
import { OverlayModule } from '@angular/cdk/overlay';
import { importProvidersFrom, makeEnvironmentProviders } from '@angular/core';

export function provideDotlnUi() {
  return makeEnvironmentProviders([importProvidersFrom(A11yModule, OverlayModule)]);
}

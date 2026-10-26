import { A11yModule } from '@angular/cdk/a11y';
import { importProvidersFrom, makeEnvironmentProviders } from '@angular/core';

export function provideDotlnUi() {
  // Overlay providers come from the menu's own imports when that component loads.
  return makeEnvironmentProviders([importProvidersFrom(A11yModule)]);
}

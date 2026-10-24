import { provideDotlnStateTestKit } from '@dotln-angular/state/testing';

import { ShellFacade } from '../../../src/lib/facades/shell.facade';

export function provideShellFacadeTestKit() {
  return { providers: [...provideDotlnStateTestKit().providers, ShellFacade] };
}

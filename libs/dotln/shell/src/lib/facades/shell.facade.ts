import { computed, inject, Injectable } from '@angular/core';

import { ErrorStore } from '@dotln-angular/state';

@Injectable()
export class ShellFacade {
  readonly #errors = inject(ErrorStore);
  readonly vm = computed(() => ({ latest: this.#errors.latest(), count: this.#errors.count() }));

  dismiss() {
    const error = this.#errors.latest();
    if (error) this.#errors.dismiss(error.correlationId);
  }
}

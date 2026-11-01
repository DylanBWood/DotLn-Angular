import { computed, inject, Injectable } from '@angular/core';
import { Dispatcher } from '@ngrx/signals/events';

import { CatalogStore, summaryShelf } from '@dotln-angular/catalog';
import { toolsHomeEvents } from '@dotln-angular/events';

/** The Tools home reads the summaries and the stored history, and loads no work. */
@Injectable()
export class ToolsHomeFacade {
  readonly #store = inject(CatalogStore);
  readonly #dispatcher = inject(Dispatcher);
  readonly vm = computed(() => {
    const summary = this.#store.summary();
    const id = this.#store.history()[0];
    return {
      works: summary ? summaryShelf(summary) : [],
      last: id ? { id, title: this.#store.lastTitle() } : null,
      failed: this.#store.summaryFailure() !== null,
    };
  });

  constructor() {
    this.#dispatcher.dispatch(toolsHomeEvents.opened());
  }
  retry() {
    this.#dispatcher.dispatch(toolsHomeEvents.retryRequested());
  }
}

import { computed, inject, Injectable } from '@angular/core';
import { Dispatcher } from '@ngrx/signals/events';

import {
  availableCatalogOptions,
  CatalogStore,
  emptyCatalogFilters,
  filterCatalog,
  isCatalogFilters,
} from '@dotln-angular/catalog';
import { catalogPageEvents } from '@dotln-angular/events';
import type { CatalogFilters, ToolId } from '@dotln-angular/models';

@Injectable()
export class ToolsFacade {
  readonly #store = inject(CatalogStore);
  readonly #dispatcher = inject(Dispatcher);
  readonly options = computed(() => availableCatalogOptions(this.#store.tools()));
  readonly vm = computed(() => {
    const tools = filterCatalog(this.#store.tools(), this.#store.filters());
    const pages = Math.max(1, Math.ceil(tools.length / 50));
    const page = Math.min(this.#store.page(), pages - 1);
    return {
      filters: this.#store.filters(),
      total: tools.length,
      catalogTotal: this.#store.tools().length,
      loading: this.#store.loading(),
      failed: this.#store.failure() !== null,
      rows: tools.slice(page * 50, (page + 1) * 50),
      page,
      pages,
      selected: tools.find((tool) => tool.id === this.#store.selectedId()) ?? null,
    };
  });

  constructor() {
    this.#dispatcher.dispatch(catalogPageEvents.opened());
  }

  filter(key: keyof CatalogFilters, value: string) {
    const filters = { ...this.#store.filters(), [key]: value === '' ? null : value };
    if (isCatalogFilters(filters))
      this.#dispatcher.dispatch(catalogPageEvents.filtersChanged(filters));
  }

  reset() {
    this.#dispatcher.dispatch(catalogPageEvents.filtersChanged(emptyCatalogFilters));
  }
  retry() {
    this.#dispatcher.dispatch(catalogPageEvents.retryRequested());
  }
  select(id: ToolId) {
    if (this.vm().rows.some((tool) => tool.id === id))
      this.#dispatcher.dispatch(catalogPageEvents.toolSelected(id));
  }
  revealSelected() {
    const index = filterCatalog(this.#store.tools(), this.#store.filters()).findIndex(
      (tool) => tool.id === this.#store.selectedId(),
    );
    if (index >= 0) this.page(Math.floor(index / 50));
  }
  page(index: number) {
    if (index >= 0 && index < this.vm().pages)
      this.#dispatcher.dispatch(catalogPageEvents.pageChanged(index));
  }
}

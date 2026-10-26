import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { BasePaths, buildRoute } from '@dotln-angular/core';
import { TPipe, translateSignal } from '@dotln-angular/i18n';
import type { CatalogFilters, ToolId } from '@dotln-angular/models';
import { DotlnFilterMenu } from '@dotln-angular/ui/menu';

import { ToolFaces } from '../../composites/tool-faces/tool-faces';
import { ToolList } from '../../composites/tool-list/tool-list';
import { ToolsFacade } from '../../facades/tools.facade';

@Component({
  selector: 'tools-catalog-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './catalog-page.html',
  styleUrl: './catalog-page.scss',
  providers: [ToolsFacade],
  imports: [TPipe, RouterLink, DotlnFilterMenu, ToolList, ToolFaces],
})
export class CatalogPage {
  readonly facade = inject(ToolsFacade);
  readonly #injector = inject(Injector);
  protected readonly details = viewChild<ElementRef<HTMLElement>>('details');
  protected readonly list = viewChild<unknown, ElementRef<HTMLElement>>('list', {
    read: ElementRef,
  });
  readonly home = buildRoute(BasePaths.Tools);
  readonly #all = translateSignal('tools.filters.all');
  readonly #labels = {
    work: translateSignal('tools.filters.work'),
    kind: translateSignal('tools.filters.kind'),
    scene: translateSignal('tools.filters.scene'),
    transform: translateSignal('tools.filters.transform'),
    status: translateSignal('tools.filters.status'),
  };
  readonly filters = computed(() =>
    (Object.keys(this.facade.options()) as (keyof CatalogFilters)[]).map((key) => ({
      key,
      label: this.#labels[key](),
      options: [
        { id: '', label: this.#all() },
        ...this.facade.options()[key].map((value) => ({ id: value, label: value })),
      ],
    })),
  );

  select(id: ToolId) {
    this.facade.select(id);
    afterNextRender(() => this.#focus(this.details()?.nativeElement), {
      injector: this.#injector,
    });
  }

  backToList() {
    this.facade.revealSelected();
    afterNextRender(
      () =>
        this.#focus(this.list()?.nativeElement.querySelector<HTMLElement>('[aria-pressed="true"]')),
      { injector: this.#injector },
    );
  }

  #focus(element: HTMLElement | null | undefined) {
    element?.focus({ preventScroll: true });
    element?.scrollIntoView?.({ block: 'nearest', behavior: 'instant' });
  }
}

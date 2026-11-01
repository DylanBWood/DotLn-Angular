import { Location } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  viewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { BasePaths, buildRoute, ChildPaths } from '@dotln-angular/core';
import { TPipe } from '@dotln-angular/i18n';
import type { ToolId, WorkSlug } from '@dotln-angular/models';
import { DotlnFilterMenu } from '@dotln-angular/ui/menu';

import { CatalogSearch } from '../../composites/catalog-search/catalog-search';
import { ContentsList } from '../../composites/contents-list/contents-list';
import { ReadingHistory } from '../../composites/reading-history/reading-history';
import { WorkShelf } from '../../composites/work-shelf/work-shelf';
import { ToolsFacade } from '../../facades/tools.facade';
import { CatalogLayout } from '../../layouts/catalog-layout/catalog-layout';
import { ReadingMapper } from '../../mappers/reading-mapper/reading-mapper';

const readingRoute = (id: ToolId) =>
  buildRoute(BasePaths.Tools, { child: ChildPaths.Reading, params: { toolId: id } });

@Component({
  selector: 'tools-catalog-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './catalog-page.html',
  styleUrl: './catalog-page.scss',
  providers: [ToolsFacade],
  imports: [
    TPipe,
    RouterLink,
    DotlnFilterMenu,
    CatalogSearch,
    ContentsList,
    ReadingHistory,
    WorkShelf,
    CatalogLayout,
    ReadingMapper,
  ],
})
export class CatalogPage {
  readonly facade = inject(ToolsFacade);
  readonly vm = this.facade.vm;
  /** The reading the address names, bound from the route. */
  readonly toolId = input<string>();
  readonly #injector = inject(Injector);
  readonly #router = inject(Router);
  readonly #location = inject(Location);
  protected readonly reading = viewChild<ElementRef<HTMLElement>>('reading');
  readonly home = buildRoute(BasePaths.Tools);
  readonly catalog = buildRoute(BasePaths.Tools, { child: ChildPaths.Catalog });
  readonly readingLink = (id: ToolId) => readingRoute(id).commands;
  readonly sceneRoute = (tool: ToolId) => buildRoute(BasePaths.Scene, { query: { tool } });
  /** Every link to a reading is a real address, so it can be copied or opened in a new tab. */
  readonly hrefFor = (id: ToolId) =>
    this.#location.prepareExternalUrl(
      this.#router.serializeUrl(this.#router.createUrlTree(readingRoute(id).commands)),
    );
  /** The address names a concept the catalog does not have. */
  readonly unknownReading = computed(
    () => this.facade.loaded() && this.toolId() !== undefined && this.vm().selected === null,
  );

  constructor() {
    let settled = false;
    effect(() => {
      const id = this.toolId();
      if (!this.facade.loaded()) return;
      const changed = this.facade.arrive(id);
      // The page also starts here when a link opens it, so its first reading takes the focus.
      if (id !== undefined && (changed || !settled)) this.#focusReading();
      settled = true;
    });
  }
  open(id: ToolId) {
    this.facade.open(id);
    void this.#router.navigate(readingRoute(id).commands);
    this.#focusReading();
  }
  back() {
    const id = this.facade.back();
    if (id) void this.#router.navigate(readingRoute(id).commands);
    this.#focusReading();
  }
  chooseWork(work: WorkSlug) {
    this.facade.chooseWork(work);
    if (this.toolId() !== undefined) void this.#router.navigate(this.catalog.commands);
  }
  #focusReading() {
    afterNextRender(
      () => {
        const element = this.reading()?.nativeElement;
        element?.focus({ preventScroll: true });
        element?.scrollIntoView?.({ block: 'start', behavior: 'instant' });
      },
      { injector: this.#injector },
    );
  }
}

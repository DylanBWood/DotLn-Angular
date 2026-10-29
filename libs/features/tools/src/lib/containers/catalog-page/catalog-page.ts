import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  Injector,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { BasePaths, buildRoute } from '@dotln-angular/core';
import { TPipe } from '@dotln-angular/i18n';
import type { ToolId } from '@dotln-angular/models';
import { DotlnFilterMenu } from '@dotln-angular/ui/menu';

import { ArriveStudy } from '../../composites/arrive-study/arrive-study';
import { CatalogSearch } from '../../composites/catalog-search/catalog-search';
import { ContentsList } from '../../composites/contents-list/contents-list';
import { ReadingHistory } from '../../composites/reading-history/reading-history';
import { WorkShelf } from '../../composites/work-shelf/work-shelf';
import { ToolsFacade } from '../../facades/tools.facade';
import { CatalogLayout } from '../../layouts/catalog-layout/catalog-layout';
import { ReadingMapper } from '../../mappers/reading-mapper/reading-mapper';

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
    ArriveStudy,
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
  readonly #injector = inject(Injector);
  protected readonly reading = viewChild<ElementRef<HTMLElement>>('reading');
  readonly home = buildRoute(BasePaths.Tools);

  open(id: ToolId, relation = false) {
    if (relation) this.facade.follow(id);
    else this.facade.open(id);
    this.#focusReading();
  }
  back() {
    this.facade.back();
    this.#focusReading();
  }
  showStudyMoment(step: number) {
    this.facade.scrubStudy(step);
    afterNextRender(
      () => {
        const slider =
          this.reading()?.nativeElement.querySelector<HTMLInputElement>('#arrive-time');
        slider?.focus({ preventScroll: true });
        slider?.closest('figure')?.scrollIntoView({ block: 'start', behavior: 'instant' });
      },
      { injector: this.#injector },
    );
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

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { TPipe } from '@dotln-angular/i18n';
import {
  DotlnBadge,
  DotlnButton,
  DotlnEmptyState,
  DotlnPageHeader,
  DotlnSkeleton,
  DotlnTabList,
  DotlnTabPanel,
  DotlnTabs,
  DotlnUnavailable,
} from '@dotln-angular/ui';

import { BoardPanel } from '../../composites/board-panel/board-panel';
import { BoardFacade } from '../../facades/board.facade';
import { BoardLayout } from '../../layouts/board-layout/board-layout';
import { CellValueMapper } from '../../mappers/cell-value-mapper/cell-value-mapper';
import { LinkMapper } from '../../mappers/link-mapper/link-mapper';

@Component({
  selector: 'board-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './board-page.html',
  styleUrl: './board-page.scss',
  imports: [
    TPipe,
    DotlnTabs,
    DotlnTabList,
    DotlnTabPanel,
    DotlnPageHeader,
    DotlnUnavailable,
    DotlnBadge,
    DotlnSkeleton,
    DotlnEmptyState,
    DotlnButton,
    BoardLayout,
    BoardPanel,
    CellValueMapper,
    LinkMapper,
  ],
})
export class BoardPage {
  readonly facade = inject(BoardFacade);
  readonly vm = this.facade.vm;
}

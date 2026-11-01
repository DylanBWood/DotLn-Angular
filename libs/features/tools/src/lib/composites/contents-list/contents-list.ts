import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { TPipe } from '@dotln-angular/i18n';
import type { CatalogChapter, ToolId } from '@dotln-angular/models';
import { DotlnIcon } from '@dotln-angular/ui';

import { isPlainClick } from '../../plain-click';

@Component({
  selector: 'tools-contents-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './contents-list.html',
  styleUrl: './contents-list.scss',
  imports: [TPipe, DotlnIcon],
})
export class ContentsList {
  readonly chapters = input.required<readonly CatalogChapter[]>();
  readonly chapter = input<string | null>(null);
  readonly section = input<string | null>(null);
  readonly selectedId = input<ToolId | null>(null);
  readonly studied = input<ReadonlySet<ToolId>>(new Set());
  readonly hrefFor = input.required<(id: ToolId) => string>();
  readonly chapterChosen = output<string>();
  readonly sectionChosen = output<string>();
  readonly opened = output<ToolId>();

  open(event: MouseEvent, id: ToolId) {
    if (!isPlainClick(event)) return;
    event.preventDefault();
    this.opened.emit(id);
  }
}

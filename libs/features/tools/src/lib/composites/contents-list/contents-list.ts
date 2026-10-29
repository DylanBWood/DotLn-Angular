import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { TPipe } from '@dotln-angular/i18n';
import type { CatalogChapter, ToolId } from '@dotln-angular/models';

@Component({
  selector: 'tools-contents-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './contents-list.html',
  styleUrl: './contents-list.scss',
  imports: [TPipe],
})
export class ContentsList {
  readonly chapters = input.required<readonly CatalogChapter[]>();
  readonly chapter = input<string | null>(null);
  readonly section = input<string | null>(null);
  readonly selectedId = input<ToolId | null>(null);
  readonly chapterChosen = output<string>();
  readonly sectionChosen = output<string>();
  readonly opened = output<ToolId>();
}

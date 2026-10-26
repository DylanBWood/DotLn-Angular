import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { TPipe } from '@dotln-angular/i18n';
import type { Tool, ToolId } from '@dotln-angular/models';

@Component({
  selector: 'tools-tool-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tool-list.html',
  styleUrl: './tool-list.scss',
  imports: [TPipe],
})
export class ToolList {
  readonly tools = input.required<readonly Tool[]>();
  readonly selectedId = input<ToolId | null>(null);
  readonly selected = output<ToolId>();
}

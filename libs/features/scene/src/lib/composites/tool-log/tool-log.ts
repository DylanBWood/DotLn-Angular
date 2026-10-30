import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { TPipe } from '@dotln-angular/i18n';
import { DotlnButton } from '@dotln-angular/ui';

import type { LogView } from '../../models/scene-view-model';

/** The composition in hand: its steps and note, what can be done with it, what was saved. */
@Component({
  selector: 'scene-tool-log',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tool-log.html',
  styleUrl: './tool-log.scss',
  imports: [DotlnButton, TPipe],
})
export class ToolLog {
  readonly log = input.required<LogView>();

  readonly cleared = output<void>();
  readonly opened = output<string>();
  readonly exported = output<void>();
  readonly imported = output<string>();
}

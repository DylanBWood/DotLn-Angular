import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { TPipe } from '@dotln-angular/i18n';
import type { ToolId } from '@dotln-angular/models';
import { DotlnButton } from '@dotln-angular/ui';

import type { RailView } from '../../models/scene-view-model';

export interface RailChoice {
  readonly id: ToolId;
  readonly pattern?: number;
}

/** The tools the engine runs, grouped by what they do, each name in its work's colour. */
@Component({
  selector: 'scene-toolbox-rail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './toolbox-rail.html',
  styleUrl: './toolbox-rail.scss',
  imports: [DotlnButton, TPipe],
})
export class ToolboxRail {
  readonly rail = input.required<RailView>();
  readonly chosen = output<RailChoice>();
  readonly retried = output<void>();
}

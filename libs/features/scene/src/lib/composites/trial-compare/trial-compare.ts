import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { TPipe } from '@dotln-angular/i18n';
import { DotlnButton } from '@dotln-angular/ui';

import { chartHeight, chartWidth } from '../../mappers/metric-mapper';
import type { TrialView } from '../../models/scene-view-model';

/** Two branches side by side: the same metric as two lines, the first divergence marked. */
@Component({
  selector: 'scene-trial-compare',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './trial-compare.html',
  styleUrl: './trial-compare.scss',
  imports: [DotlnButton, TPipe],
})
export class TrialCompare {
  readonly trial = input.required<TrialView>();
  readonly kept = output<void>();
  readonly closed = output<void>();

  protected readonly height = chartHeight;
  protected readonly viewBox = `0 0 ${chartWidth} ${chartHeight}`;
}

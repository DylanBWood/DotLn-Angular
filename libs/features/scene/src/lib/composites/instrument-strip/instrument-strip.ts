import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { TPipe } from '@dotln-angular/i18n';
import { DotlnButton } from '@dotln-angular/ui';

import { sparklineHeight, sparklineWidth } from '../../mappers/metric-mapper';
import type { InstrumentView, LabelSet, TransportView } from '../../models/scene-view-model';

/** The transport, then each metric as a large figure with a small label and a sparkline. */
@Component({
  selector: 'scene-instrument-strip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './instrument-strip.html',
  styleUrl: './instrument-strip.scss',
  imports: [DotlnButton, TPipe],
})
export class InstrumentStrip {
  readonly instruments = input.required<readonly InstrumentView[]>();
  readonly transport = input.required<TransportView>();
  /** While a comparison is open its charts stand in the instruments' place. */
  readonly comparing = input(false);

  readonly played = output<void>();
  readonly paused = output<void>();
  readonly stepped = output<void>();
  readonly restarted = output<void>();
  readonly forked = output<void>();
  readonly compared = output<void>();
  readonly saved = output<void>();
  readonly feelToggled = output<void>();
  readonly labelSetChanged = output<LabelSet>();

  protected readonly viewBox = `0 0 ${sparklineWidth} ${sparklineHeight}`;
}

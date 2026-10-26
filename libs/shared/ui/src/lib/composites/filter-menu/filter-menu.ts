import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import type { MenuOption } from '../../types';
import { DotlnMenu } from '../../wrappers/menu/menu';

@Component({
  selector: 'dotln-filter-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dotln-menu [label]="label()" [options]="options()" (selected)="selected.emit($event)" />
    <span translate="no">{{ value() ?? allLabel() }}</span>
  `,
  styles: `
    :host { display: grid; gap: 0.4rem; }
    span { font-size: 0.75rem; color: var(--dotln-muted); padding-inline: 0.25rem; }
  `,
  imports: [DotlnMenu],
})
export class DotlnFilterMenu {
  readonly label = input.required<string>();
  readonly options = input.required<readonly MenuOption[]>();
  readonly allLabel = input.required<string>();
  readonly value = input<string | null>(null);
  readonly selected = output<string>();
}

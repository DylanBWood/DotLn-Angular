import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'dotln-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span role="img" [attr.aria-label]="label()" translate="no">{{ glyph() }}</span>
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
    }
  `,
})
export class DotlnIcon {
  readonly glyph = input.required<string>();
  readonly label = input.required<string>();
}

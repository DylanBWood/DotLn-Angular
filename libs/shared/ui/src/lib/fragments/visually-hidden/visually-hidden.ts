import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'dotln-visually-hidden',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-content />
  `,
  styles: `
    :host {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
      border: 0;
    }
  `,
})
export class DotlnVisuallyHidden {}

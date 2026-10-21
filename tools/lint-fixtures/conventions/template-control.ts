import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'dotln-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-content />
  `,
})
export class Example {}

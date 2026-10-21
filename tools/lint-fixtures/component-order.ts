import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  template: ` <ng-content /> `,
  selector: 'dotln-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [],
})
export class Example {}

import { Tabs } from '@angular/aria/tabs';
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'dotln-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-content />
  `,
  styles: `
    :host {
      display: block;
      min-inline-size: 0;
    }
  `,
  hostDirectives: [Tabs],
})
export class DotlnTabs {}

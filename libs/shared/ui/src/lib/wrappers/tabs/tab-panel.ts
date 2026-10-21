import { TabContent, TabPanel } from '@angular/aria/tabs';
import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, TemplateRef } from '@angular/core';

@Component({
  selector: 'dotln-tab-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div ngTabPanel [value]="value()" #panel="ngTabPanel" [hidden]="!panel.visible()">
      <ng-template ngTabContent><ng-container [ngTemplateOutlet]="content()" /></ng-template>
    </div>
  `,
  styles: `
    :host {
      display: contents;
    }
    [hidden] {
      display: none;
    }
    [ngTabPanel]:focus-visible {
      outline: var(--dotln-focus);
      outline-offset: 4px;
    }
  `,
  imports: [TabPanel, TabContent, NgTemplateOutlet],
})
export class DotlnTabPanel {
  readonly value = input.required<string>();
  readonly content = input.required<TemplateRef<unknown>>();
}

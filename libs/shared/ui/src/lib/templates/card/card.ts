import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'dotln-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="header"><ng-content select="[card-header]" /></div>
    <div class="body"><ng-content select="[card-body]" /></div>
    <div class="actions"><ng-content select="[card-actions]" /></div>
  `,
  styles: `
    :host {
      display: block;
      border: 1px solid var(--dotln-border);
      border-radius: var(--dotln-radius);
      background: var(--dotln-surface);
      overflow: clip;
    }
    .header,
    .body,
    .actions {
      padding: var(--dotln-space-4);
    }
    .header {
      border-block-end: 1px solid var(--dotln-border);
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--dotln-space-2);
    }
    .header:empty,
    .body:empty,
    .actions:empty {
      display: none;
    }
  `,
})
export class DotlnCard {}

import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'board-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header"><ng-content select="[page-header]" /></div>
    <div class="panel-tabs"><ng-content select="[panel-tabs]" /></div>
    <div class="panel-content"><ng-content select="[panel-content]" /></div>
    <div class="sources-footer"><ng-content select="[sources-footer]" /></div>
  `,
  styles: `
    :host {
      display: grid;
      gap: 2rem;
      min-inline-size: 0;
    }
    .panel-content {
      min-inline-size: 0;
    }
    .sources-footer {
      border-block-start: 1px solid var(--dotln-border-strong);
      padding-block-start: 1.5rem;
    }
  `,
})
export class BoardLayout {}

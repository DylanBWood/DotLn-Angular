import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'tools-catalog-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="catalog">
      <div class="search"><ng-content select="[search]" /></div>
      <div class="shelf"><ng-content select="[shelf]" /></div>
      <div class="contents"><ng-content select="[contents]" /></div>
      <div class="reading"><ng-content select="[reading]" /></div>
      <div class="history"><ng-content select="[history]" /></div>
    </div>
  `,
  styleUrl: './catalog-layout.scss',
})
export class CatalogLayout {}

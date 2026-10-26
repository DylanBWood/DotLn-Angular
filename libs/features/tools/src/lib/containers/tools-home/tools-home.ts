import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

import { BasePaths, buildRoute, ChildPaths } from '@dotln-angular/core';
import { TPipe, translateSignal } from '@dotln-angular/i18n';
import { DotlnKeyValueList } from '@dotln-angular/ui';

@Component({
  selector: 'tools-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>{{ 'tools.home.title' | t }}</h1>
    <p>{{ 'tools.home.description' | t }}</p>
    <dotln-key-value-list [items]="items()" [valueTemplate]="utility" scope="tools" />
    <ng-template #utility>
      <a [routerLink]="catalog.commands">{{ 'tools.home.openCatalog' | t }}</a>
    </ng-template>
  `,
  styles: `
    :host { display: block; overflow-wrap: anywhere; }
    h1 { font-size: clamp(1.75rem, 4vw, 2.5rem); letter-spacing: -0.035em; }
    a { color: var(--dotln-accent); }
    a:focus-visible { outline: var(--dotln-focus); outline-offset: 3px; }
  `,
  imports: [TPipe, RouterLink, DotlnKeyValueList],
})
export class ToolsHome {
  readonly #title = translateSignal('tools.catalog.title');
  readonly items = computed(() => [{ key: 'catalog', label: this.#title() }]);
  readonly catalog = buildRoute(BasePaths.Tools, { child: ChildPaths.Catalog });
}

import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';

import { AppBasePathToken, BasePaths, buildRoute } from '@dotln-angular/core';
import { TPipe } from '@dotln-angular/i18n';
import type { Link, PanelId } from '@dotln-angular/models';

@Component({
  selector: 'board-link-mapper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (href(); as destination) {
      <a [href]="destination" (click)="activate($event)" translate="no">{{ link().label }}</a>
    } @else {
      <span class="unresolved">
        <span translate="no">{{ link().label }}</span>
        <span>{{ 'board.targetUnavailable' | t }}</span>
      </span>
    }
  `,
  styles: `
    a {
      color: var(--dotln-accent);
      text-underline-offset: 0.2em;
      font-size: 0.8rem;
      line-height: 1.6;
      overflow-wrap: anywhere;
    }
    a:hover {
      text-decoration-thickness: 2px;
    }
    a:focus-visible {
      outline: var(--dotln-focus);
      outline-offset: 3px;
      border-radius: 2px;
    }
    .unresolved {
      color: var(--dotln-muted);
      font-size: 0.8rem;
    }
  `,
  imports: [TPipe],
})
export class LinkMapper {
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  readonly #query = toSignal(this.#route.queryParams, {
    initialValue: this.#route.snapshot.queryParams,
  });
  readonly #base = inject(AppBasePathToken);

  readonly link = input.required<Link>();
  readonly targets = input.required<ReadonlyMap<string, PanelId | null>>();
  readonly followed = output<Link>();

  readonly href = computed(() => {
    if (!this.targets().has(this.link().target)) return null;

    const route = buildRoute(BasePaths.Board);
    const url = this.#router.serializeUrl(
      this.#router.createUrlTree(route.commands, {
        fragment: this.link().target,
        queryParams: this.#query(),
      }),
    );

    return this.#base.replace(/\/?$/, '/') + url.replace(/^\//, '');
  });

  activate(event: MouseEvent) {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)
      return;

    event.preventDefault();
    if (this.href()) this.followed.emit(this.link());
  }
}

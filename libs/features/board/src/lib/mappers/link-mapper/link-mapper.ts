import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { TPipe } from '@dotln-angular/i18n';
import type { Link, PanelId } from '@dotln-angular/models';

@Component({
  selector: 'board-link-mapper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (href(); as destination) {
      <a [href]="destination" (click)="activate($event)" translate="no">{{ link().label }}</a>
    } @else {
      <span class="unresolved"
        ><span translate="no">{{ link().label }}</span>
        <span>{{ 'board.targetUnavailable' | t }}</span></span
      >
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
  readonly link = input.required<Link>();
  readonly targets = input.required<ReadonlyMap<string, PanelId | null>>();
  readonly followed = output<Link>();
  readonly href = computed(() =>
    this.targets().has(this.link().target) ? `#${encodeURIComponent(this.link().target)}` : null,
  );

  activate(event: Event) {
    event.preventDefault();
    if (this.href()) this.followed.emit(this.link());
  }
}

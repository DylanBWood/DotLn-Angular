import { ChangeDetectionStrategy, Component } from '@angular/core';

import { TPipe } from '@dotln-angular/i18n';

@Component({
  selector: 'dotln-app-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="skip-link" href="#main-content" (click)="skipToMain($event, main)">{{ 'shell.skipToMain' | t }}</a>
    <header>
      <ng-content select="[header]" />
    </header>
    <nav [attr.aria-label]="'shell.navigation' | t">
      <ng-content select="[nav]" />
    </nav>
    <ng-content select="[notices]" />
    <main id="main-content" tabindex="-1" #main>
      <ng-content select="[main]" />
    </main>
    <footer>
      <ng-content select="[footer]" />
    </footer>
  `,
  styleUrl: './app-layout.scss',
  imports: [TPipe],
})
export class DotlnAppLayout {
  // A fragment navigation resolves against <base href> and reloads the application,
  // which resets the routed state; focus the landmark in place instead.
  skipToMain(event: Event, main: HTMLElement) {
    event.preventDefault();
    main.focus();
  }
}

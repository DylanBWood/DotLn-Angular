import { ChangeDetectionStrategy, Component } from '@angular/core';

import { TPipe } from '@dotln-angular/i18n';

@Component({
  selector: 'dotln-app-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="skip-link" href="#main-content" (click)="skipToMain($event, main)">{{ 'shell.skipToMain' | t }}</a>
    <header><ng-content select="[header]" /></header>
    <nav [attr.aria-label]="'shell.navigation' | t"><ng-content select="[nav]" /></nav>
    <main id="main-content" tabindex="-1" #main><ng-content select="[main]" /></main>
    <footer><ng-content select="[footer]" /></footer>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      min-block-size: 100dvh;
    }
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
      padding: 1.1rem clamp(1rem, 3vw, 3rem);
      border-block-end: 1px solid var(--dotln-border);
      background: var(--dotln-surface);
    }
    nav {
      display: flex;
      gap: var(--dotln-space-4);
      align-items: center;
      padding: 0.7rem clamp(1rem, 3vw, 3rem);
      background: var(--dotln-surface);
      border-block-end: 1px solid var(--dotln-border);
    }
    main {
      flex: 1;
      min-inline-size: 0;
      padding: clamp(1.25rem, 3vw, 3rem);
    }
    main:focus {
      outline: none;
    }
    main:focus-visible {
      outline: var(--dotln-focus);
      outline-offset: -5px;
    }
    footer {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      justify-content: space-between;
      padding: 1.25rem clamp(1rem, 3vw, 3rem);
      border-block-start: 1px solid var(--dotln-border);
      color: var(--dotln-muted);
      font-size: 0.75rem;
    }
    .skip-link {
      position: fixed;
      inset-block-start: 0.5rem;
      inset-inline-start: 0.5rem;
      transform: translateY(-200%);
      z-index: 10;
      padding: 0.8rem 1rem;
      border-radius: var(--dotln-radius);
      background: var(--dotln-surface);
      color: var(--dotln-ink);
    }
    .skip-link:focus {
      transform: translateY(0);
      outline: var(--dotln-focus);
    }
  `,
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

import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TPipe, translateSignal } from '@dotln-angular/i18n';

@Component({
  selector: 'dotln-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<main>
    <h1>{{ 'home.title' | t }}</h1>
  </main>`,
  imports: [TPipe],
})
export class Home {
  readonly #title = inject(Title);
  readonly #heading = translateSignal('home.title');

  constructor() {
    effect(() => this.#title.setTitle(this.#heading()));
  }
}

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { provideDotlnI18nTestKit } from '@dotln-angular/i18n/testing';

import { DotlnAppLayout } from './app-layout';

@Component({
  selector: 'dotln-shell-test',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dotln-app-layout>
      <span header></span>
      <a nav href="#main-content" translate="no">{{ heading }}</a>
      <h1 main translate="no">{{ heading }}</h1>
      <span footer></span>
    </dotln-app-layout>
  `,
  imports: [DotlnAppLayout],
})
class ShellHost {
  readonly heading = 'Workspace';
}

it('projects four landmarks and provides a focusable skip destination', async () => {
  TestBed.configureTestingModule({
    imports: [ShellHost],
    providers: [
      ...provideDotlnI18nTestKit({
        langs: {
          en: { shell: { skipToMain: 'Skip to main content', navigation: 'Primary navigation' } },
        },
      }).providers,
    ],
  });
  const fixture = TestBed.createComponent(ShellHost);
  await fixture.whenStable();
  const element: HTMLElement = fixture.nativeElement;
  for (const landmark of ['header', 'nav', 'main', 'footer'])
    expect(element.querySelector(landmark)).not.toBeNull();
  expect(element.querySelector('.skip-link')?.getAttribute('href')).toBe('#main-content');
  expect(element.querySelector('main')?.tabIndex).toBe(-1);
  expect(element.querySelector('main h1')?.textContent).toBe('Workspace');
});

it('moves focus to the main landmark from the skip link without a navigation', async () => {
  TestBed.configureTestingModule({
    imports: [ShellHost],
    providers: [
      ...provideDotlnI18nTestKit({
        langs: {
          en: { shell: { skipToMain: 'Skip to main content', navigation: 'Primary navigation' } },
        },
      }).providers,
    ],
  });
  const fixture = TestBed.createComponent(ShellHost);
  await fixture.whenStable();
  const element: HTMLElement = fixture.nativeElement;
  const activation = new MouseEvent('click', { bubbles: true, cancelable: true });
  element.querySelector('.skip-link')?.dispatchEvent(activation);
  expect(activation.defaultPrevented).toBe(true);
  expect(document.activeElement).toBe(element.querySelector('main'));
});

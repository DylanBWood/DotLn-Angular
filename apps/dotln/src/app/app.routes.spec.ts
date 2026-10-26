import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import {
  provideDotlnHttpTestKit,
  provideStorageTokenTestKit,
} from '@dotln-angular/data-access/testing';
import { provideDotlnI18nTestKit } from '@dotln-angular/i18n/testing';
import { provideDotlnStateTestKit } from '@dotln-angular/state/testing';

import en from '../../public/i18n/en.json';
import { App } from './app';
import { appRoutes } from './app.routes';

it.each(['/tools/nope', '/unknown'])(
  'renders a translated not-found page for %s inside main',
  async (url) => {
    TestBed.configureTestingModule({
      imports: [App],
      providers: [
        ...provideDotlnStateTestKit().providers,
        ...provideDotlnHttpTestKit().providers,
        ...provideStorageTokenTestKit().providers,
        ...provideDotlnI18nTestKit({ langs: { en } }).providers,
        provideRouter(appRoutes),
      ],
    });
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl(url);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('main h1')?.textContent).toBe('Page not found');
    expect(element.querySelector('main a')?.getAttribute('href')).toBe('/board');
    expect(element.querySelector('dotln-toast')).toBeNull();
    expect(appRoutes.at(-1)?.path).toBe('**');
  },
);

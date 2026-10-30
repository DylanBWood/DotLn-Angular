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

describe('App', () => {
  it('renders the board route through the shell outlet', async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        ...provideDotlnStateTestKit().providers,
        ...provideDotlnHttpTestKit().providers,
        ...provideStorageTokenTestKit().providers,
        ...provideDotlnI18nTestKit({ langs: { en } }).providers,
        provideRouter(appRoutes),
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(App);

    await TestBed.inject(Router).navigateByUrl('/');
    await fixture.whenStable();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('router-outlet')).not.toBeNull();
    expect(element.querySelector('h1')?.textContent).toBe('The soldier scene');
    expect(TestBed.inject(Router).url).toBe('/scene');
  });
});

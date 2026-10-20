import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideDotlnCoreTestKit } from '@dotln-angular/core/testing';
import { provideDotlnI18nTestKit } from '@dotln-angular/i18n/testing';
import { App } from './app';
import { appRoutes } from './app.routes';

describe('App', () => {
  it('renders the home route through the shell outlet', async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        ...provideDotlnCoreTestKit().providers,
        ...provideDotlnI18nTestKit().providers,
        provideRouter(appRoutes),
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl('/');
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('router-outlet')).not.toBeNull();
    expect(element.querySelector('h1')?.textContent).toBe('DotLn');
    expect(TestBed.inject(Router).url).toBe('/home');
  });
});

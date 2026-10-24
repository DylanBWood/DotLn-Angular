import { HttpTestingController } from '@angular/common/http/testing';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';

import {
  provideI18nConfigTokenTestKit,
  provideMissingTranslationHandlerTestKit,
  provideTPipeTestKit,
  provideTranslocoHttpLoaderTestKit,
} from '../../testing/src';
import {
  I18nConfigToken,
  MissingTranslationHandler,
  TPipe,
  TranslocoHttpLoader,
} from '../public_api';

@Component({
  selector: 'shared-translation-test',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>{{ 'home.title' | t }}</h1>
  `,
  imports: [TPipe],
})
class TranslationTest {}

describe('shared i18n', () => {
  it('provides configuration independently of an application environment', () => {
    TestBed.configureTestingModule({
      providers: [...provideI18nConfigTokenTestKit({ basePath: '/demo/' }).providers],
    });
    expect(TestBed.inject(I18nConfigToken).basePath).toBe('/demo/');
  });

  it.each(['/', '/console', '/console/'])('loads translations under %s', (basePath) => {
    TestBed.configureTestingModule({
      providers: [...provideTranslocoHttpLoaderTestKit({ basePath }).providers],
    });
    const loader = TestBed.inject(TranslocoHttpLoader);
    const http = TestBed.inject(HttpTestingController);
    let translation: unknown;
    loader.getTranslation('en').subscribe((value) => (translation = value));
    const prefix = basePath === '/' ? '/' : '/console/';
    http
      .expectOne(new URL(`${prefix}i18n/en.json`, document.baseURI).href)
      .flush({ home: { title: 'Example' } });
    expect(translation).toEqual({ home: { title: 'Example' } });
    expect(() => loader.getTranslation('../unconfigured')).toThrow('not configured');
    http.verify();
  });

  it('throws on a missing development key', () => {
    TestBed.configureTestingModule({
      providers: [...provideMissingTranslationHandlerTestKit().providers],
    });
    expect(() => TestBed.inject(MissingTranslationHandler).handle('missing.key')).toThrow(
      'Missing translation: missing.key',
    );
  });

  it('returns the missing key in production', () => {
    TestBed.configureTestingModule({
      providers: [...provideMissingTranslationHandlerTestKit({ production: true }).providers],
    });
    expect(TestBed.inject(MissingTranslationHandler).handle('missing.key')).toBe('missing.key');
  });

  it('renders the house pipe and rerenders when the active language changes', async () => {
    await TestBed.configureTestingModule({
      imports: [TranslationTest],
      providers: [
        ...provideTPipeTestKit({
          config: { availableLangs: ['en', 'fr'] },
          langs: { en: { home: { title: 'Hello' } }, fr: { home: { title: 'Bonjour' } } },
        }).providers,
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(TranslationTest);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('h1').textContent).toBe('Hello');
    TestBed.inject(TranslocoService).setActiveLang('fr');
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('h1').textContent).toBe('Bonjour');
  });
});

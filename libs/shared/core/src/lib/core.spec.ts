import { TestBed } from '@angular/core/testing';
import { TRANSLOCO_CONFIG } from '@jsverse/transloco';

import { I18nConfigToken } from '@dotln-angular/i18n';
import { provideUtilsTestKit } from '@dotln-angular/utils/testing';

import {
  provideAppBasePathTokenTestKit,
  provideDotlnCoreTestKit,
  provideEnvironmentConfigTokenTestKit,
} from '../../testing/src';
import {
  AppBasePathToken,
  BasePaths,
  buildRoute,
  ChildPaths,
  EnvironmentConfigToken,
  provideDotlnI18n,
} from '../public_api';

describe('core providers and canonical routes', () => {
  it('provides the typed environment without a root default', () => {
    TestBed.configureTestingModule({
      providers: [...provideEnvironmentConfigTokenTestKit({ mocks: false }).providers],
    });
    expect(TestBed.inject(EnvironmentConfigToken).mocks).toBe(false);
  });

  it.each([undefined, '/console/', '/console'])('reads base href %s', (base) => {
    const doc = document.implementation.createHTMLDocument();
    if (base !== undefined) {
      const element = doc.createElement('base');
      element.setAttribute('href', base);
      doc.head.append(element);
    }
    TestBed.configureTestingModule({
      providers: [...provideAppBasePathTokenTestKit(doc).providers],
    });
    expect(TestBed.inject(AppBasePathToken)).toBe(base ?? '/');
  });

  it('integrates environment and base path into reusable i18n', () => {
    TestBed.configureTestingModule({
      providers: [
        ...provideDotlnCoreTestKit({
          production: true,
          i18n: { defaultLang: 'fr', availableLangs: ['en', 'fr'] },
        }).providers,
        { provide: AppBasePathToken, useValue: '/console/' },
        provideDotlnI18n(),
      ],
    });
    expect(TestBed.inject(I18nConfigToken)).toEqual({
      production: true,
      basePath: '/console/',
      defaultLang: 'fr',
      availableLangs: ['en', 'fr'],
    });
    expect(TestBed.inject(TRANSLOCO_CONFIG)).toMatchObject({
      defaultLang: 'fr',
      availableLangs: ['en', 'fr'],
      prodMode: true,
      reRenderOnLangChange: true,
    });
  });

  it('preserves path parameters and query values separately', () => {
    const { words } = provideUtilsTestKit();
    const query = { page: 2, enabled: false, tags: ['a', 'b'] };
    const result = buildRoute(BasePaths.Board, {
      child: ChildPaths.Root,
      path: [words[2], 0, 'a/b'],
      query,
    });
    expect(result).toEqual({
      commands: ['/', 'board', 'settings', 0, 'a/b'],
      queryParams: query,
    });
    expect(result.queryParams).not.toBe(query);
    expect(buildRoute(BasePaths.Board).commands).toEqual(['/', 'board']);
  });
});

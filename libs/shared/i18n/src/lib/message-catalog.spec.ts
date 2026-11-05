import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';

import { provideMessageCatalogTestKit } from '../../testing/src';
import { MessageCatalog } from './message-catalog';

it('loads a scope in its language and keeps existing translators bound to that language', async () => {
  TestBed.configureTestingModule({
    providers: [
      ...provideMessageCatalogTestKit({
        config: { availableLangs: ['en', 'fr'] },
        langs: {
          en: {},
          fr: {},
          'studyAifg/en': { time: 'At {{seconds}} seconds' },
          'studyAifg/fr': { time: 'À {{seconds}} secondes' },
        },
      }).providers,
    ],
  });
  const catalog = TestBed.inject(MessageCatalog);
  const english = await catalog.translator(['studyAifg']);
  expect(english('studyAifg.time', { seconds: 2 })).toBe('At 2 seconds');
  TestBed.inject(TranslocoService).setActiveLang('fr');
  const french = await catalog.translator(['studyAifg']);
  expect(catalog.language()).toBe('fr');
  expect(french('studyAifg.time', { seconds: 2 })).toBe('À 2 secondes');
  expect(english('studyAifg.time', { seconds: 2 })).toBe('At 2 seconds');
  expect(() => french('studyAifg.missing')).toThrow('Missing translation');
});

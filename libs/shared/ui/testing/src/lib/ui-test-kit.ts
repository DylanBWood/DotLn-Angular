import { provideDotlnI18nTestKit } from '@dotln-angular/i18n/testing';

import { provideDotlnUi } from '../../../src';

export function provideUiTestKit() {
  return {
    providers: [
      ...provideDotlnI18nTestKit({
        langs: {
          en: {
            ui: {
              status: { known: 'Known', unknown: 'Unknown', unavailable: 'Unavailable' },
              close: 'Close',
              loading: 'Loading',
              unavailableExplanation: 'This information could not be read.',
            },
            shell: { skipToMain: 'Skip to main content', navigation: 'Primary navigation' },
          },
        },
      }).providers,
      provideDotlnUi(),
    ],
  };
}

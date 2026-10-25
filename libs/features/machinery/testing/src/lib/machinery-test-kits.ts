import { provideRouter } from '@angular/router';

import { provideDotlnI18nTestKit } from '@dotln-angular/i18n/testing';

export function provideMachineryTestKit() {
  return {
    providers: [
      provideRouter([]),
      ...provideDotlnI18nTestKit({
        langs: {
          en: {
            machinery: {
              arriving: {
                title: 'Machinery',
                description: 'The view of DotLn’s machinery arrives with WO-016.',
                backToBoard: 'Back to the actor board',
              },
            },
          },
        },
      }).providers,
    ],
  };
}

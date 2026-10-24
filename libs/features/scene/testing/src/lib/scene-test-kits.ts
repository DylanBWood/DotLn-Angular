import { provideRouter } from '@angular/router';

import { provideDotlnI18nTestKit } from '@dotln-angular/i18n/testing';

export function provideSceneTestKit() {
  return {
    providers: [
      provideRouter([]),
      ...provideDotlnI18nTestKit({
        langs: {
          en: {
            scene: {
              arriving: {
                title: 'Scene',
                description: 'The game-AI authoring scene arrives with WO-015.',
                backToBoard: 'Back to the actor board',
              },
            },
          },
        },
      }).providers,
    ],
  };
}

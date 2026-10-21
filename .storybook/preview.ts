import '../apps/dotln/src/styles.scss';
import { applicationConfig, type Preview } from '@storybook/angular-vite';

import { provideDotlnI18nTestKit } from '@dotln-angular/i18n/testing';
import { provideDotlnUi } from '@dotln-angular/ui';

import en from '../apps/dotln/public/i18n/en.json';

const preview: Preview = {
  decorators: [
    applicationConfig({
      providers: [...provideDotlnI18nTestKit({ langs: { en } }).providers, provideDotlnUi()],
    }),
  ],
  parameters: { layout: 'padded', controls: { expanded: true } },
  tags: ['autodocs'],
};
export default preview;

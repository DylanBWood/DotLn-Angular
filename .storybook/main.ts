import type { StorybookConfig } from '@storybook/angular-vite';

const config: StorybookConfig = {
  stories: ['../libs/**/*.stories.ts'],
  addons: ['@storybook/addon-docs'],
  framework: { name: '@storybook/angular-vite', options: { tsconfig: '.storybook/tsconfig.json' } },
  core: { disableTelemetry: true },
};
export default config;

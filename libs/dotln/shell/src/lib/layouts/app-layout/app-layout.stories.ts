import type { Meta, StoryObj } from '@storybook/angular-vite';

import { DotlnAppLayout } from './app-layout';

const meta: Meta<DotlnAppLayout> = {
  title: 'Shell/app-layout',
  component: DotlnAppLayout,
  parameters: { layout: 'fullscreen' },
};
export default meta;
export const Default: StoryObj<DotlnAppLayout> = {
  render: () => ({
    props: { brand: 'DotLn', page: 'Board', footer: 'Evidence first. Read only.' },
    template: `
      <dotln-app-layout>
        <strong header>{{ brand }}</strong>
        <nav nav aria-label="Primary navigation">
          <a href="#main-content">{{ page }}</a>
        </nav>
        <h1 main>{{ page }}</h1>
        <span footer>{{ footer }}</span>
      </dotln-app-layout>
    `,
  }),
};

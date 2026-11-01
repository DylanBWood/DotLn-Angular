import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';

import { provideCatalog } from '@dotln-angular/catalog';

import { provideToolsTestKit } from '../../../../testing/src';
import { CatalogPage } from './catalog-page';

const meta: Meta<CatalogPage> = {
  title: 'Tools/catalog-page',
  component: CatalogPage,
  decorators: [
    applicationConfig({ providers: [...provideToolsTestKit().providers, ...provideCatalog()] }),
  ],
  args: { toolId: 'aifg-a:177' },
};
export default meta;
export const Reading: StoryObj<CatalogPage> = {};
export const Search: StoryObj<CatalogPage> = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(
      await canvas.findByRole('searchbox', { name: 'Find a concept' }),
      'arrive',
    );
  },
};
export const Untyped: StoryObj<CatalogPage> = { args: { toolId: 'aifg-a:176' } };
export const ModelKnowledge: StoryObj<CatalogPage> = { args: { toolId: 'aifg-a:145' } };
export const LayoutSide: StoryObj<CatalogPage> = {};
export const Study: StoryObj<CatalogPage> = { args: { toolId: 'aifg-a:112' } };

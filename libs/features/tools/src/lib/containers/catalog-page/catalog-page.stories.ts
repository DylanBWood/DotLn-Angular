import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';

import { provideCatalog } from '@dotln-angular/catalog';

import { provideToolsTestKit } from '../../../../testing/src';
import { CatalogPage } from './catalog-page';

function readingProviders(id: string | null) {
  const kit = provideToolsTestKit();
  kit.storage.values.set(
    'dotln-angular.tools',
    JSON.stringify({
      version: 1,
      work: id ? 'aifg' : null,
      chapter: null,
      section: null,
      selectedId: id,
      history: id ? [id] : [],
    }),
  );
  return [...kit.providers, ...provideCatalog()];
}
const meta: Meta<CatalogPage> = {
  title: 'Tools/catalog-page',
  component: CatalogPage,
  decorators: [applicationConfig({ providers: readingProviders('aifg-a:177') })],
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
export const Untyped: StoryObj<CatalogPage> = {
  decorators: [applicationConfig({ providers: readingProviders('aifg-a:176') })],
};
export const ModelKnowledge: StoryObj<CatalogPage> = {
  decorators: [applicationConfig({ providers: readingProviders('aifg-a:145') })],
};
export const LayoutSide: StoryObj<CatalogPage> = {};
export const Study: StoryObj<CatalogPage> = {
  decorators: [applicationConfig({ providers: readingProviders('aifg-a:112') })],
};

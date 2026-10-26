import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';

import { provideToolsTestKit } from '../../../../testing/src';
import { CatalogPage } from './catalog-page';

const meta: Meta<CatalogPage> = {
  title: 'Tools/catalog-page',
  component: CatalogPage,
  decorators: [applicationConfig({ providers: [...provideToolsTestKit().providers] })],
};
export default meta;
export const Default: StoryObj<CatalogPage> = {};

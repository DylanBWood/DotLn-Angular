import type { Meta, StoryObj } from '@storybook/angular-vite';

import { catalogFixture } from '@dotln-angular/catalog/testing';

import { ToolList } from './tool-list';

const meta: Meta<ToolList> = {
  title: 'Tools/tool-list',
  component: ToolList,
  args: { tools: catalogFixture },
};
export default meta;
export const Default: StoryObj<ToolList> = {};

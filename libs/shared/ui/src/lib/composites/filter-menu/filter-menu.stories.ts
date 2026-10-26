import type { Meta, StoryObj } from '@storybook/angular-vite';

import { DotlnFilterMenu } from './filter-menu';

const meta: Meta<DotlnFilterMenu> = {
  title: 'UI/Filter Menu',
  component: DotlnFilterMenu,
  args: {
    label: 'Work',
    allLabel: 'All',
    options: [
      { id: '', label: 'All' },
      { id: 'example', label: 'Example' },
    ],
    value: null,
  },
};
export default meta;
type Story = StoryObj<DotlnFilterMenu>;
export const Default: Story = {};
export const Selected: Story = { args: { value: 'example' } };

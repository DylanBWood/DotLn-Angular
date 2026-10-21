import type { Meta, StoryObj } from '@storybook/angular-vite';

import { DotlnMenu } from './menu';

const meta: Meta<DotlnMenu> = {
  title: 'UI/menu',
  component: DotlnMenu,
  render: (args) => ({
    props: { ...args, choice: '' },
    template:
      '<dotln-menu [label]="label" [options]="options" (selected)="choice = $event" />@if (choice) { <p role="status">{{ choice }}</p> }',
  }),
  args: {
    label: 'Inspect',
    options: [
      { id: 'source', label: 'Source record' },
      { id: 'evidence', label: 'Evidence' },
      { id: 'unavailable', label: 'Unavailable action', disabled: true },
    ],
  },
};
export default meta;
type MenuStory = StoryObj<DotlnMenu>;
export const Default: MenuStory = {};

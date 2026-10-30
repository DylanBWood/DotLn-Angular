import type { Meta, StoryObj } from '@storybook/angular-vite';

import { DotlnButton } from './button';

const meta: Meta<DotlnButton> = {
  title: 'UI/button',
  component: DotlnButton,
  render: (args) => ({
    props: { ...args, label: 'Inspect evidence' },
    template:
      '<dotln-button [loading]="loading" [loadingVariant]="loadingVariant" [disabled]="disabled" [size]="size" [tone]="tone">{{ label }}</dotln-button>',
  }),
  args: {
    loading: false,
    loadingVariant: 'trailing',
    disabled: false,
    size: 'regular',
    tone: 'plain',
  },
};
export default meta;
type ButtonStory = StoryObj<DotlnButton>;
export const Default: ButtonStory = {};
export const Disabled: ButtonStory = { args: { disabled: true } };
export const Replace: ButtonStory = { args: { loading: true, loadingVariant: 'replace' } };
export const Trailing: ButtonStory = { args: { loading: true, loadingVariant: 'trailing' } };
export const Overlay: ButtonStory = { args: { loading: true, loadingVariant: 'overlay' } };
export const Small: ButtonStory = { args: { size: 'small' } };
export const Primary: ButtonStory = { args: { tone: 'primary' } };

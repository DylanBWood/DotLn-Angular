import type { Meta, StoryObj } from '@storybook/angular-vite';

import { DotlnVisuallyHidden } from './visually-hidden';

const meta: Meta<DotlnVisuallyHidden> = {
  title: 'UI/visually-hidden',
  component: DotlnVisuallyHidden,
};
export default meta;
export const Default: StoryObj<DotlnVisuallyHidden> = {
  render: () => ({
    props: { hidden: 'Open evidence details', glyph: '↗' },
    template:
      '<button type="button"><span aria-hidden="true">{{ glyph }}</span><dotln-visually-hidden>{{ hidden }}</dotln-visually-hidden></button>',
  }),
};

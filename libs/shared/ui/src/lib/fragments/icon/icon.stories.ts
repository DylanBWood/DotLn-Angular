import type { Meta, StoryObj } from '@storybook/angular-vite';

import { DotlnIcon } from './icon';

const meta: Meta<DotlnIcon> = {
  title: 'UI/icon',
  component: DotlnIcon,
  args: { glyph: '🔎', label: 'Inspect evidence' },
};
export default meta;
type IconStory = StoryObj<DotlnIcon>;
export const Default: IconStory = {};

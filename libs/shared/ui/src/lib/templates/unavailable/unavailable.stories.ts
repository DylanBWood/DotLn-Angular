import type { Meta, StoryObj } from '@storybook/angular-vite';

import { DotlnUnavailable } from './unavailable';

const meta: Meta<DotlnUnavailable> = {
  title: 'UI/unavailable',
  component: DotlnUnavailable,
  args: {
    explanation:
      'The source could not be read. Its state remains unavailable until evidence is recorded.',
  },
};
export default meta;
type UnavailableStory = StoryObj<DotlnUnavailable>;
export const Default: UnavailableStory = {};

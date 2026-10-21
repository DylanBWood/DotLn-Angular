import type { Meta, StoryObj } from '@storybook/angular-vite';

import { DotlnBadge } from './badge';

const meta: Meta<DotlnBadge> = {
  title: 'UI/badge',
  component: DotlnBadge,
  args: { status: 'known' },
};
export default meta;
type BadgeStory = StoryObj<DotlnBadge>;
export const Default: BadgeStory = {};
export const Unknown: BadgeStory = { args: { status: 'unknown' } };
export const Unavailable: BadgeStory = { args: { status: 'unavailable' } };

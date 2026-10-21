import type { Meta, StoryObj } from '@storybook/angular-vite';

import { DotlnEmptyState } from './empty-state';

const meta: Meta<DotlnEmptyState> = {
  title: 'UI/empty-state',
  component: DotlnEmptyState,
  args: { message: 'No saved builds have been recorded yet.' },
};
export default meta;
type EmptyStateStory = StoryObj<DotlnEmptyState>;
export const Default: EmptyStateStory = {};

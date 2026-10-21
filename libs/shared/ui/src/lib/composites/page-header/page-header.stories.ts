import type { Meta, StoryObj } from '@storybook/angular-vite';

import { DotlnPageHeader } from './page-header';

const meta: Meta<DotlnPageHeader> = {
  title: 'UI/page-header',
  component: DotlnPageHeader,
  args: {
    eyebrow: 'Workspace / Overview',
    heading: 'The actor board',
    description: 'People, builds and the evidence behind their work.',
    status: { state: 'unknown', label: 'No live status recorded' },
  },
};
export default meta;
type PageHeaderStory = StoryObj<DotlnPageHeader>;
export const Default: PageHeaderStory = {};

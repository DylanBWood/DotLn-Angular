import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';

import { provideToolsTestKit } from '../../../../testing/src';
import { marblesStudyViewFixture, studyViewFixture } from './fixtures';
import { Study } from './study';

const meta: Meta<Study> = {
  title: 'Tools/Study',
  component: Study,
  decorators: [applicationConfig({ providers: [...provideToolsTestKit().providers] })],
  args: { study: studyViewFixture, hrefFor: (id) => `/tools/catalog/${id}` },
};
export default meta;
export const Default: StoryObj<Study> = {};
export const WithoutADrawing: StoryObj<Study> = {
  args: { study: { ...studyViewFixture, visual: null, rxjs: null, worked: null } },
};
export const ExplanationsOpen: StoryObj<Study> = {
  args: {
    study: {
      ...studyViewFixture,
      expanded: ['mechanism', 'reactive', 'limits', 'elsewhere'],
    },
  },
};
export const Marbles: StoryObj<Study> = {
  args: { study: { ...marblesStudyViewFixture, expanded: ['reactive'] } },
};

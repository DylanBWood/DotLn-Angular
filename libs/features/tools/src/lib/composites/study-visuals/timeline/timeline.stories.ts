import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';

import { provideToolsTestKit } from '../../../../../testing/src';
import { momentsFixture, timelineFixture } from '../fixtures';
import { StudyTimeline } from './timeline';

const meta: Meta<StudyTimeline> = {
  title: 'Tools/StudyTimeline',
  component: StudyTimeline,
  decorators: [applicationConfig({ providers: [...provideToolsTestKit().providers] })],
  args: {
    model: timelineFixture,
    textEquivalent: 'Actual speed rises to the desired speed, then both fall.',
  },
};
export default meta;
export const Stepped: StoryObj<StudyTimeline> = {
  args: { step: 4, moments: momentsFixture, note: 'Actual speed has nearly caught up.' },
};
export const Still: StoryObj<StudyTimeline> = {};

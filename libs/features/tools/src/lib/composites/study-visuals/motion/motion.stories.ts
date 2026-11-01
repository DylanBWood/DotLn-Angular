import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';

import { provideToolsTestKit } from '../../../../../testing/src';
import { momentsFixture, motionFixture } from '../fixtures';
import { StudyMotion } from './motion';

const meta: Meta<StudyMotion> = {
  title: 'Tools/StudyMotion',
  component: StudyMotion,
  decorators: [applicationConfig({ providers: [...provideToolsTestKit().providers] })],
  args: {
    model: motionFixture,
    step: 4,
    moments: momentsFixture,
    textEquivalent: 'The scout is 56 units from the target and the follower is behind it.',
    note: 'Both bodies are still closing on the target.',
  },
};
export default meta;
export const Default: StoryObj<StudyMotion> = {};
export const Start: StoryObj<StudyMotion> = { args: { step: 0 } };

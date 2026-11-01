import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';

import { provideToolsTestKit } from '../../../../../testing/src';
import { fillValues } from '../../../studies/study-text';
import { marblesFixture } from '../fixtures';
import { StudyMarbles } from './marbles';

const meta: Meta<StudyMarbles> = {
  title: 'Tools/StudyMarbles',
  component: StudyMarbles,
  decorators: [applicationConfig({ providers: [...provideToolsTestKit().providers] })],
  args: {
    model: marblesFixture,
    step: 4,
    moments: [
      { label: 'First', step: 1 },
      { label: 'Switch', step: 4 },
    ],
    textEquivalent: fillValues('Frame {frame}: {now}.', marblesFixture.frames[4].values),
    note: 'The first inner stream is cut off before its second value; the second takes over.',
  },
};
export default meta;
export const Default: StoryObj<StudyMarbles> = {};
export const Start: StoryObj<StudyMarbles> = {
  args: {
    step: 0,
    textEquivalent: fillValues('Frame {frame}: {now}.', marblesFixture.frames[0].values),
    note: null,
  },
};

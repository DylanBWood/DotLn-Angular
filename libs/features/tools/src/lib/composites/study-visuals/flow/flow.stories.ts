import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';

import { provideToolsTestKit } from '../../../../../testing/src';
import { fillValues } from '../../../studies/study-text';
import { flowFixture, marbleFlowStudyModel } from '../fixtures';
import { StudyFlow } from './flow';

const sentence = 'Step {step}: {moves}. {states}.';

const meta: Meta<StudyFlow> = {
  title: 'Tools/StudyFlow',
  component: StudyFlow,
  decorators: [applicationConfig({ providers: [...provideToolsTestKit().providers] })],
  args: {
    model: flowFixture,
    step: 2,
    moments: [
      { label: 'Both queued', step: 2 },
      { label: 'Taken', step: 3 },
    ],
    textEquivalent: fillValues(sentence, flowFixture.frames[2].values),
    note: flowFixture.frames[2].note ?? null,
  },
};
export default meta;
export const Default: StoryObj<StudyFlow> = {};
export const Start: StoryObj<StudyFlow> = {
  args: {
    step: 0,
    textEquivalent: fillValues(sentence, flowFixture.frames[0].values),
    note: null,
  },
};
export const FromMarbles: StoryObj<StudyFlow> = {
  args: {
    model: marbleFlowStudyModel.flow,
    step: 1,
    moments: marbleFlowStudyModel.moments,
    textEquivalent: fillValues(sentence, marbleFlowStudyModel.flow.frames[1].values),
    note: marbleFlowStudyModel.flow.frames[1].note ?? null,
  },
};

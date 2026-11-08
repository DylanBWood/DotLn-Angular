import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';

import { provideToolsTestKit } from '../../../../../testing/src';
import { fillValues } from '../../../studies/study-text';
import { statesFixture, statesStudyModel } from '../fixtures';
import { StudyStates } from './states';

const sentence = 'Step {step}: {moves}. {placements}.';
const at = (step: number) => ({
  step,
  textEquivalent: fillValues(sentence, statesFixture.frames[step].values),
  note: statesFixture.frames[step].note ?? null,
});

const meta: Meta<StudyStates> = {
  title: 'Tools/StudyStates',
  component: StudyStates,
  decorators: [applicationConfig({ providers: [...provideToolsTestKit().providers] })],
  args: { model: statesFixture, moments: statesStudyModel.moments, ...at(2) },
};
export default meta;
export const Default: StoryObj<StudyStates> = {};
export const Committed: StoryObj<StudyStates> = { args: at(4) };

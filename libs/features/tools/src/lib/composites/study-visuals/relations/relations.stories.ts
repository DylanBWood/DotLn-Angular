import { componentWrapperDecorator, type Meta, type StoryObj } from '@storybook/angular-vite';

import { StudyRelations } from './relations';
import { loopStudy } from './relations.fixture';

const frame = loopStudy.relations.frames[3];
const meta: Meta<StudyRelations> = {
  title: 'Tools/StudyRelations',
  component: StudyRelations,
  decorators: [
    componentWrapperDecorator(
      (story) => `<article style="max-width:64ch;margin:2rem auto;padding:0 1rem">
        <h2>A card that asks you to look at itself</h2>
        <p>Imagine a card with this single instruction written on it.</p>
        <blockquote>Count the letters on this card.</blockquote>
        <p>Look at the ink, read the words, then do what they ask.
          To count, your eyes must go back to the same ink. The last arrow shows that return.</p>
        ${story}
      </article>`,
    ),
  ],
  args: {
    model: loopStudy.relations,
    step: 3,
    moments: loopStudy.moments,
    textEquivalent: `${frame.values['focus']}. ${frame.note}`,
  },
};
export default meta;
export const ReturnToMarks: StoryObj<StudyRelations> = {};

import { withStudyMessages } from '../../../../../testing/src';
import { type RelationsExample, relationsModel } from '../../../studies/relations';

export const loopExample: RelationsExample = {
  layout: 'levels',
  nodes: [
    { id: 'marks', label: 'demo.marks' },
    { id: 'sentence', label: 'demo.sentence' },
    { id: 'reading', label: 'demo.reading' },
  ],
  relations: [
    { id: 'form', from: 'marks', to: 'sentence', label: 'demo.form' },
    { id: 'interpret', from: 'sentence', to: 'reading', label: 'demo.interpret' },
    { id: 'return', from: 'reading', to: 'marks', label: 'demo.return' },
  ],
  steps: [
    { id: 'inspect', focus: { node: 'marks' }, note: 'demo.inspect' },
    { id: 'group', focus: { relation: 'form' }, note: 'demo.group' },
    { id: 'read', focus: { relation: 'interpret' }, note: 'demo.read' },
    { id: 'refer', focus: { relation: 'return' }, note: 'demo.refer' },
  ],
  moments: [{ step: 'refer', label: 'demo.again' }],
  caption: 'demo.caption',
};

const translate = withStudyMessages({
  'demo.marks': 'Printed marks',
  'demo.sentence': 'Sentence',
  'demo.reading': 'Meaning',
  'demo.form': 'form',
  'demo.interpret': 'has a',
  'demo.return': 'refers to',
  'demo.inspect':
    'Imagine a card with just these words printed on it: “Count the letters on this card.” Pick out the five letters in “Count.”',
  'demo.group':
    'Read the marks in groups. The five letters C, o, u, n and t make the word “Count.” The six words together make an instruction.',
  'demo.read': 'The words “on this card” tell you where to look for the letters you must count.',
  'demo.refer':
    'To carry out the instruction, look back at the ink on this very card. Its six words have 25 letters altogether.',
  'demo.again': 'Follow the return',
  'demo.caption':
    'The invented card reads “Count the letters on this card.” Following what the words mean sends you back to their own lettering.',
});

export const loopStudy = relationsModel(loopExample, translate);

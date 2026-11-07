import { withStudyMessages } from '../../../../testing/src';
import type { StudyTranslate } from '../study-translate';
import { expectMarbleExample } from './marble-testing';
import type { MarbleExample } from './marbles';

const fixtureTranslate = withStudyMessages({
  'fixture.input': 'input$',
  'fixture.output': 'output$',
  'fixture.operator': 'identity',
  'fixture.wrong': 'Incorrect value',
});

const example: MarbleExample = {
  inputs: { input$: { label: 'fixture.input', marbles: 'a|', values: { a: 7 } } },
  operator: 'fixture.operator',
  outputs: { output$: { label: 'fixture.output', marbles: 'a|', values: { a: 7 } } },
  run: ({ inputs }) => ({ output$: inputs['input$'] }),
  moments: [],
};

it('checks payload descriptions even when the translator is wrapped', () => {
  const translate = vi.fn(fixtureTranslate);
  expect(() => expectMarbleExample(example, { translate })).not.toThrow();
  const wrongDescription: MarbleExample = {
    ...example,
    outputs: {
      output$: { ...example.outputs['output$'], valueMessages: { a: 'fixture.wrong' } },
    },
  };
  expect(() => expectMarbleExample(wrongDescription, { translate })).toThrow();
});

it('still checks actual deliveries when descriptions use independently authored text', () => {
  const translate: StudyTranslate = (key, values) => `Translated: ${fixtureTranslate(key, values)}`;
  const options = { translate, descriptions: 'authored' } as const;
  expect(() => expectMarbleExample(example, options)).not.toThrow();
  const wrongPayload: MarbleExample = {
    ...example,
    outputs: { output$: { ...example.outputs['output$'], values: { a: 8 } } },
  };
  expect(() => expectMarbleExample(wrongPayload, options)).toThrow();
});

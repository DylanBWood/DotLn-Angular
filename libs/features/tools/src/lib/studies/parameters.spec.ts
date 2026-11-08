import { booleanParameter, numberParameter, textParameter } from './parameters';

const parameters = { speed: 4, kind: 'fast', on: 1, off: 0, half: 0.5 };

it('reads the number and the text a model needs, refusing one that is missing or of another kind', () => {
  expect(numberParameter(parameters, 'speed')).toBe(4);
  expect(textParameter(parameters, 'kind')).toBe('fast');
  expect(() => numberParameter(parameters, 'kind')).toThrow('Parameter kind must be a number.');
  expect(() => textParameter(parameters, 'speed')).toThrow('Parameter speed must be text.');
  expect(() => numberParameter(parameters, 'missing')).toThrow('must be a number');
});

it('reads an on/off input as a boolean, from the 1 or the 0 its slider holds', () => {
  expect(booleanParameter(parameters, 'on')).toBe(true);
  expect(booleanParameter(parameters, 'off')).toBe(false);
  expect(() => booleanParameter(parameters, 'half')).toThrow('Parameter half must be 0 or 1.');
  expect(() => booleanParameter(parameters, 'kind')).toThrow('must be a number');
});

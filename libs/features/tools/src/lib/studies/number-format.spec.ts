import { createNumberFormat } from './number-format';

it('keeps the selected rounding convention for numbers and both vector coordinates', () => {
  const format = createNumberFormat({ digits: 2, zeroThreshold: 0.005 });
  expect(format.number(-0.0049)).toBe('0.00');
  expect(format.number(-0.005)).toBe('-0.01');
  expect(format.vector({ x: -0.0049, y: 1.234 })).toBe('(0.00, 1.23)');
  expect(format.number(1.234, 1)).toBe('1.2');
});

it('distinguishes signed rounded zero, normalized zero and compact numbers', () => {
  expect(createNumberFormat().number(-0.001)).toBe('-0.00');
  expect(createNumberFormat({ normalizeNegativeZero: true }).number(-0.001)).toBe('0.00');
  const compact = createNumberFormat({ trimTrailingZeroes: true });
  expect(compact.number(-0.001)).toBe('0');
  expect(compact.vector({ x: 1.2, y: 3 })).toBe('(1.2, 3)');
});

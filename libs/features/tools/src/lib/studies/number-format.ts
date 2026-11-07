import type { StudyPoint } from './study-model';

/** A study chooses its precision once; the formatter preserves that authored convention. */
export interface StudyNumberFormatOptions {
  readonly digits?: number;
  readonly zeroThreshold?: number;
  readonly normalizeNegativeZero?: boolean;
  readonly trimTrailingZeroes?: boolean;
}

export interface StudyNumberFormat {
  readonly number: (value: number, digits?: number) => string;
  readonly vector: (value: StudyPoint, digits?: number) => string;
}

export function createNumberFormat(options: StudyNumberFormatOptions = {}): StudyNumberFormat {
  const {
    digits = 2,
    zeroThreshold = 0,
    normalizeNegativeZero = false,
    trimTrailingZeroes = false,
  } = options;

  const number = (value: number, precision = digits): string => {
    const rounded = (Math.abs(value) < zeroThreshold ? 0 : value).toFixed(precision);
    if (trimTrailingZeroes) return String(Number(rounded));
    return normalizeNegativeZero ? Number(rounded).toFixed(precision) : rounded;
  };

  return {
    number,
    vector: (value, precision = digits) =>
      `(${number(value.x, precision)}, ${number(value.y, precision)})`,
  };
}

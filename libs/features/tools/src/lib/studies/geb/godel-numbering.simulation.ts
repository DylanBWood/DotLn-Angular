import type { StudyParameters } from '@dotln-angular/models';

import { numberParameter, textParameter } from '../parameters';

export type AlphabetSymbol = 'L' | 'R';
type Word = readonly AlphabetSymbol[];

const radix = 3n;
const digitOf = { L: 1n, R: 2n } satisfies Record<AlphabetSymbol, bigint>;
const symbolOf = new Map<bigint, AlphabetSymbol>([
  [digitOf.L, 'L'],
  [digitOf.R, 'R'],
]);

export interface GodelNumberingParameters {
  readonly leftWord: Word;
  readonly rightWord: Word;
  readonly probeCode: bigint;
}

export type DecodedCode =
  | { readonly kind: 'word'; readonly word: Word }
  | { readonly kind: 'negative' }
  | { readonly kind: 'zeroDigit'; readonly remaining: bigint };

interface JoinedCodes {
  readonly code: bigint;
  readonly rightPlaces: number;
  readonly multiplier: bigint;
}

export interface GodelNumberingRun {
  readonly example: GodelNumberingParameters;
  readonly leftCode: bigint;
  readonly rightCode: bigint;
  readonly joinedWord: Word;
  readonly codeFromWords: bigint;
  readonly joined: JoinedCodes;
  readonly recovered: Word;
  readonly probe: DecodedCode;
}

function readWord(text: string): Word {
  return Array.from(text, (symbol) => {
    if (symbol === 'L' || symbol === 'R') return symbol;
    throw new Error('The word contains a symbol outside the alphabet.');
  });
}

export function readParameters(parameters: StudyParameters): GodelNumberingParameters {
  const probeCode = numberParameter(parameters, 'probeCode');
  if (!Number.isSafeInteger(probeCode)) throw new Error('The probe code must be a safe integer.');

  return {
    leftWord: readWord(textParameter(parameters, 'leftWord')),
    rightWord: readWord(textParameter(parameters, 'rightWord')),
    probeCode: BigInt(probeCode),
  };
}

/** The empty word is zero. Each step appends one base-three digit. */
export function encodeWord(word: Word): bigint {
  return word.reduce((code, symbol) => code * radix + digitOf[symbol], 0n);
}

/** Division visits the digits from the right. A zero digit is unused in any nonempty word. */
export function decodeCode(code: bigint): DecodedCode {
  if (code < 0n) return { kind: 'negative' };

  const symbols: AlphabetSymbol[] = [];
  for (let remaining = code; remaining > 0n; remaining /= radix) {
    const symbol = symbolOf.get(remaining % radix);
    if (symbol === undefined) return { kind: 'zeroDigit', remaining };
    symbols.push(symbol);
  }
  return { kind: 'word', word: symbols.reverse() };
}

/** Arithmetic concatenation on the image of the encoder. */
export function joinCodes(left: bigint, right: bigint): JoinedCodes {
  const suffix = decodeCode(right);
  if (suffix.kind !== 'word' || decodeCode(left).kind !== 'word') {
    throw new Error('Joining requires two codes in the image.');
  }

  const rightPlaces = suffix.word.length;
  const multiplier = radix ** BigInt(rightPlaces);
  return { code: left * multiplier + right, rightPlaces, multiplier };
}

export function godelNumberingRun(example: GodelNumberingParameters): GodelNumberingRun {
  const { leftWord, rightWord, probeCode } = example;
  const leftCode = encodeWord(leftWord);
  const rightCode = encodeWord(rightWord);
  const joinedWord = [...leftWord, ...rightWord];
  const codeFromWords = encodeWord(joinedWord);
  const joined = joinCodes(leftCode, rightCode);
  const recovered = decodeCode(joined.code);
  if (recovered.kind !== 'word') throw new Error('Joining codes must yield a code in the image.');

  return {
    example,
    leftCode,
    rightCode,
    joinedWord,
    codeFromWords,
    joined,
    recovered: recovered.word,
    probe: decodeCode(probeCode),
  };
}

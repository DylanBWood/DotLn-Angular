import type { Placeholder } from 'ramda';
import { isNonEmptyString as upstreamIsNonEmptyString } from 'ramda-adjunct';

declare const nonEmptyString: unique symbol;

// The brand keeps the false branch honest: an empty string is still a string.
export type NonEmptyString = string & { readonly [nonEmptyString]: true };
type Primitive = string | number | boolean | bigint | symbol | null | undefined;

interface IsNonEmptyString {
  (): IsNonEmptyString;
  (placeholder: Placeholder): IsNonEmptyString;
  (value: Primitive): value is NonEmptyString;
  (value: unknown): boolean | IsNonEmptyString;
  // Higher-order inference uses this safe domain. Unknown objects can be
  // placeholders, whose truthy result does not establish that they are strings.
  (value: Primitive): value is NonEmptyString;
}

// The upstream boolean signature omits both narrowing and placeholder currying.
export const isNonEmptyString = upstreamIsNonEmptyString as IsNonEmptyString;

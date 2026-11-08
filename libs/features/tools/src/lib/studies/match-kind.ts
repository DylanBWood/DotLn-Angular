/** The members of a tagged union a kind names, including a member whose kind is one of several. */
type OfKind<Union extends { readonly kind: string }, Kind extends string> = Union extends unknown
  ? Kind extends Union['kind']
    ? Union
    : never
  : never;

/**
 * A function for every kind of a tagged union, each given the value of its own kind: a table the
 * compiler holds to the union, so a new kind needs its entry and no branch waits for a kind that
 * cannot occur.
 */
export type KindTable<Union extends { readonly kind: string }, Result> = {
  readonly [Kind in Union['kind']]: (value: OfKind<Union, Kind>) => Result;
};

/** What a table answers for a value: the function its kind names, given that value. */
export function matchKind<Union extends { readonly kind: string }, Result>(
  value: Union,
  table: KindTable<Union, Result>,
): Result {
  // The compiler reads a generic value's kind as the constraint's string, and cannot follow the
  // link from a table's key to its function's argument; the entry for this value's kind takes
  // exactly the values of that kind, which this one is, so it is told both.
  const entry = table[value.kind as Union['kind']] as (value: Union) => Result;
  return entry(value);
}

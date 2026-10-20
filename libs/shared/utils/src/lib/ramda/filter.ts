import { filter as upstreamFilter, type Placeholder, type Reduced } from 'ramda';

type Predicate<T> = (value: T) => boolean;
type Guard<T, S extends T> = (value: T) => value is S;
type FilteredRecord<C, S> = Partial<{ [K in keyof C]: C[K] & S }>;

interface Transformer<A, T> {
  '@@transducer/init'(): A;
  '@@transducer/step'(accumulator: A, value: T): A | Reduced<A>;
  '@@transducer/result'(accumulator: A): A;
}

interface Filtered<T, S extends T = T> {
  (values: readonly T[]): S[];
  <K>(values: ReadonlyMap<K, T>): Map<K, S>;
  <A>(transformer: Transformer<A, S>): Transformer<A, T>;
  <O>(values: { 'fantasy-land/filter'(predicate: Predicate<T>): O }): O;
  <O>(values: { filter(predicate: Predicate<T>): O }): O;
  <C extends Record<string, T>>(values: C): FilteredRecord<C, S>;
  (placeholder: Placeholder): Filtered<T, S>;
  // The final overload is the collection signature inferred by R.pipe.
  (values: readonly T[]): S[];
}

interface Filter {
  (): Filter;
  (placeholder: Placeholder): Filter;
  (placeholder: Placeholder, values: Placeholder): Filter;
  <T>(
    placeholder: Placeholder,
    values: readonly T[],
  ): {
    <S extends T>(predicate: Guard<T, S>): S[];
    (predicate: Predicate<T>): T[];
  };
  <K, T>(
    placeholder: Placeholder,
    values: ReadonlyMap<K, T>,
  ): {
    <S extends T>(predicate: Guard<T, S>): Map<K, S>;
    (predicate: Predicate<T>): Map<K, T>;
  };
  <A, T>(
    placeholder: Placeholder,
    transformer: Transformer<A, T>,
  ): (predicate: Predicate<T>) => Transformer<A, T>;
  <T, O>(
    placeholder: Placeholder,
    values: { 'fantasy-land/filter'(fn: Predicate<T>): O },
  ): (predicate: Predicate<T>) => O;
  <T, O>(
    placeholder: Placeholder,
    values: { filter(fn: Predicate<T>): O },
  ): (predicate: Predicate<T>) => O;
  <C extends Record<string, unknown>>(
    placeholder: Placeholder,
    values: C,
  ): {
    <S extends C[keyof C]>(predicate: Guard<C[keyof C], S>): FilteredRecord<C, S>;
    (predicate: Predicate<C[keyof C]>): Partial<C>;
  };
  <T, S extends T>(predicate: Guard<T, S>): Filtered<T, S>;
  <T>(predicate: Predicate<T>): Filtered<T>;
  <T, S extends T>(predicate: Guard<T, S>, placeholder: Placeholder): Filtered<T, S>;
  <T>(predicate: Predicate<T>, placeholder: Placeholder): Filtered<T>;
  <T, S extends T>(predicate: Guard<T, S>, values: readonly T[]): S[];
  <T>(predicate: Predicate<T>, values: readonly T[]): T[];
  <K, T, S extends T>(predicate: Guard<T, S>, values: ReadonlyMap<K, T>): Map<K, S>;
  <K, T>(predicate: Predicate<T>, values: ReadonlyMap<K, T>): Map<K, T>;
  <A, T, S extends T>(predicate: Guard<T, S>, transformer: Transformer<A, S>): Transformer<A, T>;
  <A, T>(predicate: Predicate<T>, transformer: Transformer<A, T>): Transformer<A, T>;
  <T, O>(predicate: Predicate<T>, values: { 'fantasy-land/filter'(fn: Predicate<T>): O }): O;
  <T, O>(predicate: Predicate<T>, values: { filter(fn: Predicate<T>): O }): O;
  <C extends Record<string, unknown>, S extends C[keyof C]>(
    predicate: Guard<C[keyof C], S>,
    values: C,
  ): FilteredRecord<C, S>;
  <C extends Record<string, unknown>>(predicate: Predicate<C[keyof C]>, values: C): Partial<C>;
}

// Filtering can remove tuple elements and object keys. Keep Ramda's runtime
// dispatch and currying while replacing the declarations that preserve C.
export const filter = upstreamFilter as Filter;

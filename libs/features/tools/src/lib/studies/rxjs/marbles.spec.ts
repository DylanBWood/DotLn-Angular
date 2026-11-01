import { catchError, map, of, startWith, switchMap } from 'rxjs';

import { marblesDrawing } from '../../composites/study-visuals/marbles/marbles-drawing';
import { type MarbleExample, marbleModel } from './marbles';

/** An output value's origin as the builder names it, by frame, for one output line. */
const originsOf = (example: MarbleExample, output: string) =>
  Object.fromEntries(
    marbleModel(example)
      .marbles.lines.filter(({ id }) => id === output)
      .flatMap(({ events }) => events.filter(({ kind }) => kind === 'next'))
      .map(({ frame, from }) => [frame, from ?? null]),
  );

const doubled: MarbleExample = {
  inputs: { source$: { label: 'source$', marbles: '-a-b|', values: { a: 1, b: 2 } } },
  operator: 'map((n) => n * 2)',
  outputs: { out$: { label: 'out$', marbles: '-x-y|', values: { x: 2, y: 4 } } },
  run: ({ inputs: { source$ } }) => ({ out$: source$.pipe(map((n) => Number(n) * 2)) }),
  moments: [],
};

it('names the lane an output value comes from: the one that emits at that frame', () => {
  expect(originsOf(doubled, 'out$')).toEqual({ 1: 'source$', 3: 'source$' });
});

it('prefers the inner stream that emits at the frame to the input, and gives each grouped value its own courier', () => {
  const example: MarbleExample = {
    inputs: { source$: { label: 'source$', marbles: '-a---|' } },
    inner: { a: { label: 'inner(a)', marbles: '--(12)|', subscriptions: '-^----!' } },
    operator: 'switchMap((value) => inner(value))',
    outputs: { out$: { label: 'out$', marbles: '---(12)-|' } },
    run: ({ inputs: { source$ }, inner }) => ({
      out$: source$.pipe(switchMap((value) => inner[String(value)])),
    }),
    moments: [],
  };
  expect(originsOf(example, 'out$')).toEqual({ 3: 'inner(a)' });
  const drawing = marblesDrawing(marbleModel(example).marbles, 3);
  expect(drawing.couriers.map(({ key }) => key)).toEqual(['1', '2']);
  expect(new Set(drawing.couriers.map(({ x }) => x)).size).toBe(2);
  expect(drawing.marbles.filter(({ landing }) => landing).map(({ x }) => x)).toEqual(
    drawing.couriers.map(({ x }) => x),
  );
});

it('falls back to the lane that errors or completes at the frame, as a caught error becomes a value', () => {
  const example: MarbleExample = {
    inputs: { source$: { label: 'source$', marbles: '-a-#', error: 'lost' } },
    operator: "catchError(() => of('fallback'))",
    outputs: { out$: { label: 'out$', marbles: '-a-(f|)', values: { f: 'fallback' } } },
    run: ({ inputs: { source$ } }) => ({ out$: source$.pipe(catchError(() => of('fallback'))) }),
    moments: [],
  };
  expect(originsOf(example, 'out$')).toEqual({ 1: 'source$', 3: 'source$' });
});

it('names no origin for a value no lane emits at that frame, such as a seed or a replay', () => {
  const example: MarbleExample = {
    inputs: { source$: { label: 'source$', marbles: '--a|' } },
    operator: "startWith('seed')",
    outputs: { out$: { label: 'out$', marbles: 's-a|', values: { s: 'seed' } } },
    run: ({ inputs: { source$ } }) => ({ out$: source$.pipe(startWith('seed')) }),
    moments: [],
  };
  expect(originsOf(example, 'out$')).toEqual({ 0: null, 2: 'source$' });
  const drawing = marblesDrawing(marbleModel(example).marbles, 0);
  expect(drawing.couriers).toEqual([]);
  expect(drawing.marbles.some(({ landing }) => landing)).toBe(false);
});

it('lets the example name an origin, or none, and refuses an id it has no stream for', () => {
  expect(originsOf({ ...doubled, origins: { 1: null } }, 'out$')).toEqual({
    1: null,
    3: 'source$',
  });
  expect(originsOf({ ...doubled, origins: { 3: 'source$' } }, 'out$')).toEqual({
    1: 'source$',
    3: 'source$',
  });
  expect(() => marbleModel({ ...doubled, origins: { 1: 'nothing$' } })).toThrow(
    /origins names nothing\$, which is no input or inner stream/,
  );
});

it('refuses two lines with one label, since the drawing finds a lane by its label', () => {
  const example: MarbleExample = {
    ...doubled,
    outputs: { out$: { label: 'source$', marbles: '-x-y|', values: { x: 2, y: 4 } } },
  };
  expect(() => marbleModel(example)).toThrow(/two lines share the label source\$/);
});

import { matchKind } from './match-kind';

type Shape =
  | { readonly kind: 'circle'; readonly radius: number }
  | { readonly kind: 'square' | 'diamond'; readonly side: number };

const area = (shape: Shape) =>
  matchKind(shape, {
    circle: ({ radius }) => Math.PI * radius ** 2,
    // A member whose kind is one of several gives each of them its whole value.
    square: ({ side }) => side ** 2,
    diamond: ({ side }) => side ** 2,
  });

it('answers each value with the function its kind names, given that value', () => {
  expect(area({ kind: 'square', side: 3 })).toBe(9);
  expect(area({ kind: 'diamond', side: 2 })).toBe(4);
  expect(area({ kind: 'circle', radius: 1 })).toBeCloseTo(Math.PI);
});

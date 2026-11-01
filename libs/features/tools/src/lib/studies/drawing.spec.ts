import { boundsOf, namedBoundsOf, withSpacedLabels } from './drawing';
import type { StudyFrame } from './study-model';

const frame: StudyFrame = {
  seconds: 0,
  bodies: [
    { id: 'a', x: 0, y: 0, label: 'Lantern' },
    { id: 'b', x: 0.2, y: 0, label: 'Port' },
    { id: 'c', x: 50, y: 0, label: 'Starboard' },
  ],
  marks: [{ x: 50.2, y: 0, shape: 'ring', label: 'Slot' }],
  values: {},
};

it('boxes every body, mark, zone, vector and link with the margin asked for', () => {
  const bounds = boundsOf(
    [
      {
        ...frame,
        zones: [{ x: 60, y: 0, radius: 10 }],
        vectors: [{ x: 0, y: 0, dx: -20, dy: 0, tone: 'actual' }],
        links: [{ from: { x: 0, y: 0 }, to: { x: 0, y: 30 }, tone: 'muted' }],
      },
    ],
    2,
  );
  expect(bounds).toEqual({ minX: -22, maxX: 72, minY: -12, maxY: 32 });
});

it('leaves room beyond that box for the names it holds', () => {
  const plain = boundsOf([frame], 2);
  const named = namedBoundsOf([frame], 2);
  expect(named.minX).toBeLessThan(plain.minX);
  expect(named.maxX).toBeGreaterThan(plain.maxX);
  expect(named.minY).toBeLessThan(plain.minY);
});

it('drops a label that would collide with one already placed, keeping the mark itself', () => {
  const bounds = { minX: -10, maxX: 60, minY: -20, maxY: 20 };
  const spaced = withSpacedLabels(frame, bounds);
  expect(spaced.bodies.map(({ label }) => label)).toEqual(['Lantern', undefined, 'Starboard']);
  expect(spaced.bodies).toHaveLength(3);
  expect(spaced.marks?.[0].label).toBeUndefined();
  expect(spaced.marks).toHaveLength(1);
});

it('gives the marks first call on the room when a study needs them named most', () => {
  const bounds = { minX: -10, maxX: 60, minY: -20, maxY: 20 };
  const spaced = withSpacedLabels(frame, bounds, 'marks');
  expect(spaced.marks?.[0].label).toBe('Slot');
  expect(spaced.bodies.at(-1)?.label).toBeUndefined();
});

it('places an anchor body before the other bodies', () => {
  const bounds = { minX: -10, maxX: 60, minY: -20, maxY: 20 };
  const crowded: StudyFrame = {
    seconds: 0,
    bodies: [
      { id: 'a', x: 0, y: 0, label: 'Member' },
      { id: 'anchor', x: 0.2, y: 0, label: 'Anchor' },
    ],
    values: {},
  };
  expect(withSpacedLabels(crowded, bounds).bodies.map(({ label }) => label)).toEqual([
    undefined,
    'Anchor',
  ]);
});

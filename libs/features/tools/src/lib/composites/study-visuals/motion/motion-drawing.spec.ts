import type { MotionModel } from '../../../studies/study-model';
import { motionDrawing } from './motion-drawing';
import { motionLabels } from './motion-labels';

const frame = (x: number) => ({
  seconds: x / 10,
  bodies: [{ id: 'a', x, y: 10 }],
  values: {},
});

const model: MotionModel = {
  bounds: { minX: 0, maxX: 100, minY: 0, maxY: 50 },
  frames: [
    {
      ...frame(0),
      bodies: [
        { id: 'a', x: 0, y: 10, heading: 0 },
        { id: 'b', x: 50, y: 25, tone: 'other', label: 'Noor' },
      ],
      vectors: [{ x: 10, y: 10, dx: 5, dy: -5, tone: 'actual' }],
      marks: [{ x: 100, y: 50, shape: 'cross' }],
      zones: [{ x: 100, y: 0, radius: 10 }],
      links: [{ from: { x: 0, y: 0 }, to: { x: 100, y: 50 } }],
    },
    ...Array.from({ length: 30 }, (_, index) => frame(index + 1)),
  ],
  trail: true,
};

it('derives every coordinate of a moment from the bounds', () => {
  const drawing = motionDrawing(model, 0);
  expect(drawing.viewBox).toBe('0 0 600 300');
  expect(drawing.bodies[1]).toEqual({
    id: 'b',
    tone: 'other',
    x: 300,
    y: 150,
    arrow: null,
    label: 'Noor',
    labelX: 300,
    labelY: 134,
    labelGuide: null,
  });
  expect(drawing.vectors).toMatchObject([{ x1: 60, y1: 60, x2: 90, y2: 30, tone: 'actual' }]);
  expect(drawing.zones).toEqual([{ x: 600, y: 0, r: 60, tone: 'zone' }]);
  expect(drawing.links).toEqual([{ x1: 0, y1: 0, x2: 600, y2: 300, tone: 'muted' }]);
  expect(drawing.marks[0]).toMatchObject({ x: 600, y: 300, shape: 'cross', tone: 'target' });
});

it('points a body with a heading along it', () => {
  const body = motionDrawing(model, 0).bodies[0];
  expect(body.arrow).toBe('9.6,60 -6.4,65 -6.4,55');
  const turned = motionDrawing(
    {
      ...model,
      frames: [{ ...frame(0), bodies: [{ id: 'a', x: 0, y: 0, heading: Math.PI / 2 }] }],
    },
    0,
  );
  expect(turned.bodies[0].arrow).toBe('0,9.6 -5,-6.4 5,-6.4');
});

it('points a readable vector with a head and omits a vector too short to read', () => {
  const vectors = (dx: number): MotionModel => ({
    ...model,
    frames: [{ ...frame(0), vectors: [{ x: 0, y: 0, dx, dy: 0, tone: 'actual' }] }],
  });
  expect(motionDrawing(vectors(10), 0).vectors[0].head).toBe('66,0 56,4 56,-4');
  expect(motionDrawing(vectors(0.1), 0).vectors).toEqual([]);
});

it('names a body or a mark only when the model gives it a label', () => {
  const drawing = motionDrawing(model, 0);
  expect(drawing.bodies[0].label).toBeNull();
  expect(drawing.marks[0].label).toBeNull();
  const labelled = motionDrawing(
    {
      ...model,
      frames: [{ ...frame(0), marks: [{ x: 50, y: 25, shape: 'ring', label: 'Front' }] }],
    },
    0,
  );
  expect(labelled.marks[0]).toMatchObject({ label: 'Front', labelY: 134 });
});

it('draws where a body has just been, and nothing before the first moment', () => {
  expect(motionDrawing(model, 0).trail).toEqual([]);
  const trail = motionDrawing(model, 30).trail;
  expect(trail).toHaveLength(8);
  expect(trail.at(-1)).toEqual({ x: 162, y: 60 });
  expect(motionDrawing({ ...model, trail: false }, 30).trail).toEqual([]);
});

it('stays inside the run for a step past either end', () => {
  expect(motionDrawing(model, 99).bodies[0].x).toBe(180);
  expect(motionDrawing(model, -5).bodies).toHaveLength(2);
});

it('keeps names apart at a shared position without moving the bodies or wall mark', () => {
  const crowded: MotionModel = {
    bounds: { minX: 0, maxX: 100, minY: 0, maxY: 50 },
    frames: [
      {
        seconds: 0,
        values: {},
        bodies: [
          { id: 'a', x: 50, y: 25, label: 'Courier' },
          { id: 'b', x: 50, y: 25, label: 'WWWW' },
        ],
        marks: [{ x: 50, y: 25, shape: 'cross', label: 'Gate' }],
      },
    ],
  };
  const drawing = motionDrawing(crowded, 0);
  const points = [...drawing.bodies, ...drawing.marks];
  expect(points.map(({ x, y }) => ({ x, y }))).toEqual(Array(3).fill({ x: 300, y: 150 }));
  expect(points.map(({ label }) => label)).toEqual(['Courier', 'WWWW', 'Gate']);
  expect(new Set(points.map(({ labelY }) => labelY)).size).toBe(3);
  expect(crowded.frames[0].bodies[0].x).toBe(50);
});

it('brings names at every edge inside the drawing, keeping their physical anchors', () => {
  const drawing = motionDrawing(
    {
      ...model,
      frames: [
        {
          seconds: 0,
          values: {},
          bodies: [
            { id: 'left', x: 0, y: 0, label: 'Harbour launcher' },
            { id: 'right', x: 100, y: 50, label: 'Delivery' },
          ],
        },
      ],
    },
    0,
  );
  expect(drawing.bodies[0]).toMatchObject({ x: 0, y: 0, label: 'Harbour launcher' });
  expect(drawing.bodies[0].labelX).toBeGreaterThan(100);
  expect(drawing.bodies[0].labelY).toBeGreaterThanOrEqual(26);
  expect(drawing.bodies[1]).toMatchObject({ x: 600, y: 300, label: 'Delivery' });
  expect(drawing.bodies[1].labelX).toBeLessThan(600);
});

it('ends a displaced name guide at its near edge, whether the name is above or below', () => {
  for (const point of [
    { x: 0, y: 0 },
    { x: 600, y: 300 },
  ]) {
    const label = motionLabels(300)(point, 'Courier');
    expect(label.labelGuide).not.toBeNull();
    const end = label.labelGuide;
    if (!end) throw new Error('The displaced label needs a guide.');
    expect(end.y <= label.labelY - 26 || end.y >= label.labelY + 6).toBe(true);
    expect(Math.abs(end.y - point.y)).toBeLessThan(Math.abs(label.labelY - 10 - point.y));
  }
});

it('reserves the active font size, leaving a desktop name that fits in its authored place', () => {
  const point = { x: 100, y: 35 };
  const desktop = motionLabels(300, 15)(point, 'Courier');
  const narrow = motionLabels(300, 24)(point, 'Courier');
  expect(desktop).toMatchObject({ labelX: 100, labelY: 19, labelGuide: null });
  expect(narrow.labelY).toBeGreaterThan(19);
});

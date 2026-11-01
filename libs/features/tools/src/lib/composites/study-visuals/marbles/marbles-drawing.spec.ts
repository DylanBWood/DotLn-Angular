import { marbleModel } from '../../../studies/rxjs/marbles';
import { marblesFixture } from '../fixtures';
import { marblesDrawing } from './marbles-drawing';

it('spaces the frames across the width and stacks the lines around the operator', () => {
  const drawing = marblesDrawing(marblesFixture, 0);
  expect(drawing.viewBox).toBe('0 0 600 318');
  // Frames 0 to 9 share the width between the end margins: 544 / 9 per frame.
  const [source, first, second, out] = drawing.axes;
  // The source completes at frame 6, so its lane ends there; the output runs to the last frame.
  expect(source).toMatchObject({ x1: 28, x2: 390.67, tone: 'subject' });
  expect(first).toMatchObject({ x1: 88.44, x2: 269.78, y1: 98, tone: 'other' });
  expect(second).toMatchObject({ x1: 269.78, x2: 572, tone: 'other' });
  expect(out).toMatchObject({ x1: 28, x2: 572, tone: 'actual' });
  expect(out.y1).toBeGreaterThan(drawing.operator.y + drawing.operator.height);
  expect(drawing.operator.text).toBe('switchMap((value) => inner(value))');
  expect(drawing.labels.map(({ text }) => text)).toEqual([
    'source$',
    'inner(first)',
    'inner(second)',
    'out$',
  ]);
  expect(drawing.ticks.map(({ text }) => text)).toEqual([
    '0',
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
  ]);
});

it('raises the stepped frame’s emissions and leaves out what nothing received', () => {
  const drawing = marblesDrawing(marblesFixture, 4);
  expect(drawing.cursor.x1).toBe(269.78);
  expect(drawing.cursorNext).toBe(330.22);
  expect(marblesDrawing(marblesFixture, 99).cursorNext).toBe(572);
  expect(drawing.marbles.filter(({ current }) => current).map(({ key }) => key)).toEqual(['b']);
  // The first inner stream's second value came after it was cut off: not drawn. The output lane
  // fills in as the frames pass: out$'s later values and its completion are not drawn yet.
  expect(drawing.marbles.map(({ key }) => key)).toEqual(['a', 'b', '1', '3', '4', '1']);
  expect(drawing.completes).toHaveLength(2);
  expect(drawing.cuts).toHaveLength(1);
  const whole = marblesDrawing(marblesFixture, marblesFixture.lastFrame);
  expect(whole.marbles.map(({ key }) => key)).toEqual(['a', 'b', '1', '3', '4', '1', '3', '4']);
  expect(whole.completes).toHaveLength(3);
  // Nothing becomes an output value at frame 4; at frame 3 the first inner's 1 becomes out$'s 1.
  expect(drawing.couriers).toEqual([]);
  const third = marblesDrawing(marblesFixture, 3);
  // The value rides down in the output lane's tone, at the marbles' own size.
  expect(third.couriers).toEqual([{ x: 209.33, y1: 98, y2: 274, r: 12, key: '1', tone: 'actual' }]);
  expect(third.marbles.filter(({ landing }) => landing).map(({ key }) => key)).toEqual(['1']);
  // A lane opened later than frame 0 is dotted before its opening.
  expect(drawing.idle).toMatchObject([
    { x1: 28, x2: 88.44 },
    { x1: 28, x2: 269.78 },
  ]);
});

it('keeps a stale step inside the diagram, one step a frame', () => {
  expect(marblesDrawing(marblesFixture, 3).cursor.x1).toBe(209.33);
  expect(marblesDrawing(marblesFixture, 99).cursor.x1).toBe(572);
  expect(marblesDrawing(marblesFixture, -1).cursor.x1).toBe(28);
});

it('spreads emissions grouped on one frame and puts the bar after them', () => {
  const grouped = marbleModel({
    inputs: { source$: { label: 'source$', marbles: '-(ab)-(c|)' } },
    operator: 'map((value) => value)',
    outputs: { out$: { label: 'out$', marbles: '-(ab)-(c|)' } },
    run: ({ inputs }) => ({ out$: inputs['source$'] }),
    moments: [],
  });
  const drawing = marblesDrawing(grouped.marbles, 0);
  const [a, b, c] = drawing.marbles;
  expect(b.x - a.x).toBeCloseTo(a.r * 1.7, 5);
  expect((a.x + b.x) / 2).toBeCloseTo(drawing.ticks[1].x, 5);
  expect(c.x).toBe(drawing.ticks[6].x);
  expect(drawing.completes[0].x1).toBeCloseTo(c.x + c.r + 3, 5);
});

it('starts an output where its spec subscribes, and leaves out what it missed', () => {
  const late = marbleModel({
    inputs: { source$: { label: 'source$', marbles: '-a-b-c|', hot: true } },
    operator: 'share()',
    outputs: {
      early$: { label: 'early$', marbles: '-a-b-c|' },
      late$: { label: 'late$', marbles: '---b-c|', subscriptions: '--^' },
    },
    run: ({ inputs }) => ({ early$: inputs['source$'], late$: inputs['source$'] }),
    moments: [],
  });
  const drawing = marblesDrawing(late.marbles, late.marbles.lastFrame);
  const lateAxis = drawing.axes[2];
  expect(lateAxis.x1).toBe(drawing.ticks[2].x);
  expect(drawing.marbles.filter(({ y }) => y === lateAxis.y1).map(({ key }) => key)).toEqual([
    'b',
    'c',
  ]);
});

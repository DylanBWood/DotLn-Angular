import { statesFixture } from '../fixtures';
import { statesWidth } from './states-drawing';
import { registerDrawing } from './states-register';

it('lays the states across as columns and the objects down as rows, each token in its column', () => {
  const drawing = registerDrawing(statesFixture, 2);
  expect(drawing.columns.map(({ heading }) => heading.map(({ text }) => text).join(' '))).toEqual([
    'Clean',
    'New',
    'Dirty',
    'Removed',
  ]);
  expect(drawing.rows.map(({ name }) => name.map(({ text }) => text).join(' '))).toEqual([
    'Scene A',
    'Scene B',
    'Scene C',
  ]);
  const columnOf = (x: number) =>
    drawing.columns.find((column) => x > column.x && x < column.x + column.width)?.id;
  expect(drawing.tokens.map(({ key, x }) => [key, columnOf(x)])).toEqual([
    ['A', 'clean'],
    ['B', 'dirty'],
    ['C', 'new'],
  ]);
  // Scene B moves at this step: its token is green, with an arrow from Clean named by its operation.
  expect(drawing.tokens.find(({ key }) => key === 'B')?.state).toBe('moving');
  expect(drawing.tokens.filter(({ state }) => state === 'moving')).toHaveLength(1);
  expect(drawing.arrows.map(({ label }) => label?.text)).toEqual(['registerDirty']);
  expect(drawing.columns.filter(({ acting }) => acting).map(({ id }) => id)).toEqual(['dirty']);
  expect(drawing.rows[1].note.map(({ text }) => text).join(' ')).toBe('title changed');
});

it('keeps every row the same size from step to step, and draws a ring where an object left', () => {
  const heights = statesFixture.frames.map((_, step) =>
    registerDrawing(statesFixture, step).rows.map(({ height }) => height),
  );
  for (const row of heights) expect(row).toEqual(heights[0]);
  const committed = registerDrawing(statesFixture, 4);
  expect(committed.ghosts.map(({ id }) => id)).toEqual(['a']);
  expect(committed.tokens.map(({ key }) => key)).toEqual(['B', 'C']);
  expect(committed.arrows.map(({ label }) => label?.text)).toEqual(['commit', 'commit', 'commit']);
});

it('fits a phone’s width with every name, token and arrow inside the drawing', () => {
  for (const [step] of statesFixture.frames.entries()) {
    const drawing = registerDrawing(statesFixture, step, 'narrow');
    expect(drawing.width).toBe(statesWidth.narrow);
    for (const { x, r } of drawing.tokens) {
      expect(x - r).toBeGreaterThanOrEqual(drawing.nameWidth);
      expect(x + r).toBeLessThanOrEqual(drawing.width);
    }
    for (const { x, width } of drawing.columns)
      expect(x + width).toBeLessThanOrEqual(drawing.width);
  }
});

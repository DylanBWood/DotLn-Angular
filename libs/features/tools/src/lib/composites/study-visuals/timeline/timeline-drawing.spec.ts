import type { TimelineModel } from '../../../studies/study-model';
import { timelineDrawing } from './timeline-drawing';

const model: TimelineModel = {
  title: 'Speed',
  xLabel: 'Time',
  yLabel: 'Speed',
  seconds: [0, 1, 2, 3],
  series: [
    { id: 'a', label: 'A', tone: 'actual', values: [0, 10, 20, 30] },
    { id: 'b', label: 'B', tone: 'desired', values: [30, 30, 30, 30] },
  ],
};

it('takes its window, ticks and labels from the values when the model names none', () => {
  const view = timelineDrawing(model, null);
  expect(view.series[0].points).toBe('50.00,250.00 223.33,180.00 396.67,110.00 570.00,40.00');
  expect(view.xTicks.map(({ label }) => label)).toEqual(['0', '1', '2', '3']);
  expect(view.yTicks.map(({ label }) => label)).toEqual(['0', '10', '20', '30']);
  expect(view.cursorX).toBeNull();
  expect(view.series[0].dot).toBeNull();
  expect(view.referencePath).toBeNull();
});

it('marks the selected moment on every series', () => {
  const view = timelineDrawing(model, 2);
  expect(view.cursorX).toBe(396.67);
  expect(view.series.map(({ dot }) => dot)).toEqual([
    { x: 396.67, y: 110 },
    { x: 396.67, y: 40 },
  ]);
  expect(timelineDrawing(model, 0).cursorX).toBe(50);
});

it('clips to a named window and keeps a flat series on the chart', () => {
  const clipped = timelineDrawing({ ...model, xRange: [1, 2] }, null);
  expect(clipped.series[0].points.split(' ')).toHaveLength(2);
  const flat = timelineDrawing(
    { ...model, series: [{ id: 'b', label: 'B', tone: 'other', values: [5, 5, 5, 5] }] },
    null,
  );
  expect(flat.series[0].points).toContain(',145.00');
});

it('draws a reference line in place of its grid line', () => {
  const view = timelineDrawing({ ...model, yTicks: [0, 20], yRange: [0, 30], reference: 20 }, null);
  expect(view.referencePath).toBe('M 50 110 H 570');
  expect(view.gridPath).toBe('M 50 250 H 570');
});

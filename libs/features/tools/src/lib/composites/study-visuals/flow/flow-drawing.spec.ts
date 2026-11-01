import { flowModel } from '../../../studies/flow';
import { flowFixture, marbleFlowStudyModel } from '../fixtures';
import { flowDrawing, wrapText } from './flow-drawing';

it('wraps a name at its spaces and leaves a long word whole', () => {
  expect(wrapText('Consistency reviewer of the order', 12)).toEqual([
    'Consistency',
    'reviewer of',
    'the order',
  ]);
  expect(wrapText('Aggregator', 4)).toEqual(['Aggregator']);
  expect(wrapText('', 10)).toEqual([]);
});

it('stands each stage in its own column, left to right, with the lines joining them', () => {
  const drawing = flowDrawing(flowFixture, 1);
  const [planner, queue, executor] = drawing.nodes;
  expect(planner.x).toBeLessThan(queue.x);
  expect(queue.x).toBeLessThan(executor.x);
  expect(planner.x + planner.width).toBeLessThan(queue.x);
  // A channel drawn as a place of its own is a pipe; an endpoint is a box.
  expect(queue.kind).toBe('channel');
  // A pipe keeps round ends of one size however tall its words make it.
  expect(queue.rx).toBe(Math.min(22, queue.height / 2));
  expect(planner.rx).toBe(6);
  const [send, take] = drawing.links;
  expect(send).toMatchObject({ x1: planner.x + planner.width, x2: queue.x, active: true });
  expect(take.active).toBe(false);
});

it('draws the moving message on its line and what a stage holds in its box, never twice', () => {
  const arriving = flowDrawing(flowFixture, 2);
  const moving = arriving.tokens.filter(({ state }) => state === 'moving');
  expect(moving.map(({ key }) => key)).toEqual(['b']);
  const [send] = arriving.links;
  expect(moving[0].x).toBeGreaterThan(send.x1);
  expect(moving[0].x).toBeLessThan(send.x2);
  // It sets out from the sender's end of the line.
  expect(moving[0].x + moving[0].fromDx).toBeCloseTo(send.x1);
  // b arrives at this step, so the queue's box shows only a, which it already held.
  expect(arriving.tokens.filter(({ state }) => state === 'held').map(({ key }) => key)).toEqual([
    'a',
  ]);
  expect(arriving.states.map(({ text }) => text).join(' ')).toContain('holds orders 31 and 32');
});

it('keeps one shape whatever the step, so the drawing never jumps', () => {
  const drawings = flowFixture.frames.map(({ step }) => flowDrawing(flowFixture, step));
  expect(new Set(drawings.map(({ viewBox }) => viewBox)).size).toBe(1);
});

it('moves nothing at the start, and keeps a step inside the run', () => {
  const start = flowDrawing(flowFixture, 0);
  expect(start.links.some(({ active }) => active)).toBe(false);
  expect(start.tokens).toEqual([]);
  expect(flowDrawing(flowFixture, 99).links[1].active).toBe(true);
  expect(flowDrawing(flowFixture, -4).links.some(({ active }) => active)).toBe(false);
});

it('scales a name too wide for its box down to fit it', () => {
  const wide = flowDrawing(
    {
      ...flowFixture,
      nodes: flowFixture.nodes.map((node) =>
        node.id === 'queue' ? { ...node, label: 'Extraordinarily' } : node,
      ),
    },
    0,
  );
  const queue = wide.nodes.find(({ id }) => id === 'queue');
  expect(queue?.label.map(({ text }) => text)).toEqual(['Extraordinarily']);
  expect(queue?.scale).toBeLessThan(1);
  // A name that fits keeps its size.
  expect(wide.nodes.find(({ id }) => id === 'planner')?.scale).toBe(1);
});

it('runs the stages down a phone, a row each, the lines between rows clear of the words', () => {
  const drawing = flowDrawing(flowFixture, 2, 'down');
  const [planner, queue, executor] = drawing.nodes;
  // Laid out for a phone's width, each stage below the one before.
  expect(drawing.viewBox.startsWith('0 0 360 ')).toBe(true);
  expect(planner.y + planner.height).toBeLessThan(queue.y);
  expect(queue.y + queue.height).toBeLessThan(executor.y);
  const [send, take] = drawing.links;
  // A line leaves the bottom of one box and reaches the top of the next.
  expect(send).toMatchObject({ y1: planner.y + planner.height, y2: queue.y, active: true });
  expect(take.active).toBe(false);
  // The state sits inside its box, under the name, so no line crosses it.
  const state = drawing.states.find(({ text }) => text.startsWith('holds orders'));
  expect(state?.y).toBeGreaterThan(queue.y);
  expect(state?.y).toBeLessThan(queue.y + queue.height);
  const moving = drawing.tokens.filter(({ state: kind }) => kind === 'moving');
  expect(moving.map(({ key }) => key)).toEqual(['b']);
  expect(moving[0].y).toBeGreaterThan(send.y1);
  expect(moving[0].y).toBeLessThan(send.y2);
  const shapes = flowFixture.frames.map(({ step }) => flowDrawing(flowFixture, step, 'down'));
  expect(new Set(shapes.map(({ viewBox }) => viewBox)).size).toBe(1);
});

it('sets the nodes of one stage side by side on a phone, centred, in the order of their rows', () => {
  const { flow } = marbleFlowStudyModel;
  const drawing = flowDrawing(flow, 1, 'down');
  const board = drawing.nodes.find(({ id }) => id === 'board');
  const log = drawing.nodes.find(({ id }) => id === 'log');
  expect(board?.y).toBe(log?.y);
  expect((board?.x ?? 0) + (board?.width ?? 0)).toBeLessThan(log?.x ?? 0);
  const events = drawing.nodes.find(({ id }) => id === 'events');
  const middle = (events?.x ?? 0) + (events?.width ?? 0) / 2;
  expect(middle).toBeCloseTo(180);
});

it('marks the nodes a moving message leaves or reaches, and only those', () => {
  const drawing = flowDrawing(flowFixture, 3);
  expect(drawing.nodes.filter(({ acting }) => acting).map(({ id }) => id)).toEqual([
    'queue',
    'executor',
  ]);
  expect(flowDrawing(flowFixture, 0).nodes.some(({ acting }) => acting)).toBe(false);
  expect(
    flowDrawing(flowFixture, 3, 'down')
      .nodes.filter(({ acting }) => acting)
      .map(({ id }) => id),
  ).toEqual(['queue', 'executor']);
});

/** Four nodes in three stages: a sender, a buffer, a reader beside it, and a sink the sender skips to. */
const crowded = flowModel({
  nodes: [
    { id: 'sender', label: 'Sender', stage: 0 },
    { id: 'buffer', label: 'Buffer', stage: 1 },
    { id: 'sink', label: 'Sink', stage: 2 },
  ],
  links: [
    { id: 'in', from: 'sender', to: 'buffer' },
    { id: 'skip', from: 'sender', to: 'sink', label: 'copy' },
    { id: 'out', from: 'buffer', to: 'sink' },
  ],
  messages: Object.fromEntries(
    ['1', '2', '3', '4', '5', '6', '7'].map((key) => [key, { key, content: `event ${key}` }]),
  ),
  start: { note: 'Nothing yet.' },
  steps: [
    {
      moves: [{ message: '1', link: 'in' }],
      held: { buffer: ['1', '2', '3', '4', '5', '6', '7'] },
      note: 'The buffer holds seven.',
    },
    {
      moves: ['2', '3', '4', '5'].map((message) => ({ message, link: 'out' })),
      note: 'Four leave together.',
    },
    { moves: [{ message: '6', link: 'skip' }], note: 'A copy skips the buffer.' },
  ],
  moments: [],
}).flow;

it('draws messages that cannot sit apart on one line as one capsule naming them all', () => {
  const drawing = flowDrawing(crowded, 2);
  const moving = drawing.tokens.filter(({ state }) => state === 'moving');
  expect(moving).toHaveLength(1);
  expect(moving[0].key).toBe('2 3 4 5');
  expect(moving[0].width).toBeGreaterThan(moving[0].r * 2);
  // A single message keeps its round token.
  const single = flowDrawing(crowded, 1).tokens.find(({ state }) => state === 'moving');
  expect(single?.width).toBe((single?.r ?? 0) * 2);
});

it('holds messages that would overflow their box in one outlined capsule', () => {
  const held = flowDrawing(crowded, 1).tokens.filter(({ state }) => state === 'held');
  // The first one arrives at this step, so the box holds the other six.
  expect(held.map(({ key }) => key)).toEqual(['2 3 4 5 6 7']);
  const box = flowDrawing(crowded, 1).nodes.find(({ id }) => id === 'buffer');
  expect(held[0].width).toBeLessThanOrEqual((box?.width ?? 0) - 24);
});

it('runs a line that skips a stage round the boxes, in both directions', () => {
  const across = flowDrawing(crowded, 3);
  const skip = across.links.find(({ id }) => id === 'skip');
  const buffer = across.nodes.find(({ id }) => id === 'buffer');
  expect(skip?.points).not.toBeNull();
  // Its run goes below the buffer's box, not through it.
  const corners = (skip?.points ?? '').split(' ').map((point) => point.split(',').map(Number));
  const lowest = Math.max(...corners.map(([, y]) => y));
  expect(lowest).toBeGreaterThan((buffer?.y ?? 0) + (buffer?.height ?? 0));
  expect(across.links.find(({ id }) => id === 'in')?.points).toBeNull();
  // The moving copy rests in the gap beside the sender, clear of every box.
  const copy = across.tokens.find(({ state }) => state === 'moving');
  expect(copy?.x).toBeLessThan(buffer?.x ?? 0);
  const down = flowDrawing(crowded, 3, 'down');
  const route = down.links.find(({ id }) => id === 'skip');
  const rightmost = Math.max(
    ...(route?.points ?? '').split(' ').map((point) => Number(point.split(',')[0])),
  );
  const box = down.nodes.find(({ id }) => id === 'buffer');
  expect(rightmost).toBeGreaterThan((box?.x ?? 0) + (box?.width ?? 0));
});

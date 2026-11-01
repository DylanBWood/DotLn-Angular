import {
  flowStudyModel,
  marbleFlow,
  marbleFlowExample,
  marbleFlowStudyModel,
} from '../composites/study-visuals/fixtures';
import { type FlowExample, flowFromMarbles, flowModel, type MarbleFlow } from './flow';
import { expectMarbleExample } from './rxjs/marble-testing';

const example: FlowExample = {
  nodes: [
    { id: 'planner', label: 'Planner', stage: 0 },
    { id: 'queue', label: 'Work queue', stage: 1, kind: 'channel' },
  ],
  links: [{ id: 'send', from: 'planner', to: 'queue', label: 'orders' }],
  messages: { a: { key: 'a', content: 'order 31' } },
  start: { note: 'Nothing yet.' },
  steps: [{ moves: [{ message: 'a', link: 'send' }], held: { queue: ['a'] }, note: 'Sent.' }],
  moments: [{ label: 'Sent', step: 1 }],
};

it('steps a hand-written flow from its start, naming what moves and what each stage holds', () => {
  const { flow, initialStep, moments, legend } = flowStudyModel;
  expect(flow.frames.map(({ step }) => step)).toEqual([0, 1, 2, 3]);
  expect(initialStep).toBe(0);
  expect(moments).toEqual([
    { label: 'Both queued', step: 2 },
    { label: 'Taken', step: 3 },
  ]);
  expect(flow.frames[0].values['moves']).toBe('nothing moves');
  expect(flow.frames[0].note).toBe('Nothing has been sent yet.');
  expect(flow.frames[1].values['moves']).toBe('a (order 31) moves from Planner to Work queue');
  expect(flow.frames[3].values['moves']).toBe('a (order 31) moves from Work queue to Executor');
  // A state is kept until a later step changes it, so the executor stays idle until step 3.
  expect(flow.frames[2].values['states']).toBe(
    'Work queue: holds orders 31 and 32; Executor: idle',
  );
  expect(flow.frames[3].values['states']).toBe(
    'Work queue: holds order 32; Executor: works on order 31',
  );
  expect(flow.frames[2].values['held']).toBe('Work queue holds a, b');
  expect(flow.frames[3].held['queue']?.map(({ key }) => key)).toEqual(['b']);
  // Play lingers on each step as long as it lingers on a marble diagram's frame.
  expect(flow.frames.map(({ seconds }) => Math.round(seconds * 10) / 10)).toEqual([
    0, 1.2, 2.4, 3.6,
  ]);
  expect(legend.map(({ tone }) => tone)).toEqual(['subject', 'other', 'actual', 'muted']);
});

it('names a link that is a channel of its own and offers the parameters to the prose', () => {
  const run = flowModel(example, { orders: 1 });
  expect(run.flow.frames[1].values).toMatchObject({
    step: '1',
    moves: 'a (order 31) moves from Planner to Work queue on orders',
    held: 'Work queue holds a',
    states: 'no state to report',
    orders: '1',
  });
  expect(run.diagram).toBeNull();
  // No node is the pattern's own, so the legend leaves that entry out.
  expect(run.legend.map(({ tone }) => tone)).toEqual(['other', 'actual', 'muted']);
});

it('clears a state an empty string names', () => {
  const run = flowModel({
    ...example,
    start: { states: { queue: 'empty' }, note: 'Start.' },
    steps: [{ states: { queue: '' }, note: 'Cleared.' }],
  });
  expect(run.flow.frames[1].states).toEqual({});
  expect(run.flow.frames[1].note).toBe('Cleared.');
});

it('refuses a flow that names a part it does not have', () => {
  const broken = (change: Partial<FlowExample>) => () => flowModel({ ...example, ...change });
  expect(broken({ links: [{ id: 'send', from: 'planner', to: 'nowhere' }] })).toThrow(
    'Link send names no node nowhere.',
  );
  expect(broken({ steps: [{ moves: [{ message: 'z', link: 'send' }], note: 'x' }] })).toThrow(
    'The flow has no message z.',
  );
  expect(broken({ steps: [{ moves: [{ message: 'a', link: 'gone' }], note: 'x' }] })).toThrow(
    'The flow has no link gone.',
  );
  expect(broken({ steps: [{ states: { ghost: 'x' }, note: 'x' }] })).toThrow(
    'The flow has no node ghost.',
  );
  expect(broken({ moments: [{ label: 'Late', step: 9 }] })).toThrow(
    'Moment Late is outside the flow.',
  );
});

it('refuses a flow over marbles that names a line, link, node, message or step the run lacks', () => {
  const broken = (change: Partial<MarbleFlow>) => () =>
    flowFromMarbles(marbleFlowExample, { ...marbleFlow, ...change });
  expect(broken({ routes: { gone$: 'publish' } })).toThrow('The example has no line gone$.');
  expect(broken({ routes: { published$: 'gone' } })).toThrow('The flow has no link gone.');
  expect(broken({ held: { 1: { ghost: ['a'] } } })).toThrow('The flow has no node ghost.');
  expect(broken({ held: { 1: { events: ['z'] } } })).toThrow('The example has no message z.');
  expect(broken({ states: { 9: { events: 'x' } } })).toThrow('The flow has no step 9.');
});

it('makes each frame of a marble example a step, and each delivered emission a hop', () => {
  // The example runs as its strings say; the study fixture names this spec as its evidence.
  expectMarbleExample(marbleFlowExample);
  const { flow, diagram, moments } = marbleFlowStudyModel;
  expect(diagram).not.toBeNull();
  expect(flow.frames).toHaveLength(diagram?.marbles.frames.length ?? 0);
  expect(flow.frames.map(({ step }) => step)).toEqual(
    diagram?.marbles.frames.map(({ frame }) => frame),
  );
  // The published event and both copies of it move at the frame the run delivers them.
  expect(flow.frames[1].hops.map(({ key, link }) => `${link} ${key}`)).toEqual([
    'publish a',
    'to-board a',
    'to-log a',
  ]);
  expect(flow.frames[2].hops).toEqual([]);
  expect(flow.frames[1].values).toMatchObject({
    frame: '1',
    moves:
      'a (order 31 verified) moves from Verifier to Events; a (order 31 verified) moves from Events to Board; a (order 31 verified) moves from Events to Log',
    states: 'Events: two subscribers',
  });
  expect(flow.frames[1].values['delivered']).toContain('order 31 verified');
  expect(moments).toEqual([{ label: 'First event', step: 1 }]);
  // The diagram keeps its own legend and says how it follows the flow.
  expect(diagram?.legend.map(({ tone }) => tone)).toEqual(['subject', 'actual']);
  expect(diagram?.caption).toContain('the same step of the flow');
});

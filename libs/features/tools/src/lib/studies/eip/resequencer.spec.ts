import type { StudyParameters } from '@dotln-angular/models';

import { loadFlowStudy } from '../../../../testing/src';
import { expectMarbleExample } from '../rxjs/marble-testing';
import type { MarbleExample } from '../rxjs/marbles';
import type { FlowStudyModel } from '../study-model';
import { example, type Holding, type LogEvent, model, release, start } from './resequencer';

const path = 'libs/features/tools/src/lib/studies/eip/resequencer.ts';

/** The record's parameters, which the prose reads and this spec runs the model with. */
const parameters = { nextSequence: 1, events: 6 };

/** The model's run, which this module always draws as a flow. */
function drawn(values: StudyParameters = parameters): FlowStudyModel {
  const run = model(values);
  if (run.family !== 'flow') throw new Error('The resequencer is drawn as a flow.');
  return run;
}

const bus = example.inputs['bus$'];
const inOrder = example.outputs['inOrder$'];

/** The event a digit of the bus's marble string stands for. */
const eventOf = (key: string) => bus.values?.[key] as LogEvent;

/** What crosses each link at a step, as `link key`. */
const crossings = (step: number) =>
  drawn().flow.frames[step].hops.map(({ link, key }) => `${link} ${key}`);

/** The digits of the events the resequencer holds after a step. */
const heldAt = (step: number) =>
  drawn().flow.frames[step].held['resequencer']?.map(({ key }) => key) ?? [];

/** The events a fold of the given arrivals still holds, by number, as the pipeline folds them. */
const foldOf = (arrivals: readonly LogEvent[]): Holding =>
  arrivals.reduce(({ next, held }, event) => release(next, [...held, event]), start);

const idsOf = (events: readonly LogEvent[]) => events.map(({ eventId }) => eventId);

it('runs the bus example against the marbles both drawings show', () => {
  expectMarbleExample(example);
});

it('attaches the record to the Resequencer row and reads its drawing and code from this module', async () => {
  const record = await loadFlowStudy('eip:120');
  expect(record.visual.model).toBe(path);
  expect(record.pseudocode.executable?.module).toBe(path);
  expect(record.example.parameters).toEqual(parameters);
  const run = drawn(record.example.parameters);
  expect(run.initialStep).toBe(0);
  expect(run.diagram?.marbles.lines.map(({ label }) => label)).toEqual(['bus$', 'inOrder$']);
  // One step of the flow for each frame of the marble diagram, so the two drawings stay in step.
  expect(run.flow.frames.map(({ step }) => step)).toEqual(
    run.diagram?.marbles.frames.map(({ frame }) => frame),
  );
});

it('moves one thing at each step and holds evt_3 back until evt_2 fills the gap before it', () => {
  expect(drawn().flow.frames.map(({ step }) => crossings(step))).toEqual([
    [],
    ['deliver 1'],
    ['release 1'],
    ['deliver 3'],
    ['deliver 2'],
    ['release 2', 'release 3'],
    ['deliver 5'],
    ['deliver 6'],
    ['deliver 4'],
    ['release 4', 'release 5', 'release 6'],
  ]);
  // Every step has a note of its own, saying who sends what to whom.
  expect(Object.keys(example.notes ?? {}).map(Number)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  expect(heldAt(3)).toEqual(['3']);
  // The gap fills at step 4, and evt_2 then evt_3 leave together at step 5.
  expect(heldAt(4)).toEqual(['2', '3']);
  expect(heldAt(5)).toEqual([]);
  expect(drawn().flow.frames[3].values['states']).toBe(
    'Bus: keeps no order; Resequencer: expects evt_2; holds evt_3; Projection: has evt_1',
  );
});

it('holds two events behind one missing event, then releases the run of three in order', () => {
  expect(heldAt(7)).toEqual(['5', '6']);
  expect(heldAt(8)).toEqual(['4', '5', '6']);
  // The projection receives every event once, in log order, and unchanged.
  const received = drawn().flow.frames.flatMap(({ hops }) =>
    hops.filter(({ link }) => link === 'release').map(({ content }) => content),
  );
  expect(received).toEqual(
    ['1', '2', '3', '4', '5', '6'].map((key) => `eventId evt_${key}, type ${eventOf(key).type}`),
  );
  expect(inOrder.values).toEqual(bus.values);
});

it('draws as held exactly the events that have arrived and not yet been sent on', () => {
  const run = drawn();
  const lines = run.diagram?.marbles.lines ?? [];
  const delivered = (id: string, step: number) =>
    lines
      .find((line) => line.id === id)
      ?.events.filter(({ frame, kind }) => kind === 'next' && frame <= step)
      .map(({ key }) => key) ?? [];
  for (const { step } of run.flow.frames) {
    const sent = delivered('inOrder$', step);
    const waiting = delivered('bus$', step).filter((key) => !sent.includes(key));
    expect([...heldAt(step)].sort(), `step ${step}`).toEqual(waiting.sort());
    // What the fold still holds is what has arrived less the runs it has let out.
    const fold = foldOf(delivered('bus$', step).map(eventOf));
    expect(idsOf(fold.held).every((id) => waiting.includes(id.slice('evt_'.length)))).toBe(true);
  }
});

it('stops for good at a gap that never fills, holding everything behind it', () => {
  // The same bus with evt_4 lost.
  const lost: MarbleExample = {
    ...example,
    inputs: { bus$: { ...bus, marbles: '-1-32-56' } },
    outputs: { inOrder$: { ...inOrder, marbles: '--1--(23)' } },
  };
  expectMarbleExample(lost);
  const holding = foldOf(['1', '3', '2', '5', '6'].map(eventOf));
  expect(holding.next).toBe(4);
  expect(idsOf(holding.held)).toEqual(['evt_5', 'evt_6']);
  expect(holding.released).toEqual([]);
});

it('never sends a redelivered event twice, but keeps it in the buffer for good', () => {
  // The bus delivers evt_3 a second time after the whole log has gone out.
  const twice: MarbleExample = {
    ...example,
    inputs: { bus$: { ...bus, marbles: '-1-32-564-3' } },
  };
  expectMarbleExample(twice);
  const holding = foldOf([...['1', '3', '2', '5', '6', '4'].map(eventOf), { ...eventOf('3') }]);
  expect(holding.next).toBe(7);
  expect(idsOf(holding.held)).toEqual(['evt_3']);
});

it('needs one expected number per log: a counter shared by two logs keeps one log’s events for good', () => {
  const first = (n: number): LogEvent => ({ eventId: `evt_${n}`, type: 'from the first log' });
  const second = (n: number): LogEvent => ({ eventId: `evt_${n}`, type: 'from the second log' });
  const arrivals = [first(1), second(1), second(2), first(2)];
  // Fold them through one counter, as one resequencer serving both logs would, keeping every run
  // it lets out.
  const initial: { readonly holding: Holding; readonly sent: readonly LogEvent[] } = {
    holding: start,
    sent: [],
  };
  const { holding, sent } = arrivals.reduce(({ holding: { next, held }, sent: before }, event) => {
    const after = release(next, [...held, event]);
    return { holding: after, sent: [...before, ...after.released] };
  }, initial);
  // Whichever evt_2 came first went through; the other log's evt_1 and evt_2 stay held.
  expect(sent).toEqual([first(1), second(2)]);
  expect(holding.held).toEqual([second(1), first(2)]);
  expect(holding.next).toBe(3);
});

it('opens at the start, with the moments of the run named', () => {
  const run = drawn();
  expect(run.initialStep).toBe(0);
  expect(run.moments.map(({ label, step }) => [label, step])).toEqual([
    ['evt_3 held', 3],
    ['Gap fills', 4],
    ['Two held', 7],
    ['evt_4 arrives', 8],
    ['Run of three', 9],
  ]);
});

// The drawn example leaves the bus open. The same pipeline over the same events, the bus ending on
// its last one, releases the same runs at the same frames and then completes.
it('completes once the bus ends: the same runs at the same frames, then the end', () => {
  expectMarbleExample({
    ...example,
    inputs: { bus$: { ...example.inputs['bus$'], marbles: '-1-32-56(4|)' } },
    outputs: { inOrder$: { ...example.outputs['inOrder$'], marbles: '--1--(23)(456|)' } },
  });
});

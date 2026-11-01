import type { StudyParameters } from '@dotln-angular/models';

import { loadFlowStudy } from '../../../../testing/src';
import { flowFromMarbles } from '../flow';
import { expectMarbleExample } from '../rxjs/marble-testing';
import type { MarbleExample } from '../rxjs/marbles';
import type { FlowStudyModel } from '../study-model';
import { example, flow, model } from './aggregator';

const path = 'libs/features/tools/src/lib/studies/eip/aggregator.ts';

/** The record's parameters, which the prose reads and this spec runs the model with. */
const parameters = { reviewers: 3, first: 'order 31', second: 'order 32' };

/** The model's run, which this module always draws as a flow. */
function drawn(values: StudyParameters = parameters): FlowStudyModel {
  const run = model(values);
  if (run.family !== 'flow') throw new Error('The aggregator is drawn as a flow.');
  return run;
}

/** What crosses each link at a step, as `link key`. */
const crossings = (step: number) =>
  drawn().flow.frames[step].hops.map(({ link, key }) => `${link} ${key}`);

/** The letters a box holds after a step. */
const heldBy = (node: string, step: number) =>
  drawn().flow.frames[step].held[node]?.map(({ key }) => key) ?? [];

/** Every set that goes on to the next phase in a run, with the step it leaves at. */
const sentOn = (run: FlowStudyModel) =>
  run.flow.frames.flatMap(({ step, hops }) =>
    hops.filter(({ link }) => link === 'to-next').map(({ content }) => `${step}: ${content}`),
  );

/** A run of a changed example through the same flow, with no states or holdings drawn. */
const rerun = (changed: MarbleExample) =>
  flowFromMarbles(changed, { ...flow, states: {}, held: {} }, parameters);

/** The set a report's letter belongs to: lower case is order 31's set, 1, upper case order 32's, 2. */
const setOf = (key: string) => (key === key.toLowerCase() ? '1' : '2');

it('runs the two orders’ reviews against the marbles both drawings show', () => {
  expectMarbleExample(example);
});

it('attaches the record to the Aggregator row and reads its drawing and code from this module', async () => {
  const record = await loadFlowStudy('eip:110');
  expect(record.visual.model).toBe(path);
  expect(record.pseudocode.executable?.module).toBe(path);
  expect(record.example.parameters).toEqual(parameters);
  const run = drawn(record.example.parameters);
  expect(run.initialStep).toBe(0);
  expect(run.diagram?.marbles.lines.map(({ label }) => label)).toEqual([
    'criteria$',
    'design$',
    'consistency$',
    'ready$',
  ]);
  // One step of the flow for each frame of the marble diagram, so the two drawings stay in step.
  expect(run.flow.frames.map(({ step }) => step)).toEqual(
    run.diagram?.marbles.frames.map(({ frame }) => frame),
  );
});

it('moves one thing at each step, each report once and on its own reviewer’s line', () => {
  expect(drawn().flow.frames.map(({ step }) => crossings(step))).toEqual([
    [],
    ['from-criteria a'],
    ['from-design B'],
    ['from-consistency c'],
    ['from-criteria A'],
    ['from-consistency C'],
    ['to-next 2'],
    ['from-design b'],
    ['to-next 1'],
  ]);
  // Every step has a note of its own, saying who sends what to whom.
  expect(Object.keys(example.notes ?? {}).map(Number)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
});

it('files each report under the order it names, so the mixed reports fill two separate sets', () => {
  // B is the first report on order 32: it starts a second set rather than joining order 31's.
  expect(heldBy('aggregator', 2)).toEqual(['a', 'B']);
  expect(heldBy('aggregator', 4)).toEqual(['a', 'c', 'A', 'B']);
  const states = (step: number) => drawn().flow.frames[step].states;
  expect(states(4)['aggregator']).toBe('31:a,c · 32:A,B');
  // A box's words describe that box alone: the reviewers say what they are doing.
  expect(states(0)).toEqual({
    criteria: 'reviewing 31, 32',
    design: 'reviewing 31, 32',
    consistency: 'reviewing 31, 32',
    aggregator: 'no sets yet',
    next: 'no set yet',
  });
  expect(states(7)['design']).toBe('sent 31 and 32');
});

it('sends a set on in the step after it sees it complete, one message per order', () => {
  const run = drawn();
  expect(sentOn(run)).toEqual([
    '6: order 32: 2 findings from 3 reviewers',
    '8: order 31: 3 findings from 3 reviewers',
  ]);
  // C completes order 32's set at step 5; the set stays in the Aggregator until step 6.
  expect(heldBy('aggregator', 5)).toEqual(['a', 'c', 'A', 'B', 'C']);
  expect(heldBy('aggregator', 6)).toEqual(['a', 'c']);
  expect(heldBy('next', 6)).toEqual(['2']);
  // Order 31's first report came first, but its set is sent on last.
  expect(heldBy('aggregator', 8)).toEqual([]);
  expect(heldBy('next', 8)).toEqual(['2', '1']);
  expect(run.moments.map(({ label, step }) => [label, step])).toEqual([
    ['First report', 1],
    ['A second set', 2],
    ['Order 32 complete', 5],
    ['Set 2 sent on', 6],
    ['Set 1 sent on', 8],
  ]);
});

it('draws as held exactly the reports whose set has not been sent on, and the sets that have', () => {
  const run = drawn();
  const lines = run.diagram?.marbles.lines ?? [];
  const delivered = (ids: readonly string[], step: number) =>
    lines
      .filter(({ id }) => ids.includes(id))
      .flatMap(({ events }) => events)
      .filter(({ kind, frame }) => kind === 'next' && frame <= step)
      .map(({ key }) => key);
  for (const { step } of run.flow.frames) {
    const sent = delivered(['ready$'], step);
    const waiting = delivered(['criteria$', 'design$', 'consistency$'], step).filter(
      (key) => !sent.includes(setOf(key)),
    );
    expect([...heldBy('aggregator', step)].sort(), `step ${step}`).toEqual(waiting.sort());
    expect([...heldBy('next', step)].sort(), `step ${step}`).toEqual([...sent].sort());
  }
});

it('holds a set for ever when one report is lost, and nothing reports the loss', () => {
  // The same run, with Consistency's report on order 32 never arriving.
  const lost: MarbleExample = {
    ...example,
    inputs: {
      ...example.inputs,
      consistency$: { ...example.inputs['consistency$'], marbles: '---c' },
    },
    outputs: { ready$: { ...example.outputs['ready$'], marbles: '--------1' } },
  };
  expectMarbleExample(lost);
  // Order 31's set still goes on; order 32's never does, and no error is raised.
  expect(sentOn(rerun(lost))).toEqual(['8: order 31: 3 findings from 3 reviewers']);
});

it('sends a set on too early when one reviewer reports twice, because it counts reports', () => {
  // Criteria checks order 31 again and sends a second report before Design has reported.
  const again = { order: 31, from: 'Criteria', findings: 0 };
  const twice: MarbleExample = {
    ...example,
    inputs: {
      ...example.inputs,
      criteria$: {
        ...example.inputs['criteria$'],
        marbles: '-a--A-x',
        values: { ...example.inputs['criteria$'].values, x: again },
      },
    },
    outputs: {
      ready$: {
        ...example.outputs['ready$'],
        marbles: '------21',
        values: {
          1: 'order 31: 2 findings from 3 reviewers',
          2: 'order 32: 2 findings from 3 reviewers',
        },
      },
    },
  };
  expectMarbleExample(twice);
  // Order 31's set goes on with two Criteria reports and none from Design, and Design's report
  // that follows reaches the Aggregator and goes nowhere.
  const run = rerun(twice);
  expect(sentOn(run)).toEqual([
    '6: order 32: 2 findings from 3 reviewers',
    '7: order 31: 2 findings from 3 reviewers',
  ]);
  expect(run.flow.frames[7].hops.map(({ link, key }) => `${link} ${key}`)).toEqual([
    'from-design b',
    'to-next 1',
  ]);
});

// The drawn example leaves the reviewers' channel open, as a channel stays open. The same pipeline
// over the same reports, each reviewer's stream ending on its last report, delivers the same sets
// at the same frames and then completes.
it('completes once the reviewers stop: the same two sets at the same frames, then the end', () => {
  expectMarbleExample({
    ...example,
    inputs: {
      criteria$: { ...example.inputs['criteria$'], marbles: '-a--(A|)' },
      design$: { ...example.inputs['design$'], marbles: '--B----(b|)' },
      consistency$: { ...example.inputs['consistency$'], marbles: '---c-(C|)' },
    },
    outputs: { ready$: { ...example.outputs['ready$'], marbles: '------2-(1|)' } },
  });
});

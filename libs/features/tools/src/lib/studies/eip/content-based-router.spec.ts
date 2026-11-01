import { loadFlowStudy } from '../../../../testing/src';
import { flowDrawing } from '../../composites/study-visuals/flow/flow-drawing';
import { flowFromMarbles } from '../flow';
import { expectMarbleExample } from '../rxjs/marble-testing';
import type { MarbleExample } from '../rxjs/marbles';
import type { FlowFrame, FlowStudyModel } from '../study-model';
import { placeholdersIn } from '../study-text';
import {
  defaultRoute,
  example,
  type Finding,
  flow,
  model,
  type Route,
  routeOf,
  rules,
} from './content-based-router';

const path = 'libs/features/tools/src/lib/studies/eip/content-based-router.ts';
const parameters = { findings: 'F1 to F5', rules: 'blocking, then operator, then follow-up' };

/** The example run by its model, which draws a flow. */
const flowRun = (): FlowStudyModel => {
  const run = model(parameters);
  if (run.family !== 'flow') throw new Error(`The model draws ${run.family}, not a flow.`);
  return run;
};

/** What crosses each link at a step, as `link token`. */
const hopsAt = (frame: FlowFrame) => frame.hops.map(({ link, key }) => `${link} ${key}`);

/** The tokens a node holds after a step. */
const heldAt = (frame: FlowFrame, node: string) => (frame.held[node] ?? []).map(({ key }) => key);

it('runs the findings example against the marbles both drawings show', () => {
  expectMarbleExample(example);
});

it('attaches the record to the Content-Based Router row, reads this module and supplies every value its prose names', async () => {
  const record = await loadFlowStudy('eip:99');
  expect(record.visual.model).toBe(path);
  expect(record.pseudocode.executable?.module).toBe(path);
  expect(record.example.parameters).toEqual(parameters);
  const run = flowRun();
  expect(model(record.example.parameters).family).toBe('flow');
  expect(run.diagram).not.toBeNull();
  const names = [
    ...placeholdersIn(record.visual.textEquivalent),
    ...placeholdersIn(record.example.description),
    ...record.limits.flatMap(placeholdersIn),
    ...record.mechanism.steps.flatMap(({ text }) => placeholdersIn(text)),
  ];
  for (const frame of run.flow.frames)
    for (const name of names) expect(frame.values[name], name).toBeDefined();
  expect(run.flow.frames[0].values['rules']).toBe('blocking, then operator, then follow-up');
});

it('moves one finding at a time: into the router, then out on exactly one channel, unchanged', () => {
  const { flow: drawn } = flowRun();
  expect(drawn.frames.map(hopsAt)).toEqual([
    [],
    ['file 1'],
    ['to-executor 1'],
    ['file 2'],
    ['to-board 2'],
    ['file 3'],
    ['to-operator 3'],
    ['file 4'],
    ['to-executor 4'],
    ['file 5'],
    ['to-executor 5'],
  ]);
  // A finding leaves with the content it arrived with; the router adds and removes nothing.
  expect(drawn.frames[10].hops[0].content).toBe(drawn.frames[9].hops[0].content);
  expect(drawn.frames[10].hops[0].content).toBe(
    'finding F5, unmet criterion 4, choice waive or repair',
  );
  // Five findings in, five out: none copied and none lost.
  const out = drawn.frames.flatMap(({ hops }) => hops).filter(({ link }) => link !== 'file');
  expect(out.map(({ key }) => key).sort()).toEqual(['1', '2', '3', '4', '5']);
});

it('holds each finding in the router while it chooses, then at the one destination it reaches', () => {
  const { flow: drawn, moments, initialStep } = flowRun();
  expect(heldAt(drawn.frames[9], 'router')).toEqual(['5']);
  expect(drawn.frames[9].states['router']).toBe('F5 fits both, blocking first');
  const last = drawn.frames[drawn.frames.length - 1];
  expect(heldAt(last, 'router')).toEqual([]);
  expect(heldAt(last, 'executor')).toEqual(['1', '4', '5']);
  expect(heldAt(last, 'operator')).toEqual(['3']);
  expect(heldAt(last, 'board')).toEqual(['2']);
  // Each destination's words start with the route it receives.
  expect([last.states['executor'], last.states['operator'], last.states['board']]).toEqual([
    'blocking: F1, F4, F5',
    'operator: F3',
    'follow-up: F2',
  ]);
  expect(drawn.frames[3].states['router']).toBe('F2: no rule fits, so follow-up');
  expect(initialStep).toBe(0);
  expect(moments.map(({ label, step }) => [label, step])).toEqual([
    ['F1 is blocking', 2],
    ['The default route', 4],
    ['To the operator', 6],
    ['First match wins', 9],
    ['All routed', 10],
  ]);
  // Every step has its own sentence, and no state outgrows what a box can show.
  for (const frame of drawn.frames) expect(frame.note).toBe(example.notes?.[frame.step]);
  for (const frame of drawn.frames)
    for (const state of Object.values(frame.states)) expect(state.length).toBeLessThanOrEqual(40);
});

it('reads the rules in order, so a finding that passes both is blocking', () => {
  const f5: Finding = { finding: 'F5', unmet: 'criterion 4', choice: 'waive or repair' };
  expect(routeOf(f5)).toBe('blocking');
  // With the two rules swapped, the same finding would ask the operator to authorise a repair.
  const swapped = [...rules].reverse();
  const swappedRoute = (finding: Finding): Route =>
    swapped.find(([, passes]) => passes(finding))?.[0] ?? defaultRoute;
  expect(swappedRoute(f5)).toBe('operator');
  expect(routeOf({ finding: 'F2', defect: 'stale index line' })).toBe('follow-up');
});

it('turns a blocking finding into a follow-up when its field is renamed, and nothing fails', () => {
  // The verifier files F1 under a field the rules do not read; everything else is unchanged.
  const findings = example.inputs['findings$'].values ?? {};
  const renamed = { finding: 'F1', unmetCriterion: 'criterion 2' };
  const drifted: MarbleExample = {
    ...example,
    inputs: {
      findings$: { ...example.inputs['findings$'], values: { ...findings, 1: renamed } },
    },
    outputs: {
      blocking$: {
        label: 'blocking$',
        marbles: '--------4-(5|)',
        values: { 4: findings['4'], 5: findings['5'] },
      },
      operator$: example.outputs['operator$'],
      followUp$: {
        label: 'followUp$',
        marbles: '--1-2-----|',
        values: { 1: renamed, 2: findings['2'] },
      },
    },
  };
  expectMarbleExample(drifted);
  const { flow: drawn } = flowFromMarbles(drifted, { ...flow, states: {}, held: {} }, parameters);
  expect(hopsAt(drawn.frames[2])).toEqual(['to-board 1']);
  expect(drawn.frames[2].values['delivered']).toBe(
    'blocking$: nothing; operator$: nothing; followUp$: 1 (finding F1, unmetCriterion criterion 2)',
  );
});

it('draws every step across and down, each name on at most two lines and each word inside its box', () => {
  const { flow: steps } = flowRun();
  for (const direction of ['across', 'down'] as const)
    for (const { step, states } of steps.frames) {
      const drawing = flowDrawing(steps, step, direction);
      expect(drawing.nodes).toHaveLength(steps.nodes.length);
      for (const node of drawing.nodes) {
        expect(node.label.length).toBeLessThanOrEqual(2);
        // A state word wider than its box would run over the edge; 7.28 units is one character.
        for (const word of (states[node.id] ?? '').split(' '))
          expect(word.length * 7.28, `${direction} ${node.id} "${word}"`).toBeLessThanOrEqual(
            node.width - 24,
          );
      }
    }
});

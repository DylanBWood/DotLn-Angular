import { loadFlowStudy } from '../../../../testing/src';
import { flowDrawing } from '../../composites/study-visuals/flow/flow-drawing';
import { flowFromMarbles } from '../flow';
import { expectMarbleExample } from '../rxjs/marble-testing';
import type { MarbleExample } from '../rxjs/marbles';
import {
  example,
  failureLimit,
  flow,
  fold,
  model,
  opened,
  order,
  type Status,
} from './process-manager';

const path = 'libs/features/tools/src/lib/studies/eip/process-manager.ts';
const record = await loadFlowStudy('eip:131');
const drawn = model(record.example.parameters);
if (drawn.family !== 'flow') throw new Error('The model does not draw a flow.');
const run = drawn;
const { frames } = run.flow;

/** What crosses a link at a step, as `key link`. */
const movesAt = (step: number) => frames[step].hops.map(({ key, link }) => `${key} ${link}`);

/**
 * The same router with every verification failing: the order is repaired twice and the third
 * failure ends the route. Only the reports and the phrases they call for differ.
 */
const failing: MarbleExample = {
  ...example,
  inputs: {
    ...example.inputs,
    outcomes$: {
      ...example.inputs['outcomes$'],
      marbles: '^--i-x-c-x-c-x-a',
      subscriptions: '^------------!',
    },
  },
  outputs: {
    phrases$: {
      label: 'phrases$',
      marbles: '--N-V-F-V-F-V-(S|)',
      values: {
        N: 'resume: next',
        V: 'resume: verify',
        F: 'resume: fix',
        S: `stop after ${failureLimit} failed verifications`,
      },
    },
  },
  origins: {},
  moments: [{ label: 'Limit', frame: 14 }],
  notes: {},
};

it('runs the driven order against the marbles both drawings show', () => {
  expectMarbleExample(example);
});

it('attaches the record to the Process Manager row and reads its code from this module', () => {
  expect(record.visual.model).toBe(path);
  expect(record.visual.family).toBe('flow');
  expect(record.pseudocode.executable).toEqual({ kind: 'rxjs', module: path });
  expect(record.example.parameters).toEqual({ order, failureLimit });
  expect(run.diagram?.marbles.lines.map(({ label }) => label)).toEqual([
    'drive$',
    'outcomes$',
    'phrases$',
  ]);
  expect(frames.map(({ step }) => step)).toEqual(Array.from({ length: 13 }, (_, step) => step));
});

it('moves one message a step, every one of them to or from the router', () => {
  expect(frames.map(({ step }) => movesAt(step))).toEqual([
    [],
    ['d drive'],
    ['N to-executor'],
    ['i from-executor'],
    ['V to-verifier'],
    ['x from-verifier'],
    ['F to-executor'],
    ['c from-executor'],
    ['V to-verifier'],
    ['p from-verifier'],
    ['R to-reviewer'],
    ['a from-reviewer'],
    ['M stop'],
  ]);
  // No worker ever sends to another worker: every link has the router at one end.
  for (const link of flow.links) expect([link.from, link.to]).toContain('router');
  expect(frames[5].values['moves']).toBe(
    'x (verification-result fail) moves from Verifier to Router',
  );
  expect(frames[6].values['moves']).toBe('F (resume: fix) moves from Router to Executor');
});

it('lets the verifier’s result choose the next step', () => {
  // The same worker reports at steps 5 and 9; what it says decides where the order goes next.
  expect([movesAt(5), movesAt(6)]).toEqual([['x from-verifier'], ['F to-executor']]);
  expect([movesAt(9), movesAt(10)]).toEqual([['p from-verifier'], ['R to-reviewer']]);
  // Two different reports call for the same next step.
  expect(fold(opened, 'implementation-ready').phrase).toBe('resume: verify');
  expect(fold(opened, 'repair-complete').phrase).toBe('resume: verify');
  expect(() => fold(opened, 'a message with no rule')).toThrow(
    'The router has no rule for a message with no rule.',
  );
});

it('keeps a record of the order, and the drawing’s router says what the fold holds', () => {
  const outcomes = example.inputs['outcomes$']?.values ?? {};
  const read = [`drive: ${order}`, ...'ixcpa'.split('').map((key) => outcomes[key])];
  const statuses = read.reduce<readonly Status[]>(
    (all, message) => [...all, fold(all[all.length - 1] ?? opened, message)],
    [],
  );
  expect(statuses.map(({ failures }) => failures)).toEqual([0, 0, 1, 1, 1, 1]);
  // At each step where a message reaches it, and at the step after, the router names the
  // failures its record holds.
  const arrivals = [1, 3, 5, 7, 9];
  arrivals.forEach((step, index) => {
    const counted = `${statuses[index].failures} of ${failureLimit} failed`;
    expect(frames[step].states['router']).toContain(counted);
    expect(frames[step + 1].states['router']).toContain(counted);
  });
  expect(frames[11].states['router']).toBe('stop next, ready to merge');
  expect(statuses[statuses.length - 1]).toEqual({
    phrase: 'stop for the operator merge',
    failures: 1,
    stopped: true,
  });
});

it('stops reading reports when the route ends', () => {
  const lines = run.diagram?.marbles.lines ?? [];
  expect(lines.find(({ id }) => id === 'outcomes$')).toMatchObject({
    unsubscribedAt: 11,
    cancelled: true,
  });
  expect(run.diagram?.marbles.lastFrame).toBe(12);
  expect(frames[12].values['delivered']).toBe(
    'N (resume: next), V (resume: verify), F (resume: fix), V (resume: verify), R (resume: final review), M (stop for the operator merge)',
  );
});

it('ends the route at the failure limit instead of sending another repair', () => {
  expectMarbleExample(failing);
  const stopped = flowFromMarbles(failing, { ...flow, states: {} }, record.example.parameters);
  const last = stopped.flow.frames[stopped.flow.frames.length - 1];
  expect(last.step).toBe(14);
  expect(last.hops.map(({ key, link }) => `${key} ${link}`)).toEqual(['S stop']);
  expect(stopped.flow.frames[13].hops.map(({ key }) => key)).toEqual(['x']);
  // Two repairs were sent, and none after the failure that reached the limit.
  const fixes = stopped.flow.frames.flatMap(({ hops }) => hops.filter(({ key }) => key === 'F'));
  expect(fixes).toHaveLength(failureLimit - 1);
  // The final review's pass, scripted after the stop, is never read.
  const outcomes = stopped.diagram?.marbles.lines.find(({ id }) => id === 'outcomes$');
  expect(outcomes?.events.find(({ key }) => key === 'a')).toMatchObject({ delivered: false });
});

it('names its moments, opens at the start and fills every placeholder', () => {
  expect(run.moments).toEqual([
    { label: 'Drive', step: 1 },
    { label: 'Verification fails', step: 5 },
    { label: 'Back to the executor', step: 6 },
    { label: 'Passes on retry', step: 9 },
    { label: 'Stop for merge', step: 12 },
  ]);
  expect(run.initialStep).toBe(0);
  const prose = [
    record.visual.textEquivalent,
    record.example.description,
    ...record.mechanism.steps.map(({ text }) => text),
    ...record.limits,
  ].join(' ');
  const names = [...prose.matchAll(/\{(\w+)\}/g)].map(([, name]) => name);
  expect(names).toContain('delivered');
  for (const frame of frames) for (const name of names) expect(frame.values[name]).toBeDefined();
  // Every frame has its own sentence, and no node's state outgrows the drawing.
  for (const frame of frames) {
    expect(frame.note).toBe(example.notes?.[frame.step]);
    for (const state of Object.values(frame.states)) expect(state.length).toBeLessThanOrEqual(40);
  }
});

it('annotates the reading with the pattern’s parts, on the code that carries each', () => {
  // Each comment sits on the line before the code it names.
  const lines = (record.pseudocode.rxjs ?? '').split('\n').map((line) => line.trim());
  const before = (code: string) => lines[lines.findIndex((line) => line.startsWith(code)) - 1];
  expect(before('phrases$ = merge(')).toMatch(/^\/\/ The manager's inbox/);
  expect(before('scan(fold, opened)')).toMatch(/^\/\/ The process instance's state/);
  expect(before('takeWhile(')).toMatch(/^\/\/ Where the process ends/);
  expect(before('map(')).toMatch(/^\/\/ The command to the step/);
  expect(before('delay(1)')).toMatch(/^\/\/ Pacing only/);
});

// The drawing sets a state in 13-unit type, about 0.56 of that to a character, inside a box with
// 12 units of padding on each side.
const stateChar = 13 * 0.56;
const padding = 12;

it('fits every state inside its box, across a wide screen and down a phone', () => {
  for (const direction of ['across', 'down'] as const)
    for (const { step } of frames) {
      const drawing = flowDrawing(run.flow, step, direction);
      for (const line of drawing.states) {
        const box = drawing.nodes.find(
          ({ x, y, width, height }) =>
            line.x >= x && line.x <= x + width && line.y >= y && line.y <= y + height,
        );
        expect(box, `${line.text} sits in no box`).toBeDefined();
        expect(
          line.text.length * stateChar,
          `${line.text} at step ${step}, ${direction}`,
        ).toBeLessThanOrEqual((box?.width ?? 0) - 2 * padding);
      }
    }
});

import { loadModelStudy, studyTranslate, tokensOf } from '../../../../testing/src';
import { codeBlocks, fillValues } from '../study-text';
import {
  bind,
  configurationOf,
  draw,
  model,
  pluginRun,
  readParameters,
  totalsOf,
} from './plugin.model';
import { present } from './plugin.presentation';

const record = await loadModelStudy('poeaa:443', 'states');
const parameters = record.example.parameters;
const example = { productionStub: false };

it('runs the example the record names, from the record’s own parameters', () => {
  expect(parameters).toEqual({ ...example, productionStub: 0 });
  expect(readParameters(parameters)).toEqual(example);
  expect(record.pseudocode.executable?.module).toBe(record.visual.model);
  expect(record.pseudocode.rxjs).toBeNull();
  expect(codeBlocks(record.pseudocode.ordinary)).toHaveLength(record.mechanism.steps.length);
});

it('binds a linked name, refuses one the build lacks, and shows a frame only through canvas', () => {
  expect(bind('canvas')).toEqual({ kind: 'bound', painter: 'canvas' });
  expect(bind('null')).toEqual({ kind: 'bound', painter: 'null' });
  // The name is data, so a misspelling is caught only here, when the environment starts.
  expect(bind('canvass')).toEqual({ kind: 'refused' });
  expect(draw({ painter: 'canvas', drawn: 0, shown: 0 })).toEqual({
    painter: 'canvas',
    drawn: 1,
    shown: 1,
  });
  expect(draw({ painter: 'null', drawn: 0, shown: 0 })).toEqual({
    painter: 'null',
    drawn: 1,
    shown: 0,
  });
});

it('gives each environment the painter its configuration names, with no other change', () => {
  expect(configurationOf(example)).toEqual({
    development: 'canvas',
    tests: 'null',
    production: 'canvas',
  });
  const steps = pluginRun(configurationOf(example));
  const last = steps[steps.length - 1];
  expect(steps).toHaveLength(7);
  expect(last.bindings).toEqual({
    development: { painter: 'canvas', drawn: 1, shown: 1 },
    tests: { painter: 'null', drawn: 1, shown: 0 },
    production: { painter: 'canvas', drawn: 1, shown: 1 },
  });
  expect(totalsOf(last)).toEqual({ drawn: 3, shown: 2 });
  // Nothing draws before every environment has bound its painter.
  expect(steps.slice(0, 4).every((step) => totalsOf(step).drawn === 0)).toBe(true);
});

it('binds the stub in production without complaint when its configuration names it', () => {
  const steps = pluginRun(configurationOf({ productionStub: true }));
  const last = steps[steps.length - 1];
  expect(steps[3].operation).toEqual({
    kind: 'bind',
    environment: 'production',
    result: { kind: 'bound', painter: 'null' },
  });
  expect(
    steps.some(({ operation }) => operation.kind === 'bind' && operation.result.kind === 'refused'),
  ).toBe(false);
  expect(last.bindings.production).toEqual({ painter: 'null', drawn: 1, shown: 0 });
  expect(totalsOf(last)).toEqual({ drawn: 3, shown: 1 });
});

it('refuses to start an environment whose configuration names a painter the build lacks', () => {
  const steps = pluginRun({ development: 'canvas', tests: 'null', production: 'webgl' });
  expect(steps[3].operation).toEqual({
    kind: 'bind',
    environment: 'production',
    result: { kind: 'refused' },
  });
  expect(steps).toHaveLength(6);
  expect(steps[steps.length - 1].bindings.production).toBeUndefined();
  const drawn = present({ example, steps, parameters }, studyTranslate).states.frames;
  expect(drawn[3].moves).toEqual([]);
  expect(drawn[3].placements.find(({ object }) => object === 'production')).toEqual({
    object: 'production',
    node: 'unbound',
    note: 'refused at start-up',
  });
});

it('draws each environment in the column of its painter and names them in the text equivalent', () => {
  const run = model(parameters, studyTranslate);
  const frames = run.states.frames;
  expect(frames).toHaveLength(7);
  const at = (step: number) =>
    Object.fromEntries(frames[step].placements.map(({ object, node }) => [object, node]));
  expect(at(0)).toEqual({ development: 'unbound', tests: 'unbound', production: 'unbound' });
  expect(at(3)).toEqual({ development: 'canvas', tests: 'null', production: 'canvas' });
  expect(frames[5].moves).toEqual([
    { object: 'tests', from: 'null', to: 'null', transition: 'drawNull' },
  ]);
  expect(fillValues(record.visual.textEquivalent, frames[3].values)).toBe(
    'Step 3: Production moves from Unbound to Canvas painter by bind. Bindings: Unbound: none; Canvas painter: Development, Production; Null painter: Test run. Frames drawn: 0; shown on a screen: 0.',
  );
  expect(frames[6].values['shown']).toBe('2');
  expect(run.moments.map(({ label, step }) => [label, step])).toEqual([
    ['Development', 1],
    ['Test run', 2],
    ['Production', 3],
    ['Test frame', 5],
    ['Production frame', 6],
  ]);
});

it('shows the stub in production in the drawing: a frame drawn and never shown', () => {
  const run = model({ ...parameters, productionStub: 1 }, studyTranslate);
  const frames = run.states.frames;
  const last = frames[frames.length - 1];
  expect(last.moves).toEqual([
    { object: 'production', from: 'null', to: 'null', transition: 'drawNull' },
  ]);
  expect(last.placements.find(({ object }) => object === 'production')?.note).toBe(
    '1 drawn, 0 shown',
  );
  expect(last.note).toContain('nothing reports an error');
  expect(last.values['shown']).toBe('1');
  expect(frames[0].values['productionPainter']).toBe('null');
  // Every environment stays bound under its token letter, and only production draws.
  const keys = tokensOf(run.states);
  expect(last.placements.map(({ object }) => keys[object])).toEqual(['D', 'T', 'P']);
});

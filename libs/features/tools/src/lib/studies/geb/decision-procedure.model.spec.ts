import { loadModelStudy, studyTranslate } from '../../../../testing/src';
import { codeBlocks, fillValues } from '../study-text';
import { model } from './decision-procedure.model';
import { readParameters, relayRun } from './decision-procedure.simulation';

const record = await loadModelStudy('geb1:53', 'relations');
const parameters = record.example.parameters;

it('halts with both verdicts after using each reachable source once, even around the cycle', () => {
  expect(parameters).toEqual({ coveWire: 0 });
  expect(record.pseudocode.executable?.module).toBe(record.visual.model);
  expect(codeBlocks(record.pseudocode.ordinary)).toHaveLength(record.mechanism.steps.length);

  const run = relayRun(readParameters(parameters));
  expect(run.lit).toEqual(['dock', 'steps', 'bell', 'beacon']);
  expect(run.steps.filter(({ kind }) => kind === 'rule')).toEqual([
    { kind: 'rule', rule: { from: 'dock', to: 'steps' }, discovered: true },
    { kind: 'rule', rule: { from: 'steps', to: 'bell' }, discovered: true },
    { kind: 'rule', rule: { from: 'bell', to: 'steps' }, discovered: false },
    { kind: 'rule', rule: { from: 'bell', to: 'beacon' }, discovered: true },
  ]);
  expect(run.steps.slice(-2)).toEqual([
    { kind: 'verdict', lantern: 'beacon', derived: true },
    { kind: 'verdict', lantern: 'cove', derived: false },
  ]);
});

it('draws the tested return wire and reads each claim from the finished run', () => {
  const { relations, moments } = model(parameters, studyTranslate);
  expect(relations.edges).toContainEqual(
    expect.objectContaining({ from: 'cove', to: 'bell', label: 'can light' }),
  );
  expect(relations.frames[3]).toMatchObject({
    focus: { relation: 'bell-steps' },
    note: 'Steps is already lit. The rule from Bell adds nothing to the queue.',
  });
  expect(relations.frames[5]).toMatchObject({
    focus: { node: 'beacon' },
    note: 'Yes. Beacon is in the lit set after every queued lantern has been checked.',
  });
  expect(moments.at(-1)).toEqual({ label: 'Cove verdict', step: 6 });
  expect(fillValues(record.visual.textEquivalent, relations.frames[6].values)).toBe(
    'Cove. No. Every queued lantern has been checked and Cove never entered the lit set.',
  );
});

it('derives Cove when Bell can light it, then skips the return to the already lit Bell', () => {
  const changed = { ...parameters, coveWire: 1 };
  const run = relayRun(readParameters(changed));
  expect(run.lit).toEqual(['dock', 'steps', 'bell', 'beacon', 'cove']);
  expect(run.steps[6]).toEqual({
    kind: 'rule',
    rule: { from: 'cove', to: 'bell' },
    discovered: false,
  });
  expect(run.steps.at(-1)).toEqual({ kind: 'verdict', lantern: 'cove', derived: true });

  const { relations } = model(changed, studyTranslate);
  expect(relations.edges).toContainEqual(
    expect.objectContaining({ from: 'bell', to: 'cove', label: 'can light' }),
  );
  expect(relations.frames.at(-1)?.note).toBe(
    'Yes. Cove is in the lit set after every queued lantern has been checked.',
  );
});

it('refuses a wire setting outside the record’s two supported values', () => {
  expect(() => model({ ...parameters, coveWire: 2 }, studyTranslate)).toThrow(
    'Parameter coveWire must be 0 or 1.',
  );
});

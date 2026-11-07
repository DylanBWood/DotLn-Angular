import { createCatalogLoader } from '@dotln-angular/catalog';
import type { ConceptStudy } from '@dotln-angular/models';

import { studyTranslate } from '../../../testing/src';
import { flowDrawing } from '../composites/study-visuals/flow/flow-drawing';
import { motionDrawing } from '../composites/study-visuals/motion/motion-drawing';
import { order as processOrder } from './eip/process-manager';
import { ticksOf } from './study-model';
import { studyModels } from './study-models';
import { translateStudy } from './study-record';
import { placeholdersIn } from './study-text';
import type { StudyTranslate } from './study-translate';

const records = async () => {
  const loader = createCatalogLoader();
  const { studies } = await loader.summary();
  const found = await Promise.all(
    studies.works.flatMap(({ studies }) => studies.map(({ id }) => loader.study(id))),
  );
  return found
    .filter((study): study is ConceptStudy => study !== null)
    .map((study) => translateStudy(study, studyTranslate));
};

/** A resolved message may contain nested messages; text outside either end stays untrusted. */
function outsideMessages(text: string): string {
  let depth = 0;
  let outside = '';
  for (const character of text) {
    if (character === '⟦') depth++;
    else if (character === '⟧' && depth > 0) depth--;
    else if (depth === 0) outside += character;
  }
  return outside;
}

function hasUntranslatedWords(text: string): boolean {
  // Scientific notation is still a number, including when a vector contains several numbers.
  const outside = outsideMessages(text).replace(/[+-]?\d+(?:\.\d+)?e[+-]?\d+/gi, '');
  return /\p{L}/u.test(outside);
}

// Only these message fields name machine symbols. The same strings in a caption or other
// parameter still need translation; a whole word is never accepted as a marble symbol.
const symbolMessages = new Set([
  'studyCommon.marbles.emittedValue',
  'studyCommon.marbles.keyValue',
  'studyCommon.marbles.valueAt',
  'studyCommon.flow.move',
  'studyCommon.flow.moveOnChannel',
]);

function isMachineParameter(key: string, name: string, value: string): boolean {
  const symbol = (text: string) => /^[a-zA-Z0-9]$/.test(text);
  if (name === 'key' && symbolMessages.has(key)) return symbol(value);
  if (key === 'studyCommon.marbles.value' && name === 'value') return symbol(value);
  if (key === 'studyCommon.flow.held' && name === 'keys') return value.split('⟦, ⟧').every(symbol);
  return (
    key.startsWith('studyEip.process-manager.model.') && name === 'order' && value === processOrder
  );
}

it('recognizes words appended or prepended to a message and accepts nested translated values', () => {
  expect(hasUntranslatedWords('⟦A resolved message⟧ untranslated suffix')).toBe(true);
  expect(hasUntranslatedWords('untranslated prefix ⟦A resolved message⟧')).toBe(true);
  expect(hasUntranslatedWords('⟦Outer ⟦translated value⟧ message⟧')).toBe(false);
  expect(hasUntranslatedWords('(1.2e-8, -3e+9)')).toBe(false);
});

it('admits machine symbols only in declared message fields', () => {
  expect(isMachineParameter('studyCommon.marbles.emittedValue', 'key', 'a')).toBe(true);
  expect(isMachineParameter('studyCommon.flow.held', 'keys', 'a⟦, ⟧B')).toBe(true);
  expect(isMachineParameter('studyCommon.flow.held', 'keys', 'untranslated')).toBe(false);
  expect(isMachineParameter('studyCommon.marbles.emittedValue', 'key', 'literal')).toBe(false);
  expect(isMachineParameter('studyCommon.marbles.emittedValue', 'value', 'a')).toBe(false);
});

it('lists a model for exactly the paths the records name', async () => {
  const named = (await records()).flatMap(({ visual }) => visual?.model ?? []);
  expect(Object.keys(studyModels).sort()).toEqual([...new Set(named)].sort());
});

it('runs every model from its record in the family the record declares, and each moment supplies the values the prose reads', async () => {
  for (const record of await records()) {
    if (!record.visual?.model) continue;
    const { model } = await studyModels[record.visual.model]();
    const run = model(record.example.parameters, studyTranslate);
    expect(run.family, record.slug).toBe(record.visual.family);
    const ticks = ticksOf(run);
    expect(ticks.length, record.slug).toBeGreaterThan(1);
    expect(run.initialStep, record.slug).toBeLessThan(ticks.length);
    for (const moment of run.moments) expect(moment.step, record.slug).toBeLessThan(ticks.length);
    const names = [
      ...placeholdersIn(record.visual.textEquivalent),
      ...placeholdersIn(record.example.description),
      ...record.limits.flatMap(placeholdersIn),
      ...record.mechanism.steps.flatMap(({ text }) => placeholdersIn(text)),
    ];
    for (const tick of ticks)
      for (const name of names) expect(tick.values[name], `${record.slug}: ${name}`).toBeDefined();
  }
});

it('draws a token for each message moving at a step of a flow, and none where nothing moves, both ways', async () => {
  for (const record of await records()) {
    if (record.visual?.family !== 'flow' || !record.visual.model) continue;
    const { model } = await studyModels[record.visual.model]();
    const run = model(record.example.parameters, studyTranslate);
    if (run.family !== 'flow') continue;
    for (const frame of run.flow.frames)
      for (const direction of ['across', 'down'] as const) {
        const where = `${record.slug}, step ${frame.step}, ${direction}`;
        const moving = flowDrawing(run.flow, frame.step, direction).tokens.filter(
          ({ state }) => state === 'moving',
        );
        expect(
          moving.every(({ key }) => key !== ''),
          where,
        ).toBe(true);
        // A capsule names every message it carries, one word each.
        expect(moving.flatMap(({ key }) => key.split(' ')).sort(), where).toEqual(
          frame.hops.map(({ key }) => key).sort(),
        );
      }
  }
});

it('rests every moving message on its line clear of every box, both ways', async () => {
  const overlaps: string[] = [];
  for (const record of await records()) {
    if (record.visual?.family !== 'flow' || !record.visual.model) continue;
    const { model } = await studyModels[record.visual.model]();
    const run = model(record.example.parameters, studyTranslate);
    if (run.family !== 'flow') continue;
    for (const frame of run.flow.frames)
      for (const direction of ['across', 'down'] as const) {
        const { nodes, tokens } = flowDrawing(run.flow, frame.step, direction);
        for (const token of tokens.filter(({ state }) => state === 'moving'))
          for (const node of nodes) {
            const apart =
              token.x + token.width / 2 <= node.x ||
              token.x - token.width / 2 >= node.x + node.width ||
              token.y + token.r <= node.y ||
              token.y - token.r >= node.y + node.height;
            if (!apart)
              overlaps.push(
                `${record.slug}, step ${frame.step}, ${direction}: ${token.key} on ${node.id}`,
              );
          }
      }
  }
  expect(overlaps).toEqual([]);
});

it('stays a sound example across the whole range of every input a model offers', async () => {
  for (const record of await records()) {
    if (!record.visual?.model) continue;
    const { model } = await studyModels[record.visual.model]();
    for (const input of model(record.example.parameters, studyTranslate).inputs ?? [])
      for (const value of [input.min, input.max]) {
        const run = model({ ...record.example.parameters, [input.name]: value }, studyTranslate);
        const where = `${record.slug}: ${input.name} = ${value}`;
        expect(ticksOf(run).length, where).toBeGreaterThan(1);
        if (run.family !== 'motion') continue;
        const { minX, maxX, minY, maxY } = run.motion.bounds;
        for (const { bodies } of run.motion.frames)
          for (const { x, y } of bodies) {
            expect(Number.isFinite(x) && Number.isFinite(y), where).toBe(true);
            expect(x >= minX && x <= maxX && y >= minY && y <= maxY, where).toBe(true);
          }
      }
  }
});

it('keeps every supplied movement name visible and apart on every frame', async () => {
  const problems: string[] = [];
  for (const record of await records()) {
    if (!record.visual?.model) continue;
    const run = (await studyModels[record.visual.model]()).model(
      record.example.parameters,
      studyTranslate,
    );
    if (run.family !== 'motion') continue;
    for (const [step, frame] of run.motion.frames.entries()) {
      const drawing = motionDrawing(run.motion, step);
      const source = [...frame.bodies, ...(frame.marks ?? [])].filter(({ label }) => label);
      const labels = [...drawing.bodies, ...drawing.marks].filter(({ label }) => label);
      if (source.length !== labels.length)
        problems.push(`${record.slug} frame ${step}: missing name`);
      for (const [i, label] of labels.entries()) {
        // Even a narrow screen uses at most 24 drawing units of font height. Keep lines apart
        // when their conservative name widths overlap; the browser suite checks the real glyphs.
        for (const other of labels.slice(i + 1)) {
          if (
            Math.abs(label.labelY - other.labelY) < 30 &&
            Math.abs(label.labelX - other.labelX) <
              ((label.label?.length ?? 0) + (other.label?.length ?? 0)) * 6
          )
            problems.push(`${record.slug} frame ${step}: ${label.label} / ${other.label}`);
        }
      }
    }
  }
  expect(problems).toEqual([]);
});

it('routes visible narration through messages across every model and its input boundaries', async () => {
  const fields = new Set([
    'label',
    'caption',
    'note',
    'title',
    'intro',
    'xLabel',
    'yLabel',
    'unit',
    'operator',
    'content',
    'value',
  ]);
  const problems = new Set<string>();
  const translated: StudyTranslate = (key, parameters) => {
    for (const [name, value] of Object.entries(parameters ?? {}))
      if (
        typeof value === 'string' &&
        hasUntranslatedWords(value) &&
        !isMachineParameter(key, name, value)
      )
        problems.add(`${key}: literal parameter ${name} = ${value}`);
    return `⟦${studyTranslate(key, parameters)}⟧`;
  };
  const inspect = (value: unknown, path: string, visible = false) => {
    if (typeof value === 'string') {
      if (visible && hasUntranslatedWords(value)) problems.add(path);
      return;
    }
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      value.forEach((entry, index) => inspect(entry, `${path}[${index}]`, visible));
      return;
    }
    for (const [key, entry] of Object.entries(value))
      inspect(
        entry,
        `${path}.${key}`,
        fields.has(key) ||
          ['lines', 'findings', 'states', 'values'].some((field) => path.endsWith(`.${field}`)) ||
          (Array.isArray(entry) && ['lines', 'findings'].includes(key)),
      );
  };
  for (const record of await records()) {
    if (!record.visual?.model) continue;
    const { model } = await studyModels[record.visual.model]();
    const initial = model(record.example.parameters, studyTranslate);
    const inputs = [
      record.example.parameters,
      ...(initial.inputs ?? []).flatMap((input) =>
        [input.min, input.max].map((value) => ({
          ...record.example.parameters,
          [input.name]: value,
        })),
      ),
    ];
    for (const [index, parameters] of inputs.entries())
      inspect(model(parameters, translated), `${record.slug} case ${index}`);
  }
  expect([...problems]).toEqual([]);
});

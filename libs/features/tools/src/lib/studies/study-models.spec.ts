import { createCatalogLoader } from '@dotln-angular/catalog';
import type { ConceptStudy } from '@dotln-angular/models';

import { flowDrawing } from '../composites/study-visuals/flow/flow-drawing';
import { ticksOf } from './study-model';
import { studyModels } from './study-models';
import { placeholdersIn } from './study-text';

const records = async () => {
  const loader = createCatalogLoader();
  const { studies } = await loader.summary();
  const found = await Promise.all(
    studies.works.flatMap(({ studies }) => studies.map(({ id }) => loader.study(id))),
  );
  return found.filter((study): study is ConceptStudy => study !== null);
};

it('lists a model for exactly the paths the records name', async () => {
  const named = (await records()).flatMap(({ visual }) => visual?.model ?? []);
  expect(Object.keys(studyModels).sort()).toEqual([...new Set(named)].sort());
});

it('runs every model from its record in the family the record declares, and each moment supplies the values the prose reads', async () => {
  for (const record of await records()) {
    if (!record.visual?.model) continue;
    const { model } = await studyModels[record.visual.model]();
    const run = model(record.example.parameters);
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
    const run = model(record.example.parameters);
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
    const run = model(record.example.parameters);
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
    for (const input of model(record.example.parameters).inputs ?? [])
      for (const value of [input.min, input.max]) {
        const run = model({ ...record.example.parameters, [input.name]: value });
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

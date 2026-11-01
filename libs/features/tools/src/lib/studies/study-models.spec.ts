import { createCatalogLoader } from '@dotln-angular/catalog';
import type { ConceptStudy } from '@dotln-angular/models';

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

it('runs every model from its record, and each moment supplies the values the prose reads', async () => {
  for (const record of await records()) {
    if (!record.visual?.model) continue;
    const { model } = await studyModels[record.visual.model]();
    const run = model(record.example.parameters);
    expect(run.motion.frames.length, record.slug).toBeGreaterThan(1);
    expect(run.initialStep, record.slug).toBeLessThan(run.motion.frames.length);
    for (const moment of run.moments)
      expect(moment.step, record.slug).toBeLessThan(run.motion.frames.length);
    const names = [
      ...placeholdersIn(record.visual.textEquivalent),
      ...placeholdersIn(record.example.description),
      ...record.limits.flatMap(placeholdersIn),
      ...record.mechanism.steps.flatMap(({ text }) => placeholdersIn(text)),
    ];
    for (const frame of run.motion.frames)
      for (const name of names) expect(frame.values[name], `${record.slug}: ${name}`).toBeDefined();
  }
});

it('stays a sound example across the whole range of every input a model offers', async () => {
  for (const record of await records()) {
    if (!record.visual?.model) continue;
    const { model } = await studyModels[record.visual.model]();
    for (const input of model(record.example.parameters).inputs ?? [])
      for (const value of [input.min, input.max]) {
        const run = model({ ...record.example.parameters, [input.name]: value });
        const where = `${record.slug}: ${input.name} = ${value}`;
        expect(run.motion.frames.length, where).toBeGreaterThan(1);
        const { minX, maxX, minY, maxY } = run.motion.bounds;
        for (const { bodies } of run.motion.frames)
          for (const { x, y } of bodies) {
            expect(Number.isFinite(x) && Number.isFinite(y), where).toBe(true);
            expect(x >= minX && x <= maxX && y >= minY && y <= maxY, where).toBe(true);
          }
      }
  }
});

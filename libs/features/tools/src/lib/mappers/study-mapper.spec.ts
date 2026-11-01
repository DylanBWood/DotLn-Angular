import type { ConceptStudy, Tool } from '@dotln-angular/models';

import type { StudyModel } from '../studies/study-model';
import { clampStep, mapStudy } from './study-mapper';

const reader = { step: null, view: 'motion', expanded: [], playing: false, inputs: {} } as const;
const studyFixture: ConceptStudy = {
  schema: 'concept-study-v0',
  id: 'sample:1',
  work: 'aifg',
  slug: 'flock',
  authored: { by: 'author', on: '2026-10-31', reviewedBy: ['one', 'two'], state: 'checked' },
  intuition: { text: 'Three rules.', situation: 'A crowd.' },
  example: { name: 'Sheep', description: 'Three sheep.', parameters: { sheep: 3 } },
  mechanism: { steps: [] },
  pseudocode: {
    ordinary: 'neighbours = within(radius)\n\nsteer = blend(rules, neighbours)',
    rxjs: 'frames$.pipe(scan(stepFlock, start))',
    executable: null,
  },
  visual: null,
  implementations: [],
  references: [],
  limits: ['A flock has no destination.'],
  nearby: [{ id: 'sample:2', why: 'It keeps track of a group.' }],
};
const catalogFixture = [{ id: 'sample:2', title: 'Unit of Work' }] as unknown as readonly Tool[];
const frame = (seconds: number, distance: string) => ({
  seconds,
  bodies: [{ id: 'sheep', x: seconds, y: 0 }],
  values: { distance },
  note: `Note ${distance}`,
  worked: { title: `Worked ${distance}`, lines: [] },
});
const model: StudyModel = {
  motion: {
    bounds: { minX: 0, maxX: 10, minY: -1, maxY: 1 },
    frames: [frame(0, 'far'), frame(1, 'near')],
  },
  timeline: null,
  initialStep: 1,
  moments: [],
  legend: [],
  caption: 'Read it.',
};
const record = {
  ...studyFixture,
  visual: { family: 'motion' as const, model: 'libs/m.ts', textEquivalent: 'Now {distance}.' },
  mechanism: {
    steps: [
      { title: 'Look', text: 'It is {distance}.' },
      { title: 'Move', text: 'Then move.' },
    ],
  },
};

it('fills the record’s prose from the selected moment', () => {
  const view = mapStudy({ record, model }, reader, catalogFixture);
  expect(view.visual?.step).toBe(1);
  expect(view.visual?.textEquivalent).toBe('Now near.');
  expect(view.visual?.note).toBe('Note near');
  expect(view.worked?.title).toBe('Worked near');
  expect(view.steps[0].text).toBe('It is near.');
  const earlier = mapStudy({ record, model }, { ...reader, step: 0 }, catalogFixture);
  expect(earlier.visual?.textEquivalent).toBe('Now far.');
});

it('fills the example and the limits too, so a value in them follows the inputs', () => {
  const view = mapStudy(
    {
      record: {
        ...record,
        example: { ...record.example, description: 'They start {distance} apart.' },
        limits: ['It fails when {distance}.'],
      },
      model,
    },
    reader,
    catalogFixture,
  );
  expect(view.example.description).toBe('They start near apart.');
  expect(view.limits).toEqual(['It fails when near.']);
});

it('gives an input the value a reader chose, or the record’s', () => {
  const inputs = [
    { name: 'sheep', label: 'Sheep', unit: 'sheep', min: 1, max: 9, step: 1 },
    { name: 'dogs', label: 'Dogs', unit: 'dogs', min: 0, max: 3, step: 1 },
  ];
  const parameters = { ...record.example.parameters, dogs: 1 };
  const view = mapStudy(
    {
      record: { ...record, example: { ...record.example, parameters } },
      model: { ...model, inputs },
    },
    { ...reader, inputs: { sheep: 7 } },
    catalogFixture,
  );
  expect(view.visual?.inputs.map(({ name, value }) => [name, value])).toEqual([
    ['sheep', 7],
    ['dogs', 1],
  ]);
});

it('gives each mechanism step the lines of pseudocode it explains', () => {
  const view = mapStudy({ record, model }, reader, catalogFixture);
  expect(view.steps.map(({ code }) => code)).toEqual([
    'neighbours = within(radius)',
    'steer = blend(rules, neighbours)',
  ]);
});

it('leaves out what the record does not carry', () => {
  const view = mapStudy(
    {
      record: {
        ...studyFixture,
        pseudocode: { ...studyFixture.pseudocode, rxjs: null },
      },
      model: null,
    },
    reader,
    catalogFixture,
  );
  expect(view.visual).toBeNull();
  expect(view.rxjs).toBeNull();
  expect(view.worked).toBeNull();
  expect(view.comparison).toBeNull();
});

it('labels the RxJS reading from the record', () => {
  const illustrative = mapStudy({ record: studyFixture, model: null }, reader, catalogFixture);
  expect(illustrative.rxjs?.executable).toBe(false);
  const executable = mapStudy(
    {
      record: {
        ...studyFixture,
        pseudocode: {
          ...studyFixture.pseudocode,
          executable: { kind: 'rxjs', module: 'libs/m.ts' },
        },
      },
      model: null,
    },
    reader,
    catalogFixture,
  );
  expect(executable.rxjs?.executable).toBe(true);
});

it('names nearby concepts by title and drops one the catalog no longer has', () => {
  const view = mapStudy(
    {
      record: {
        ...studyFixture,
        nearby: [...studyFixture.nearby, { id: 'gone:1', why: 'It left.' }],
      },
      model: null,
    },
    reader,
    catalogFixture,
  );
  expect(view.nearby).toEqual([
    { id: 'sample:2', title: 'Unit of Work', why: 'It keeps track of a group.' },
  ]);
});

it('keeps a step inside the run', () => {
  expect(clampStep(model, 99)).toBe(1);
  expect(clampStep(model, -3)).toBe(0);
  expect(clampStep(model, 0.6)).toBe(1);
  expect(clampStep(model, null)).toBe(1);
});

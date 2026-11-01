import type { ConceptStudy, Tool } from '@dotln-angular/models';

import { flowStudyModel, marbleFlowStudyModel } from '../composites/study-visuals/fixtures';
import { marbleModel } from '../studies/rxjs/marbles';
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
  family: 'motion',
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

const marbles = marbleModel(
  {
    inputs: {
      source$: { label: 'source$', marbles: '-a-b|', values: { a: 'first', b: 'second' } },
    },
    operator: 'map((value) => value)',
    outputs: { out$: { label: 'out$', marbles: '-a-b|', values: { a: 'first', b: 'second' } } },
    run: ({ inputs }) => ({ out$: inputs['source$'] }),
    moments: [{ label: 'Second', frame: 3 }],
  },
  { sheep: 3 },
);

it('draws a marbles model in its own family, with the frame’s sentence in the prose', () => {
  const view = mapStudy(
    {
      record: {
        ...record,
        visual: { family: 'marbles', model: 'libs/m.ts', textEquivalent: 'Frame {frame}: {now}.' },
      },
      model: marbles,
    },
    reader,
    catalogFixture,
  );
  expect(view.visual?.family).toBe('marbles');
  expect(view.visual?.family === 'marbles' && view.visual.marbles.lines).toHaveLength(2);
  // The example opens on its last frame.
  expect(view.visual?.textEquivalent).toBe('Frame 4: source$ completes; out$ completes.');
  expect(view.visual?.moments).toEqual([{ label: 'Second', step: 3 }]);
  // No stream was opened by the operator, so the legend names no grey line.
  expect(view.visual?.legend.map(({ tone }) => tone)).toEqual(['subject', 'actual']);
  const later = mapStudy(
    {
      record: {
        ...record,
        visual: { family: 'marbles', model: 'libs/m.ts', textEquivalent: '{now}' },
      },
      model: marbles,
    },
    { ...reader, step: 4 },
    catalogFixture,
  );
  expect(later.visual?.step).toBe(4);
  expect(later.visual?.textEquivalent).toBe('source$ completes; out$ completes');
  expect(later.worked?.title).toBe('Frame 4');
  // Every frame is a step, so a quiet frame has its own sentence.
  expect(
    mapStudy(
      {
        record: {
          ...record,
          visual: { family: 'marbles', model: 'libs/m.ts', textEquivalent: '{now}' },
        },
        model: marbles,
      },
      { ...reader, step: 2 },
      catalogFixture,
    ).visual?.textEquivalent,
  ).toBe('nothing new happens');
  expect(clampStep(marbles, 99)).toBe(4);
});

it('draws a flow, and its marble diagram with the diagram’s own legend when a reader switches', () => {
  const flowRecord = {
    ...record,
    visual: {
      family: 'flow' as const,
      model: 'libs/f.ts',
      textEquivalent: 'Step {step}: {moves}.',
    },
  };
  const view = mapStudy(
    { record: flowRecord, model: marbleFlowStudyModel },
    { ...reader, view: 'flow' },
    catalogFixture,
  );
  expect(view.visual?.family).toBe('flow');
  expect(view.visual?.family === 'flow' && view.visual.view).toBe('flow');
  expect(view.visual?.textEquivalent).toBe('Step 0: nothing moves.');
  expect(view.visual?.legend).toEqual(marbleFlowStudyModel.legend);
  const switched = mapStudy(
    { record: flowRecord, model: marbleFlowStudyModel },
    { ...reader, view: 'marbles', step: 1 },
    catalogFixture,
  );
  expect(switched.visual?.family === 'flow' && switched.visual.view).toBe('marbles');
  expect(switched.visual?.legend).toEqual(marbleFlowStudyModel.diagram?.legend);
  expect(switched.visual?.caption).toBe(marbleFlowStudyModel.diagram?.caption);
  // The sentence follows the same step in either drawing.
  expect(switched.visual?.textEquivalent).toContain('Step 1: a (order 31 verified) moves');
  // A flow with no diagram stays a flow, whatever view the reader last chose.
  const written = mapStudy(
    { record: flowRecord, model: flowStudyModel },
    { ...reader, view: 'marbles' },
    catalogFixture,
  );
  expect(written.visual?.family === 'flow' && written.visual.view).toBe('flow');
  expect(written.visual?.family === 'flow' && written.visual.marbles).toBeNull();
});

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

it('labels the RxJS reading from the record, and names the spec that ran an executable one', () => {
  const illustrative = mapStudy({ record: studyFixture, model: null }, reader, catalogFixture);
  expect(illustrative.rxjs?.executable).toBe(false);
  expect(illustrative.rxjs?.spec).toBeNull();
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
  expect(executable.rxjs?.spec).toBe('libs/m.spec.ts');
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

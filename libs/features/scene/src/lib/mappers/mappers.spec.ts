import type { ParamSpec, Tool } from '@dotln-angular/models';
import { TransformKind } from '@dotln-angular/models';
import type {
  CompositionStep,
  SceneFrame,
  SceneMetrics,
  Trial,
  UnitActivity,
} from '@dotln-angular/scene-engine';

import { MetricHistory } from '../facades/metric-history';
import type { InstrumentId } from '../models/scene-view-model';
import { coachStep } from './coach-step';
import {
  fieldRegions,
  mapFrameToRows,
  mapRowViews,
  positionBucket,
  speedBucket,
} from './frame-mapper';
import { mapInspector } from './inspector-mapper';
import { mapLog } from './log-mapper';
import {
  mapFormation,
  mapInstruments,
  mapTrial,
  seriesPoints,
  sparklineFrames,
} from './metric-mapper';
import { mapRailGroups, workColour } from './rail-mapper';
import {
  isRunnable,
  mapToolToStep,
  needsObjective,
  paramChoices,
  railGroupOf,
  type SceneTool,
  selectionProblem,
  stepSize,
} from './tool-mapper';

const field = { width: 120, height: 80 };

const baseTool: SceneTool = {
  id: 'sample:1',
  work: 'aifg',
  title: 'Sample',
  rowType: 'technique',
  classifiedBy: 'spec',
  provenance: 'public-work',
  map: null,
  definition: 'A sample.',
  place: { chapter: 'Chapter 1' },
  related: [],
  hooks: [],
  verified: { kind: 'model-knowledge', note: 'Spec fixture.' },
  kind: 'behaviour',
  status: 'typed',
  faces: {
    scene: ['units-on-terrain'],
    selection: { target: 'unit', min: 2, max: 20 },
    transform: { kind: TransformKind.SteerBlend, params: [] },
    observable: ['spacing'],
    toyMetric: ['cohesion-radius'],
  },
};

const untypedTool: Tool = {
  ...baseTool,
  status: 'untyped',
  faces: {
    ...baseTool.faces,
    transform: { kind: 'untyped', reason: 'Not yet typed.' },
  },
};

const tool = (overrides: Partial<SceneTool['faces']> & { title?: string; id?: string }) => {
  const base = baseTool;
  const { title, id, ...faces } = overrides;
  return {
    ...base,
    id: id ?? base.id,
    title: title ?? base.title,
    faces: { ...base.faces, ...faces },
  } as SceneTool;
};

const param = (name: string, unit = 'weight'): ParamSpec => ({
  name,
  unit,
  default: 1,
  min: 0,
  max: 5,
});

const transform = (kind: TransformKind, ...names: readonly string[]) => ({
  transform: { kind, params: names.map((name) => param(name)) },
});

const unit = (x: number, y: number, speed = 0) => ({
  id: 'a',
  position: { x, y },
  velocity: { x: speed, y: 0 },
  heading: { x: 1, y: 0 },
  radius: 0.5,
  activity: 'idle' as const,
});

describe('the frame mapper', () => {
  it('names the nine parts of the field', () => {
    expect(positionBucket({ x: 1, y: 1 }, field)).toBe('north-west');
    expect(positionBucket({ x: 60, y: 1 }, field)).toBe('north');
    expect(positionBucket({ x: 60, y: 40 }, field)).toBe('centre');
    expect(positionBucket({ x: 119, y: 40 }, field)).toBe('east');
    expect(positionBucket({ x: 120, y: 80 }, field)).toBe('south-east');
  });

  it('buckets speed in words', () => {
    expect(speedBucket(unit(0, 0))).toBe('still');
    expect(speedBucket(unit(0, 0, 2))).toBe('walking');
    expect(speedBucket(unit(0, 0, 9))).toBe('running');
  });

  it('marks the selected row', () => {
    const frame: SceneFrame = {
      frameNo: 0,
      field,
      units: [unit(1, 1)],
      anchors: [],
      slots: [],
      collisions: [],
      objective: null,
    };
    expect(mapFrameToRows(frame, ['a'])[0]).toMatchObject({ id: 'a', selected: true });
    expect(mapFrameToRows(frame, [])[0].selected).toBe(false);
  });

  it('words a row with its label and role colour, and falls back on its id', () => {
    const row = { id: 'a', position: 'north', speed: 'still', activity: 'idle', selected: false };
    const words = {
      position: (bucket: string) => `at ${bucket}`,
      speed: (bucket: string) => bucket,
      activity: (activity: string) => activity,
    };
    const styles = [{ id: 'a', label: 'executor', role: 'planner' }];
    expect(mapRowViews([row] as never, styles, words)[0]).toMatchObject({
      label: 'executor',
      colour: 'var(--dotln-role-planner)',
      position: 'at north',
    });
    expect(mapRowViews([row] as never, [], words)[0]).toMatchObject({
      label: 'a',
      colour: 'var(--dotln-role-executor)',
    });
  });

  it('gives each ninth of the field its centre, each in its own part', () => {
    const regions = fieldRegions(field);
    expect(regions).toHaveLength(9);
    expect(new Set(regions.map(({ bucket }) => bucket)).size).toBe(9);
    expect(regions[4]).toEqual({ bucket: 'centre', point: { x: 60, y: 40 } });
  });
});

describe('the tool mapper', () => {
  it('groups by what a tool does', () => {
    const blend = (...names: string[]) => tool(transform(TransformKind.SteerBlend, ...names));
    expect(railGroupOf(blend('seek-weight'))).toBe('move');
    expect(railGroupOf(blend('separation-weight'))).toBe('group');
    expect(railGroupOf(blend('seek-weight', 'avoidance-weight'))).toBe('avoid');
    expect(railGroupOf(tool(transform(TransformKind.SteerPriority)))).toBe('avoid');
    expect(railGroupOf(tool(transform(TransformKind.FormationFixed)))).toBe('form');
    expect(railGroupOf(tool(transform(TransformKind.FormationTwoLevel)))).toBe('form');
  });

  it('admits only typed tools of a kind the engine interprets', () => {
    expect(isRunnable(tool(transform(TransformKind.SteerBlend)))).toBe(true);
    expect(isRunnable(tool(transform(TransformKind.ChannelPolicy)))).toBe(false);
    expect(isRunnable(untypedTool)).toBe(false);
  });

  it('reads named values from a parameter’s unit, words and all', () => {
    expect(paramChoices(param('pattern', '0 wedge; 1 line; 2 column'))).toEqual([
      { value: 0, name: 'wedge' },
      { value: 1, name: 'line' },
      { value: 2, name: 'column' },
    ]);
    expect(paramChoices(param('falloff', '1 linear; 2 inverse square'))[1].name).toBe(
      'inverse square',
    );
    expect(paramChoices(param('threshold', 'distance'))).toEqual([]);
  });

  it('steps a slider by whole numbers for ranks and costs, finely otherwise', () => {
    expect(stepSize(param('a', 'rank'))).toBe(1);
    expect(stepSize(param('a', 'cost'))).toBe(1);
    expect(stepSize(param('a', 'weight'))).toBeCloseTo(0.05);
  });

  it('knows which tools wait on an objective', () => {
    expect(needsObjective(tool(transform(TransformKind.SteerBlend, 'arrive-weight')))).toBe(true);
    expect(needsObjective(tool(transform(TransformKind.SteerBlend, 'wander-weight')))).toBe(false);
  });

  it('judges a selection by the tool’s face', () => {
    const units = tool({ selection: { target: 'unit', min: 2, max: 3 } });
    expect(selectionProblem(units, 0)).toBe('empty');
    expect(selectionProblem(units, 1)).toBe('too-few');
    expect(selectionProblem(units, 2)).toBeNull();
    expect(selectionProblem(units, 4)).toBe('too-many');
  });

  it('takes whatever is selected as one squad', () => {
    const squad = tool({ selection: { target: 'squad', min: 1, max: 1 } });
    expect(selectionProblem(squad, 0)).toBe('empty');
    expect(selectionProblem(squad, 12)).toBeNull();
  });

  it('turns a tool and its parameters into a step', () => {
    const step = mapToolToStep(tool(transform(TransformKind.SteerBlend)), { a: 1 }, ['u'], 7);
    expect(step).toMatchObject({ at: 7, kind: 'steer.blend', selection: ['u'], params: { a: 1 } });
  });
});

describe('the rail mapper', () => {
  const twoLevel = tool({
    id: 'aifg-a:177',
    title: 'Two-level',
    transform: {
      kind: TransformKind.FormationTwoLevel,
      params: [param('pattern', '0 wedge; 1 line; 2 column')],
    },
  });
  const input = {
    tools: [twoLevel],
    chosenId: twoLevel.id,
    params: { pattern: 1 },
    groupLabel: () => 'Form',
    patternLabel: (name: string) => name.toUpperCase(),
  };

  it('leaves out an empty group and colours a tool by its work', () => {
    const groups = mapRailGroups(input);
    expect(groups.map(({ id }) => id)).toEqual(['form']);
    expect(groups[0].tools[0].colour).toBe(workColour(twoLevel));
  });

  it('marks the chosen pattern', () => {
    const [{ tools }] = mapRailGroups(input);
    expect(tools[0].patterns.map(({ chosen }) => chosen)).toEqual([false, true, false]);
    expect(tools[0].patterns[0].label).toBe('WEDGE');
  });
});

describe('the inspector mapper', () => {
  const inspected = tool({
    title: 'Blend',
    selection: { target: 'unit', min: 2, max: null },
    transform: {
      kind: TransformKind.SteerBlend,
      params: [
        param('seek-weight'),
        param('falloff', '1 linear; 2 inverse square'),
        param('cost.a.b', 'cost'),
      ],
    },
  });
  const input = {
    tool: inspected,
    params: { falloff: 2 },
    selectionCount: 2,
    objectiveSet: true,
    preview: null,
    refusal: null,
    slots: [],
    slotsLive: false,
    units: [],
    styles: [{ id: 'a', label: 'executor', role: 'executor' }],
    transformLabel: () => 'blends',
    choiceLabel: (name: string) => name,
  };

  it('separates sliders, choices and costs', () => {
    const view = mapInspector(input);
    expect(view.params.map(({ name }) => name)).toEqual(['seek-weight', 'falloff']);
    expect(view.params[1].choices.find(({ chosen }) => chosen)?.label).toBe('inverse square');
    expect(view.costs.map(({ name }) => name)).toEqual(['cost.a.b']);
  });

  it('falls back on a parameter’s default', () => {
    expect(mapInspector(input).params[0].value).toBe(1);
  });

  it('reads a quiet preview and a slot table', () => {
    const quiet = mapInspector({
      ...input,
      preview: {
        arrows: [{ id: 'a', position: { x: 0, y: 0 }, acceleration: { x: 0, y: 0 } }],
        assignment: [],
        refusal: null,
      },
      slots: [{ unitId: 'a', slot: 0, slotRole: 'ranged', cost: 2 }],
    });
    expect(quiet.preview).toMatchObject({ units: 1, quiet: true });
    expect(quiet.slots).toMatchObject({ live: false, placed: 0, totalCost: 2 });
    expect(quiet.slots?.rows[0]).toMatchObject({ label: 'executor', number: 1, inPlace: false });
  });

  it('counts only a live table’s units as in place, and none still on their way', () => {
    const unitDoing = (id: string, activity: UnitActivity) => ({
      id,
      position: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      heading: { x: 1, y: 0 },
      radius: 0.5,
      activity,
    });
    const view = mapInspector({
      ...input,
      slotsLive: true,
      slots: [
        { unitId: 'a', slot: 0, slotRole: 'ranged', cost: 0 },
        { unitId: 'b', slot: 1, slotRole: 'ranged', cost: 0 },
        { unitId: 'c', slot: 2, slotRole: 'ranged', cost: 0 },
      ],
      units: [unitDoing('a', 'formed'), unitDoing('b', 'moving'), unitDoing('c', 'stalled')],
    });
    expect(view.slots).toMatchObject({ live: true, placed: 1 });
  });

  it('will not apply a step the preview refused', () => {
    const view = mapInspector({
      ...input,
      refusal: { code: 'uninterpreted', kind: 'x', reason: 'x' },
    });
    expect(view.canApply).toBe(false);
  });
});

describe('the log mapper', () => {
  const step = (at: number, toolId: string, selection = ['a']): CompositionStep => ({
    at,
    toolId,
    kind: 'steer.blend',
    selection,
    params: {},
  });
  const input = {
    steps: [] as readonly CompositionStep[],
    compositions: [],
    forkIndex: null as number | null,
    kept: 0,
    exported: null,
    titleOf: (entry: CompositionStep) => entry.toolId,
  };

  it('folds a run of the same tool on the same units into one entry', () => {
    const { steps } = mapLog({
      ...input,
      steps: [step(0, 'x'), step(5, 'x'), step(9, 'x'), step(9, 'y'), step(10, 'x', ['b'])],
    });
    expect(steps.map(({ title, repeats }) => [title, repeats])).toEqual([
      ['x', 3],
      ['y', 1],
      ['x', 1],
    ]);
  });

  it('keeps a fork between two steps of one tool visible', () => {
    const { steps } = mapLog({ ...input, steps: [step(0, 'x'), step(5, 'x')], forkIndex: 1 });
    expect(steps).toHaveLength(2);
    expect(steps[1].afterFork).toBe(true);
  });
});

describe('the metric mapper', () => {
  const metrics: SceneMetrics = {
    cohesionRadius: 12.34,
    collisions: 2,
    headingVariance: 0.1234,
    timeToObjective: null,
    stalledUnits: 0,
    anchorToMean: null,
    slotError: null,
    assignmentCost: null,
  };
  const labels = {
    name: (id: InstrumentId) => id,
    unit: () => 'u',
    unknown: 'unknown',
  };
  const points = {
    cohesionRadius: '',
    collisions: '',
    headingVariance: '',
    timeToObjective: '',
    stalledUnits: '',
  };

  it('shows each figure in its own precision', () => {
    const [radius, collisions, variance] = mapInstruments(metrics, points, labels);
    expect(radius.value).toBe('12.3');
    expect(collisions.value).toBe('2');
    expect(variance.value).toBe('0.12');
  });

  it('shows unknown, never a fabricated zero', () => {
    const reading = mapInstruments(metrics, points, labels)[3];
    expect(reading).toMatchObject({ value: 'unknown', unit: '', known: false });
  });

  it('has no formation reading outside a formation', () => {
    expect(mapFormation(metrics, 'unknown')).toBeNull();
    expect(mapFormation({ ...metrics, slotError: 1 }, 'unknown')).toEqual({
      anchorToMean: 'unknown',
      slotError: '1.0',
      assignmentCost: 'unknown',
    });
  });

  it('scales a series to the box and leaves gaps out', () => {
    expect(seriesPoints([0, 10], 100, 20)).toBe('0.0,20.0 100.0,0.0');
    expect(seriesPoints([0, null, 10], 100, 20)).toBe('0.0,20.0 100.0,0.0');
    expect(seriesPoints([null, null], 100, 20)).toBe('');
  });

  it('draws a flat series along the floor rather than dividing by nothing', () => {
    expect(seriesPoints([3, 3], 100, 20)).toBe('0.0,20.0 100.0,20.0');
  });

  it('keeps no more than the sparkline’s frames of history', () => {
    const history = new MetricHistory();
    for (let frame = 0; frame <= sparklineFrames + 50; frame += 1)
      history.record({ ...metrics, cohesionRadius: frame });
    const line = history.points().cohesionRadius.split(' ');
    expect(line.length).toBeLessThanOrEqual(120);
    history.reset();
    expect(history.points().cohesionRadius).toBe('');
  });

  it('puts both branches on one scale and marks the divergence', () => {
    const series = { a: [0, 10], b: [0, 5] };
    const blank = { a: [null], b: [null] };
    const trial: Trial = {
      id: 't',
      sceneId: 's',
      seed: 1,
      from: 200,
      frames: 100,
      sampleEvery: 10,
      focus: [],
      branchA: { label: 'before', steps: [] },
      branchB: { label: 'after', steps: [] },
      metrics: {
        cohesionRadius: series,
        collisions: series,
        headingVariance: series,
        timeToObjective: blank,
        stalledUnits: series,
        anchorToMean: blank,
        slotError: blank,
        assignmentCost: blank,
      },
      firstDivergenceFrame: 250,
    };
    const view = mapTrial(trial, labels);
    expect(view.series.map(({ id }) => id)).not.toContain('timeToObjective');
    expect(view.series[0].marker).toBe(120);
    expect(view.series[0].after).toBe('0.0,56.0 240.0,28.0');
    expect(view.series[0].summaryAfter).toBe('5.0');
  });
});

describe('the coach', () => {
  const equip = { at: 0, toolId: 'a', kind: 'steer.blend', selection: ['a'], params: {} };
  const form = { ...equip, kind: 'formation.twoLevel' };
  const objective = { ...equip, kind: 'objective.set', selection: [] };
  const base = {
    selected: 0,
    toolChosen: false,
    steps: [] as readonly CompositionStep[],
    objectiveSet: false,
    compared: false,
  };

  it('starts at selecting', () => {
    expect(coachStep(base)).toBe('select');
  });

  it('counts an objective alone as nothing done yet', () => {
    expect(coachStep({ ...base, steps: [objective], objectiveSet: true })).toBe('select');
  });

  it('moves on from each thing done', () => {
    expect(coachStep({ ...base, selected: 2 })).toBe('tool');
    expect(coachStep({ ...base, selected: 2, toolChosen: true })).toBe('apply');
    expect(coachStep({ ...base, steps: [equip] })).toBe('send');
    expect(coachStep({ ...base, steps: [equip], objectiveSet: true })).toBe('form');
    expect(coachStep({ ...base, steps: [form], objectiveSet: true })).toBe('tune');
  });

  it('goes quiet once the operator has compared', () => {
    expect(coachStep({ ...base, steps: [form], compared: true })).toBeNull();
  });
});

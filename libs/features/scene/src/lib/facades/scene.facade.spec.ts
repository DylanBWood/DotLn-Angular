import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { createCatalogLoader } from '@dotln-angular/catalog';
import type { Tool } from '@dotln-angular/models';
import { sceneTransformKinds } from '@dotln-angular/models';
import { encodeExport, SceneStore } from '@dotln-angular/scene-data-access';
import type { Composition, SceneFrame } from '@dotln-angular/scene-engine';
import {
  applyStep,
  createSimulation,
  frameOf,
  hashFrame,
  interpretedKinds,
  objectiveKind,
  readsParam,
  runBranch,
} from '@dotln-angular/scene-engine';

import { provideSceneFacadeTestKit, type SceneFacadeKitOptions } from '../../../testing/src';
import { defaultParams, isRunnable, isTypedTool } from '../mappers/tool-mapper';
import { sceneTwenty } from '../providers/provide-scene-feature';
import { TextSceneRenderer } from '../renderers/text-scene-renderer';
import { SceneFacade } from './scene.facade';

const flockId = 'aifg-a:145';
const arriveId = 'aifg-a:112';
const fixedId = 'aifg-a:174';
const twoLevelId = 'aifg-a:177';
const storageKey = 'dotln-angular.scene';

const ids = sceneTwenty.units.map((unit) => unit.id);
const twelve = ids.slice(0, 12);

let bundled: readonly Tool[];
beforeAll(async () => {
  bundled = await createCatalogLoader().load('aifg');
});

async function setUp(options: SceneFacadeKitOptions = {}, url?: string, stored?: string) {
  const kit = provideSceneFacadeTestKit({ tools: bundled, ...options });
  if (stored !== undefined) kit.store.values.set(storageKey, stored);
  TestBed.configureTestingModule({ providers: [...kit.providers] });
  if (url) await TestBed.inject(Router).navigateByUrl(url);
  const facade = TestBed.inject(SceneFacade);
  await TestBed.inject(Router).navigated;
  await vi.waitFor(() => expect(facade.vm().rail.status).toBe('ready'));
  TestBed.tick();
  await Promise.resolve();
  return { kit, facade };
}

const figure = (facade: SceneFacade, id: string) =>
  facade.vm().instruments.find((reading) => reading.id === id);

const railTitles = (facade: SceneFacade) =>
  facade.vm().rail.groups.flatMap((group) => group.tools.map((tool) => tool.title));

const selectTwelve = (facade: SceneFacade) => {
  for (const id of twelve) facade.toggle(id);
};

function lastFrame(facade: SceneFacade) {
  let latest: SceneFrame | undefined;
  facade.frames$.subscribe((frame) => (latest = frame)).unsubscribe();
  if (!latest) throw new Error('The scene has no frame.');
  return latest;
}

const importedComposition = (steps: Composition['steps']): Composition => ({
  id: 'imported',
  title: 'Imported',
  sceneId: 'the-twenty',
  seed: 1,
  steps,
  note: '',
  trials: [],
});

const unrunnable = (at: number) => ({
  at,
  toolId: 'x',
  kind: 'ground.influence',
  selection: ['unit-01'],
  params: {},
});

const flockStep = (at: number) => ({
  at,
  toolId: flockId,
  kind: 'steer.blend',
  selection: twelve,
  params: { 'separation-weight': 2, 'cohesion-weight': 1, 'velocity-match-weight': 1 },
});

describe('the rail', () => {
  it('lists the floor of tools, grouped by what they do', async () => {
    const { facade } = await setUp();
    expect(railTitles(facade)).toEqual(
      expect.arrayContaining([
        'Seek',
        'Arrive',
        'Separation',
        'Velocity matching',
        'Wander',
        'Flocking',
        'Priority steering',
        'Two-level formation steering',
        'Fixed formations',
        'Slot assignment',
      ]),
    );
    expect(facade.vm().rail.groups.map((group) => group.id)).toEqual([
      'move',
      'group',
      'avoid',
      'form',
    ]);
  });

  it('names the wedge, line and column under the two-level tool', async () => {
    const { facade } = await setUp();
    const form = facade.vm().rail.groups.find((group) => group.id === 'form');
    const twoLevel = form?.tools.find((tool) => tool.id === twoLevelId);
    expect(twoLevel?.patterns.map((pattern) => pattern.label)).toEqual(['Wedge', 'Line', 'Column']);
  });

  it('offers only tools whose kind the engine interprets', async () => {
    const { facade } = await setUp();
    const offered = facade.vm().rail.groups.flatMap((group) => group.tools);
    const kinds = new Set(
      offered.map((entry) => {
        const tool = bundled.find((row) => row.id === entry.id);
        return tool?.status === 'typed' ? tool.faces.transform.kind : 'untyped';
      }),
    );
    for (const kind of kinds) expect(interpretedKinds).toContain(kind);
  });

  it('agrees with the kinds the shared models say the engine runs', () => {
    expect([...interpretedKinds].sort()).toEqual([...sceneTransformKinds].sort());
  });

  it('every offered tool runs at its defaults, with every parameter read', async () => {
    const { facade } = await setUp();
    const offered = facade.vm().rail.groups.flatMap((group) => group.tools);
    expect(offered).toHaveLength(16);
    const objective = {
      at: 0,
      toolId: objectiveKind,
      kind: objectiveKind,
      selection: [],
      params: { x: 90, y: 60 },
    };
    const start = createSimulation(sceneTwenty);
    const withObjective = applyStep(start, objective).state;
    for (const entry of offered) {
      const tool = bundled.find((row) => row.id === entry.id);
      if (!tool || !isRunnable(tool)) throw new Error(`${entry.id} is not runnable`);
      for (const { name } of tool.faces.transform.params) expect(readsParam(name)).toBe(true);
      const step = {
        at: 0,
        toolId: tool.id,
        kind: tool.faces.transform.kind,
        selection: twelve,
        params: defaultParams(tool.faces.transform),
      };
      expect(applyStep(start, step).refusal).toBeNull();
      expect(applyStep(withObjective, step).refusal).toBeNull();
    }
  });

  it('marks a catalog failure and recovers on retry', async () => {
    const kit = provideSceneFacadeTestKit({ tools: bundled });
    const { load } = kit.catalog.loader;
    kit.catalog.loader.load = () => Promise.reject(new Error('offline'));
    TestBed.configureTestingModule({ providers: [...kit.providers] });
    const facade = TestBed.inject(SceneFacade);
    await vi.waitFor(() => expect(facade.vm().rail.status).toBe('failed'));
    kit.catalog.loader.load = load;
    facade.retryCatalog();
    await vi.waitFor(() => expect(facade.vm().rail.status).toBe('ready'));
    expect(railTitles(facade)).toContain('Flocking');
  });
});

describe('a tool named in the URL', () => {
  it('arrives chosen', async () => {
    const { facade } = await setUp({}, `/?tool=${flockId}`);
    await vi.waitFor(() => expect(facade.vm().inspector?.title).toBe('Flocking'));
    expect(facade.vm().notice).toBeNull();
  });

  it('with an unknown id, arrives with no tool chosen and says so', async () => {
    const { facade } = await setUp({}, '/?tool=nope:1');
    await vi.waitFor(() =>
      expect(facade.vm().notice).toEqual({ code: 'unknown-tool', id: 'nope:1' }),
    );
    expect(facade.vm().inspector).toBeNull();
  });

  it('with a typed tool the engine refuses, names the kind', async () => {
    const refused = bundled.filter(isTypedTool).find((tool): boolean => !isRunnable(tool));
    if (!refused) throw new Error('The bundled catalog has no refused tool to try.');
    const { facade } = await setUp({}, `/?tool=${refused.id}`);
    await vi.waitFor(() =>
      expect(facade.vm().notice).toEqual({
        code: 'refused-tool',
        title: refused.title,
        kind: refused.faces.transform.kind,
      }),
    );
    expect(facade.vm().inspector).toBeNull();
  });

  it('with an untyped row, says it has no transform yet', async () => {
    const untyped = bundled.find((tool) => tool.status === 'untyped') as Tool;
    const { facade } = await setUp({}, `/?tool=${untyped.id}`);
    await vi.waitFor(() =>
      expect(facade.vm().notice).toEqual({ code: 'untyped-tool', title: untyped.title }),
    );
  });

  it('blames the catalog, not the tool, when the catalog cannot be read', async () => {
    const kit = provideSceneFacadeTestKit({ tools: bundled });
    const { load } = kit.catalog.loader;
    kit.catalog.loader.load = (work) =>
      work === undefined
        ? Promise.reject(new Error('offline'))
        : load.call(kit.catalog.loader, work);
    TestBed.configureTestingModule({ providers: [...kit.providers] });
    await TestBed.inject(Router).navigateByUrl('/?tool=nope:1');
    const facade = TestBed.inject(SceneFacade);
    await vi.waitFor(() =>
      expect(facade.vm().notice).toEqual({ code: 'catalog-unavailable', id: 'nope:1' }),
    );
  });

  it('drops a late answer once the operator has chosen a tool', async () => {
    const kit = provideSceneFacadeTestKit({ tools: bundled });
    const { load } = kit.catalog.loader;
    let answer: (rows: readonly Tool[]) => void = () => undefined;
    kit.catalog.loader.load = (work) =>
      work === undefined
        ? new Promise((resolve) => (answer = resolve))
        : load.call(kit.catalog.loader, work);
    TestBed.configureTestingModule({ providers: [...kit.providers] });
    await TestBed.inject(Router).navigateByUrl('/?tool=nope:1');
    const facade = TestBed.inject(SceneFacade);
    await vi.waitFor(() => expect(facade.vm().rail.status).toBe('ready'));
    TestBed.tick();
    facade.chooseTool(flockId);
    answer(bundled);
    await Promise.resolve();
    await Promise.resolve();
    expect(facade.vm().notice).toBeNull();
    expect(facade.vm().inspector?.title).toBe('Flocking');
  });

  it('forgets its notice once the URL stops naming the tool', async () => {
    const { facade } = await setUp({}, '/?tool=nope:1');
    await vi.waitFor(() => expect(facade.vm().notice).not.toBeNull());
    await TestBed.inject(Router).navigateByUrl('/');
    TestBed.tick();
    expect(facade.vm().notice).toBeNull();
  });
});

describe('selection', () => {
  it('a click selects one unit and replaces what was selected', async () => {
    const { facade } = await setUp();
    facade.select('unit-01');
    facade.select('unit-02');
    expect(facade.vm().selection).toEqual(['unit-02']);
  });

  it('a shift-click adds and removes', async () => {
    const { facade } = await setUp();
    facade.select('unit-01');
    facade.select('unit-02', true);
    expect(facade.vm().selection).toEqual(['unit-01', 'unit-02']);
    facade.select('unit-01', true);
    expect(facade.vm().selection).toEqual(['unit-02']);
  });

  it('a marquee selects what is inside it, in any drag direction', async () => {
    const { facade } = await setUp();
    facade.marquee({ x: 120, y: 80 }, { x: 0, y: 0 });
    expect(facade.vm().selection).toHaveLength(20);
    facade.marquee({ x: 0, y: 0 }, { x: 1, y: 1 });
    expect(facade.vm().selection).toEqual([]);
  });

  it('a shift-marquee adds to the selection', async () => {
    const { facade } = await setUp();
    facade.select('unit-20');
    const first = sceneTwenty.units[0].position;
    facade.marquee(first, first, true);
    expect(facade.vm().selection).toEqual(['unit-01', 'unit-20']);
  });

  it('a double-click selects a unit’s role, then its flock once it has one', async () => {
    const { facade } = await setUp();
    facade.selectSquad('unit-01');
    expect(facade.vm().selection).toHaveLength(8);
    facade.clearSelection();
    selectTwelveAndFlock(facade);
    facade.clearSelection();
    facade.selectSquad('unit-01');
    expect(facade.vm().selection).toEqual(twelve);
  });

  it('a double-click on a fixed formation’s leader selects the whole formation', async () => {
    const { facade } = await setUp();
    selectTwelve(facade);
    facade.chooseTool(fixedId);
    facade.equip();
    facade.clearSelection();
    facade.selectSquad('unit-01');
    expect(facade.vm().selection).toEqual(twelve);
  });

  it('Escape’s intent clears the selection', async () => {
    const { facade } = await setUp();
    facade.select('unit-01');
    facade.clearSelection();
    expect(facade.vm().selection).toEqual([]);
  });

  it('the rows and the field show the same selection', async () => {
    const { facade } = await setUp();
    facade.toggle('unit-03');
    const row = facade.vm().rows.find(({ id }) => id === 'unit-03');
    expect(row?.selected).toBe(true);
    expect(facade.vm().rows.filter(({ selected }) => selected)).toHaveLength(1);
  });

  it('measures the selection, or everyone when nothing is selected', async () => {
    const { facade } = await setUp();
    const all = figure(facade, 'cohesionRadius')?.value;
    facade.select('unit-01');
    expect(figure(facade, 'cohesionRadius')?.value).toBe('0.0');
    facade.clearSelection();
    expect(figure(facade, 'cohesionRadius')?.value).toBe(all);
    expect(facade.vm().transport.selected).toBe(0);
  });
});

function selectTwelveAndFlock(facade: SceneFacade) {
  selectTwelve(facade);
  facade.chooseTool(flockId);
  facade.equip();
}

describe('equipping', () => {
  it('shows the definition, faces, parameters and preview arrows before applying', async () => {
    const { facade } = await setUp();
    selectTwelve(facade);
    facade.chooseTool(flockId);
    const inspector = facade.vm().inspector;
    expect(inspector?.definition).toContain('classic blend');
    expect(inspector?.params.map((param) => param.name)).toEqual([
      'separation-weight',
      'cohesion-weight',
      'velocity-match-weight',
    ]);
    expect(inspector?.preview?.units).toBe(12);
    expect(inspector?.preview?.quiet).toBe(false);
    expect(facade.vm().arrows).toHaveLength(12);
    expect(facade.vm().log.steps).toEqual([]);
  });

  it('flock on twelve units pulls them in with no collisions', async () => {
    const { facade } = await setUp();
    selectTwelveAndFlock(facade);
    const before = Number(figure(facade, 'cohesionRadius')?.value);
    facade.step(600);
    const after = Number(figure(facade, 'cohesionRadius')?.value);
    expect(after).toBeLessThan(before / 2);
    expect(figure(facade, 'collisions')?.value).toBe('0');
    expect(figure(facade, 'cohesionRadius')?.points).not.toBe('');
    expect(facade.vm().log.steps[0]).toMatchObject({ title: 'Flocking', units: 12 });
  });

  it('holds Apply back, with the reason, until the selection fits', async () => {
    const { facade } = await setUp();
    facade.chooseTool(flockId);
    expect(facade.vm().inspector).toMatchObject({ canApply: false, issue: { code: 'empty' } });
    facade.select('unit-01');
    expect(facade.vm().inspector).toMatchObject({
      canApply: false,
      issue: { code: 'too-few', min: 2 },
    });
    facade.select('unit-02', true);
    expect(facade.vm().inspector?.canApply).toBe(true);
  });

  it('says when a tool is waiting on an objective', async () => {
    const { facade } = await setUp();
    selectTwelve(facade);
    facade.chooseTool(arriveId);
    expect(facade.vm().inspector?.issue?.code).toBe('objective');
    facade.setObjective({ x: 90, y: 60 });
    expect(facade.vm().inspector?.issue).toBeNull();
  });

  it('a clicked objective and Arrive give a time to objective', async () => {
    const { facade } = await setUp();
    selectTwelve(facade);
    facade.setObjective({ x: 90, y: 60 });
    expect(figure(facade, 'timeToObjective')?.known).toBe(false);
    facade.chooseTool(arriveId);
    facade.equip();
    facade.step(1200);
    expect(figure(facade, 'timeToObjective')?.known).toBe(true);
    expect(facade.vm().objective).toBe('south-east');
  });

  it('fills the slot table from the cost table for a formation', async () => {
    const { facade } = await setUp();
    selectTwelve(facade);
    facade.chooseTool(twoLevelId, 1);
    const { inspector } = facade.vm();
    expect(inspector?.slots?.rows).toHaveLength(12);
    expect(inspector?.slots?.live).toBe(false);
    expect(inspector?.params[0].choices.find(({ chosen }) => chosen)?.label).toBe('Line');
    facade.equip();
    expect(facade.vm().formation).not.toBeNull();
    expect(facade.vm().inspector?.slots).toMatchObject({ live: true, placed: 0 });
  });

  it('counts units into their slots as they reach them', async () => {
    const { facade } = await setUp();
    selectTwelve(facade);
    facade.chooseTool(twoLevelId);
    facade.equip();
    facade.step(1200);
    expect(facade.vm().inspector?.slots?.placed).toBe(12);
  });

  it('a right-click sends the selected units, in one order', async () => {
    const { facade } = await setUp();
    selectTwelve(facade);
    facade.sendTo({ x: 90, y: 60 });
    expect(facade.vm().log.steps.map((step) => step.title)).toEqual(['Objective set', 'Arrive']);
    facade.step(1200);
    expect(figure(facade, 'timeToObjective')?.known).toBe(true);
  });

  it('a right-click sends a fixed formation’s leader, and its followers with it', async () => {
    const { facade } = await setUp();
    selectTwelve(facade);
    facade.chooseTool(fixedId);
    facade.equip();
    facade.sendTo({ x: 90, y: 60 });
    expect(facade.vm().log.steps.map((step) => step.title)).toEqual([
      'Fixed formations',
      'Objective set',
      'Arrive',
    ]);
    facade.step(1200);
    expect(figure(facade, 'timeToObjective')?.known).toBe(true);
  });

  it('a right-click leaves formed units to their anchor', async () => {
    const { facade } = await setUp();
    selectTwelve(facade);
    facade.chooseTool(twoLevelId);
    facade.equip();
    facade.sendTo({ x: 90, y: 60 });
    expect(facade.vm().log.steps.map((step) => step.title)).toEqual([
      'Two-level formation steering',
      'Objective set',
    ]);
  });

  it('choosing the chosen tool again puts it down', async () => {
    const { facade } = await setUp();
    facade.chooseTool(flockId);
    facade.chooseTool(flockId);
    expect(facade.vm().inspector).toBeNull();
  });
});

describe('live tuning', () => {
  it('a finished change reaches units already carrying the tool', async () => {
    const { facade } = await setUp();
    selectTwelveAndFlock(facade);
    expect(facade.vm().live).toBe(true);
    facade.setParam('separation-weight', 0);
    expect(facade.vm().log.steps[0].repeats).toBe(1);
    facade.commitParam();
    expect(facade.vm().log.steps).toHaveLength(1);
    expect(facade.vm().log.steps[0].repeats).toBe(2);
  });

  it('does not reach units that were not given the tool', async () => {
    const { facade } = await setUp();
    selectTwelveAndFlock(facade);
    facade.toggle('unit-20');
    expect(facade.vm().live).toBe(false);
    facade.setParam('separation-weight', 0);
    facade.commitParam();
    expect(facade.vm().log.steps[0].repeats).toBe(1);
  });

  it('a pattern chosen on a live formation re-forms it at once', async () => {
    const { facade } = await setUp();
    selectTwelve(facade);
    facade.chooseTool(twoLevelId, 0);
    facade.equip();
    facade.chooseTool(twoLevelId, 2);
    expect(facade.vm().log.steps[0].repeats).toBe(2);
  });

  it('a pattern chosen after the tool was put down re-forms it too', async () => {
    const { facade } = await setUp();
    selectTwelve(facade);
    facade.chooseTool(twoLevelId, 0);
    facade.equip();
    facade.chooseTool(twoLevelId);
    facade.chooseTool(twoLevelId, 2);
    expect(facade.vm().log.steps[0].repeats).toBe(2);
  });

  it('opens a tool already on these units as they were given it', async () => {
    const { facade } = await setUp();
    selectTwelveAndFlock(facade);
    facade.setParam('separation-weight', 0.5);
    facade.commitParam();
    facade.chooseTool(flockId);
    facade.chooseTool(flockId);
    expect(facade.vm().live).toBe(true);
    expect(facade.vm().inspector?.params[0]).toMatchObject({
      name: 'separation-weight',
      value: 0.5,
    });
  });

  it('opens at its defaults for units that were not given it', async () => {
    const { facade } = await setUp();
    selectTwelveAndFlock(facade);
    facade.setParam('separation-weight', 0.5);
    facade.commitParam();
    facade.chooseTool(flockId);
    facade.toggle('unit-20');
    facade.chooseTool(flockId);
    expect(facade.vm().inspector?.params[0].value).toBe(2);
  });

  it('is no longer live after a restart, until the step has run again', async () => {
    const { facade } = await setUp();
    selectTwelveAndFlock(facade);
    facade.restart();
    expect(facade.vm().live).toBe(false);
    facade.setParam('separation-weight', 0);
    facade.commitParam();
    expect(facade.vm().log.steps[0].repeats).toBe(1);
  });
});

describe('the frame loop', () => {
  it('changes the view model at most once per driver frame, however many steps fell due', async () => {
    const { facade, kit } = await setUp();
    selectTwelveAndFlock(facade);
    facade.play();
    // The text layer is drawn once for every sample published, which is the one per-frame write.
    const published = vi.spyOn(TextSceneRenderer.prototype, 'draw');
    let before = facade.vm();
    for (let frame = 0; frame < 60; frame += 1) {
      published.mockClear();
      kit.clock.tick(4);
      expect(published.mock.calls.length).toBeLessThanOrEqual(1);
      const after = facade.vm();
      if (published.mock.calls.length === 0) expect(after).toBe(before);
      before = after;
    }
    published.mockRestore();
  });

  it('samples a running scene rather than publishing every frame', async () => {
    const { facade, kit } = await setUp();
    selectTwelveAndFlock(facade);
    facade.play();
    const seen = new Set<number>();
    for (let frame = 0; frame < 60; frame += 1) {
      kit.clock.tick();
      seen.add(facade.vm().transport.frameNo);
    }
    expect(seen.size).toBeLessThanOrEqual(11);
  });

  it('paints every frame through its own stream', async () => {
    const { facade } = await setUp();
    const painted: number[] = [];
    const subscription = facade.frames$.subscribe((frame) => painted.push(frame.frameNo));
    facade.step(3);
    subscription.unsubscribe();
    expect(painted).toEqual([0, 3]);
  });

  it('does not start on its own under reduced motion', async () => {
    const { facade } = await setUp({ reducedMotion: true });
    selectTwelveAndFlock(facade);
    expect(facade.vm().transport.playing).toBe(false);
    expect(facade.vm().awaitingRun).toBe(true);
  });

  it('starts when a step is applied otherwise, and stops when everything is at rest', async () => {
    const { facade, kit } = await setUp({ reducedMotion: false });
    selectTwelve(facade);
    facade.setObjective({ x: 60, y: 40 });
    facade.chooseTool(arriveId);
    facade.equip();
    expect(facade.vm().transport.playing).toBe(true);
    for (let frame = 0; frame < 900 && facade.vm().transport.playing; frame += 1) kit.clock.tick();
    expect(facade.vm().transport.playing).toBe(false);
  });

  it('shows the slot table while a formation sorts itself, not only once it stops', async () => {
    const { facade, kit } = await setUp({ reducedMotion: false });
    selectTwelve(facade);
    facade.chooseTool(twoLevelId);
    facade.equip();
    expect(facade.vm().transport.playing).toBe(true);
    for (let frame = 0; frame < 30; frame += 1) kit.clock.tick();
    expect(facade.vm().inspector?.slots?.rows).toHaveLength(12);
    expect(facade.vm().inspector?.preview).toBeNull();
    expect(facade.vm().arrows).toEqual([]);
  });

  it('keeps one empty arrow list while playing, so the painter is not asked to repaint', async () => {
    const { facade, kit } = await setUp({ reducedMotion: false });
    selectTwelveAndFlock(facade);
    const { arrows } = facade.vm();
    for (let frame = 0; frame < 30; frame += 1) kit.clock.tick();
    expect(facade.vm().arrows).toBe(arrows);
  });

  it('holds still at idle: Step advances, and nothing else does', async () => {
    const { facade } = await setUp();
    expect(facade.vm().transport.frameNo).toBe(0);
    facade.step();
    expect(facade.vm().transport.frameNo).toBe(1);
  });
});

describe('a session with motion on', () => {
  it('goes from flock to compare, stopping by itself once the group has arrived', async () => {
    const { facade, kit } = await setUp({ reducedMotion: false });
    const run = (frames: number) => {
      for (let frame = 0; frame < frames; frame += 1) kit.clock.tick();
    };
    const runToRest = () => {
      for (let frame = 0; frame < 3600 && facade.vm().transport.playing; frame += 1)
        kit.clock.tick();
      expect(facade.vm().transport.playing).toBe(false);
    };

    selectTwelve(facade);
    const scattered = Number(figure(facade, 'cohesionRadius')?.value);
    facade.chooseTool(flockId);
    facade.equip();
    expect(facade.vm().transport.playing).toBe(true);
    run(300);
    expect(Number(figure(facade, 'cohesionRadius')?.value)).toBeLessThan(scattered / 2);
    expect(figure(facade, 'collisions')?.value).toBe('0');

    facade.sendTo({ x: 80, y: 50 });
    runToRest();
    expect(figure(facade, 'timeToObjective')?.known).toBe(true);
    expect(figure(facade, 'collisions')?.value).toBe('0');

    facade.clearSelection();
    for (const id of ids.slice(12)) facade.toggle(id);
    facade.chooseTool(twoLevelId, 0);
    expect(facade.vm().inspector?.slots).toMatchObject({ live: false });
    facade.equip();
    run(30);
    expect(facade.vm().inspector?.slots?.live).toBe(true);
    expect(facade.vm().inspector?.slots?.placed).toBeLessThan(8);
    runToRest();
    expect(facade.vm().inspector?.slots?.placed).toBe(8);

    facade.compare();
    expect(facade.vm().trial?.firstDivergence).not.toBeNull();
    expect(facade.vm().transport.playing).toBe(true);
  });
});

describe('runs', () => {
  it('reproduces the same frames from one seed and one step list', async () => {
    const { facade } = await setUp();
    selectTwelveAndFlock(facade);
    facade.step(120);
    const first = figure(facade, 'cohesionRadius')?.value;
    facade.restart();
    expect(facade.vm().transport.frameNo).toBe(0);
    facade.step(120);
    expect(figure(facade, 'cohesionRadius')?.value).toBe(first);
  });

  it('a live run hashes the same as its replay of the same steps', async () => {
    const { facade } = await setUp();
    selectTwelve(facade);
    facade.setObjective({ x: 90, y: 60 });
    facade.step(20);
    facade.chooseTool(arriveId);
    facade.equip();
    facade.step(100);
    facade.chooseTool(twoLevelId);
    facade.equip();
    facade.step(180);
    const live = lastFrame(facade);
    const steps = TestBed.inject(SceneStore).steps();
    expect(hashFrame(live)).toBe(hashFrame(frameOf(runBranch(sceneTwenty, steps, 300)[300])));
  });

  it('a step made on the frame a replay is due to apply one replays in that order', async () => {
    const { facade } = await setUp();
    selectTwelve(facade);
    facade.setObjective({ x: 90, y: 60 });
    facade.chooseTool(arriveId);
    facade.equip();
    facade.step(100);
    facade.chooseTool(twoLevelId);
    facade.equip();
    facade.step(40);
    facade.compare();
    expect(facade.vm().transport.frameNo).toBe(100);
    facade.chooseTool(arriveId);
    facade.setParam('slow-radius', 20);
    facade.equip();
    facade.step(60);
    const live = lastFrame(facade);
    const steps = TestBed.inject(SceneStore).steps();
    expect(steps.at(-1)?.at).toBe(100);
    expect(hashFrame(live)).toBe(hashFrame(frameOf(runBranch(sceneTwenty, steps, 160)[160])));
  });

  it('restart keeps the composition; clear puts it down', async () => {
    const { facade } = await setUp();
    selectTwelveAndFlock(facade);
    facade.restart();
    expect(facade.vm().log.steps).toHaveLength(1);
    facade.clear();
    expect(facade.vm().log.steps).toEqual([]);
    expect(facade.vm().transport.frameNo).toBe(0);
  });

  it('feel reseeds a run and says so by the seed shown', async () => {
    const { facade } = await setUp();
    const { seed } = facade.vm().transport;
    facade.restart();
    expect(facade.vm().transport.seed).toBe(seed);
    facade.toggleFeel();
    expect(facade.vm().transport.feel).toBe(true);
    facade.restart();
    expect(facade.vm().transport.seed).not.toBe(seed);
  });
});

describe('trials', () => {
  function equipAt(facade: SceneFacade, frames: number) {
    facade.step(frames);
    selectTwelveAndFlock(facade);
  }

  it('marks the first divergence on the frame after the equip', async () => {
    const { facade } = await setUp();
    equipAt(facade, 30);
    facade.compare();
    expect(facade.vm().trial?.firstDivergence).toBe(31);
  });

  it('draws two series per metric and the marker on each', async () => {
    const { facade } = await setUp();
    equipAt(facade, 30);
    facade.compare();
    const series = facade.vm().trial?.series ?? [];
    expect(series.map(({ id }) => id)).toContain('cohesionRadius');
    for (const line of series) {
      expect(line.before).not.toBe('');
      expect(line.after).not.toBe('');
      expect(line.marker).not.toBeNull();
    }
  });

  it('goes back to the split and shows the other branch as a ghost', async () => {
    const { facade } = await setUp();
    equipAt(facade, 30);
    facade.step(200);
    facade.compare();
    expect(facade.vm().transport.frameNo).toBe(30);
    expect(facade.vm().ghostFrames[0]).toMatchObject({ frameNo: 30 });
    expect(facade.vm().ghostFrames[0].units).toHaveLength(20);
    facade.step(120);
    expect(figure(facade, 'cohesionRadius')).toBeDefined();
  });

  it('compares the ten seconds after the split, however long the run has gone on', async () => {
    const { facade } = await setUp();
    equipAt(facade, 30);
    facade.step(6000);
    facade.compare();
    expect(facade.vm().ghostFrames).toHaveLength(601);
    expect(facade.vm().ghostFrames.at(-1)?.frameNo).toBe(630);
    expect(facade.vm().trial?.firstDivergence).toBe(31);
  });

  it('compares from a fork when one was made', async () => {
    const { facade } = await setUp();
    selectTwelveAndFlock(facade);
    facade.step(10);
    facade.fork();
    facade.chooseTool('aifg-a:125');
    facade.equip();
    facade.compare();
    expect(facade.vm().trial?.firstDivergence).toBe(11);
  });

  it('keeps a trial with the composition', async () => {
    const { facade } = await setUp();
    selectTwelveAndFlock(facade);
    facade.compare();
    facade.keepTrial();
    expect(facade.vm().trial).toBeNull();
    expect(facade.vm().ghostFrames).toEqual([]);
    expect(facade.vm().log.kept).toBe(1);
  });

  it('closing a trial keeps nothing', async () => {
    const { facade } = await setUp();
    selectTwelveAndFlock(facade);
    facade.compare();
    facade.closeTrial();
    expect(facade.vm().log.kept).toBe(0);
  });

  it('has nothing to compare until a tool has been applied', async () => {
    const { facade } = await setUp();
    expect(facade.vm().transport.canCompare).toBe(false);
    facade.setObjective({ x: 10, y: 10 });
    expect(facade.vm().transport.canCompare).toBe(false);
    facade.compare();
    expect(facade.vm().trial).toBeNull();
  });
});

describe('compositions', () => {
  it('export then import yields an equal state', async () => {
    const { facade } = await setUp();
    selectTwelveAndFlock(facade);
    facade.step(5);
    facade.note('pulls together');
    const exported = facade.exportJson();
    const steps = facade.vm().log.steps;
    facade.clear();
    facade.importJson(exported);
    expect(facade.vm().log.steps).toEqual(steps);
    expect(facade.vm().note).toBe('pulls together');
    expect(facade.exportJson()).toBe(exported);
  });

  it('refuses text that is not a composition, in words', async () => {
    const { facade } = await setUp();
    facade.importJson('{"not":"this"}');
    expect(facade.vm().notice).toEqual({ code: 'import-failed' });
    facade.importJson('nonsense');
    expect(facade.vm().notice).toEqual({ code: 'import-failed' });
  });

  it('refuses a composition of another scene, and numbers the engine could not run', async () => {
    const { facade } = await setUp();
    const steps = [flockStep(0)];
    facade.importJson(encodeExport({ ...importedComposition(steps), sceneId: 'another' }));
    expect(facade.vm().notice).toEqual({ code: 'import-failed' });
    facade.importJson(
      encodeExport(importedComposition([{ ...flockStep(0), params: { 'time-to-target': 0 } }])),
    );
    expect(facade.vm().notice).toEqual({ code: 'import-failed' });
    expect(facade.vm().log.steps).toEqual([]);
  });

  it('forgets a failed import once the field has moved on', async () => {
    const { facade } = await setUp();
    facade.importJson('nonsense');
    facade.clear();
    expect(facade.vm().notice).toBeNull();
  });

  it('shows the refusal when an imported step’s kind is not one the engine runs', async () => {
    const { facade } = await setUp();
    facade.importJson(encodeExport(importedComposition([unrunnable(0)])));
    facade.step(1);
    expect(facade.vm().refusal).toMatchObject({
      code: 'uninterpreted',
      kind: 'ground.influence',
    });
  });

  it.each([
    ['the same frame as a good step', [unrunnable(0), flockStep(0)]],
    ['the frame before a good step', [unrunnable(5), flockStep(6)]],
  ])('keeps a refusal in view after %s', async (_label, steps) => {
    const { facade } = await setUp();
    facade.importJson(encodeExport(importedComposition(steps)));
    facade.step(60);
    expect(facade.vm().refusal?.kind).toBe('ground.influence');
  });

  it('forgets a refusal once the operator has made a step of their own', async () => {
    const { facade } = await setUp();
    facade.importJson(encodeExport(importedComposition([unrunnable(0)])));
    facade.step(1);
    selectTwelveAndFlock(facade);
    expect(facade.vm().refusal).toBeNull();
  });

  it('saves under its own key, finds it on the next load, and writes nothing else', async () => {
    const { facade, kit } = await setUp();
    selectTwelveAndFlock(facade);
    facade.note('keep this');
    facade.save();
    TestBed.tick();
    expect(kit.store.writes.length).toBeGreaterThan(0);
    for (const { key } of kit.store.writes) expect(key.startsWith(storageKey)).toBe(true);
    const saved = kit.store.values.get(storageKey) ?? '';

    TestBed.resetTestingModule();
    const next = await setUp({}, undefined, saved);
    expect(next.facade.vm().log.compositions).toMatchObject([
      { title: 'Flocking', steps: 1, note: 'keep this' },
    ]);
  });

  it('a save keeps what another tab saved, and playing writes nothing over it', async () => {
    const { facade, kit } = await setUp();
    selectTwelveAndFlock(facade);
    facade.save();
    TestBed.tick();
    const stored = JSON.parse(kit.store.values.get(storageKey) ?? '');
    const theirs = { ...stored.compositions[0], id: 'composition-2', title: 'Theirs' };
    kit.store.values.set(
      storageKey,
      JSON.stringify({ ...stored, compositions: [...stored.compositions, theirs] }),
    );

    facade.step(30);
    facade.note('still playing');
    TestBed.tick();
    expect(kit.store.writes).toHaveLength(1);

    facade.save();
    TestBed.tick();
    const saved = JSON.parse(kit.store.values.get(storageKey) ?? '');
    expect(saved.compositions.map(({ id }: Composition) => id)).toEqual([
      'composition-1',
      'composition-2',
      'composition-3',
    ]);
  });

  it('keeps a composition only this tab holds when a failed save is followed by another', async () => {
    let full = true;
    const values = new Map<string, string>();
    const storage = {
      getItem: (name: string) => values.get(name) ?? null,
      setItem: (name: string, value: string) => {
        if (full) throw new Error('quota');
        values.set(name, value);
      },
      removeItem: (name: string) => {
        values.delete(name);
      },
    };
    const { facade } = await setUp({ storage });
    selectTwelveAndFlock(facade);
    facade.save();
    TestBed.tick();
    expect(facade.vm().notice).toEqual({ code: 'save-failed' });
    full = false;
    facade.save();
    TestBed.tick();
    expect(facade.vm().notice).toBeNull();
    expect(facade.vm().log.compositions).toHaveLength(2);
    expect(JSON.parse(values.get(storageKey) ?? '').compositions).toHaveLength(2);
  });

  it('gives a new composition an id no restored one has', async () => {
    const stored = JSON.stringify({
      version: 1,
      compositions: [
        { ...importedComposition([flockStep(0)]), id: 'composition-1' },
        { id: 'unreadable' },
        { ...importedComposition([flockStep(0)]), id: 'composition-3' },
      ],
    });
    const { facade } = await setUp({}, undefined, stored);
    selectTwelveAndFlock(facade);
    facade.save();
    TestBed.tick();
    expect(facade.vm().log.compositions.map(({ id }) => id)).toEqual([
      'composition-1',
      'composition-3',
      'composition-4',
    ]);
  });

  it('reports a seeking group as still on its way, not as there, while it gathers', async () => {
    const { facade } = await setUp();
    for (const id of ids) facade.toggle(id);
    facade.setObjective({ x: 59, y: 41 });
    facade.chooseTool('aifg-a:110');
    facade.equip();
    facade.step(1);
    expect(figure(facade, 'timeToObjective')?.known).toBe(false);
  });

  it('opens a saved composition from its own seed', async () => {
    const { facade } = await setUp();
    selectTwelveAndFlock(facade);
    facade.step(60);
    const expected = figure(facade, 'cohesionRadius')?.value;
    facade.save();
    facade.clear();
    facade.open('composition-1');
    facade.step(60);
    expect(figure(facade, 'cohesionRadius')?.value).toBe(expected);
  });

  it('cannot save an empty composition', async () => {
    const { facade, kit } = await setUp();
    facade.save();
    TestBed.tick();
    expect(kit.store.writes).toEqual([]);
    expect(facade.vm().transport.canSave).toBe(false);
  });

  it('writes nothing to storage just by opening and playing', async () => {
    const { facade, kit } = await setUp();
    selectTwelveAndFlock(facade);
    facade.step(30);
    TestBed.tick();
    expect(kit.store.writes).toEqual([]);
  });

  it.each([
    ['does not parse', '{broken'],
    ['has an older shape', JSON.stringify({ saved: [{ steps: [] }] })],
  ])('yields the idle twenty when the stored value %s', async (_label, stored) => {
    const { facade, kit } = await setUp({}, undefined, stored);
    expect(facade.vm().rows).toHaveLength(20);
    expect(facade.vm().transport.frameNo).toBe(0);
    expect(facade.vm().log.compositions).toEqual([]);
    expect(facade.vm().notice).toEqual({ code: 'stored-ignored' });
    expect(kit.store.values.get(storageKey)).toBe(stored);
    expect(kit.store.writes).toEqual([]);
  });
});

describe('the coach', () => {
  it('walks from the first selection to the first comparison', async () => {
    const { facade } = await setUp();
    expect(facade.vm().coach).toBe('select');
    selectTwelve(facade);
    expect(facade.vm().coach).toBe('tool');
    facade.chooseTool(flockId);
    expect(facade.vm().coach).toBe('apply');
    facade.equip();
    expect(facade.vm().coach).toBe('send');
    facade.sendTo({ x: 90, y: 60 });
    expect(facade.vm().coach).toBe('form');
    facade.chooseTool(twoLevelId);
    facade.equip();
    expect(facade.vm().coach).toBe('tune');
    facade.compare();
    expect(facade.vm().coach).toBeNull();
  });
});

describe('labels', () => {
  it('reads a unit by its lifecycle role, and by its UIFA role when switched', async () => {
    const { facade } = await setUp();
    const { label } = facade.vm().rows[0];
    expect(label).toBe(sceneTwenty.units[0].labels['lifecycle']);
    facade.setLabelSet('uifa');
    expect(facade.vm().rows[0].label).toBe(sceneTwenty.units[0].labels['uifa']);
  });

  it('the text layer opens for reduced motion and for the keyboard', async () => {
    const reduced = await setUp({ reducedMotion: true });
    expect(reduced.facade.vm().textLayerOpen).toBe(true);
    TestBed.resetTestingModule();
    const motion = await setUp({ reducedMotion: false });
    expect(motion.facade.vm().textLayerOpen).toBe(false);
    motion.facade.noteKeyboard();
    expect(motion.facade.vm().textLayerOpen).toBe(true);
  });

  it('offers the nine places an objective can be set by keyboard', async () => {
    const { facade } = await setUp();
    expect(facade.vm().objectiveRegions).toHaveLength(9);
    expect(facade.vm().objectiveRegions[0].id).toBe('north-west');
    facade.setObjective(facade.vm().objectiveRegions[8].point);
    expect(facade.vm().objective).toBe('south-east');
  });
});

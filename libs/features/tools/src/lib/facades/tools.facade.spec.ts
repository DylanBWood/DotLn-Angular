import { TestBed } from '@angular/core/testing';

import { CatalogToken, createCatalogLoader } from '@dotln-angular/catalog';
import { catalogFixture, studyFixture } from '@dotln-angular/catalog/testing';

import { provideToolsFacadeTestKit } from '../../../testing/src';
import { ToolsFacade } from './tools.facade';

const arrive = async () => {
  const study = await createCatalogLoader().study('aifg-a:112');
  if (!study) throw new Error('The Arrive record is missing.');
  return study;
};
const openArrive = async () => {
  const kit = provideToolsFacadeTestKit(
    [{ ...catalogFixture[0], id: 'aifg-a:112' }],
    [await arrive()],
  );
  TestBed.configureTestingModule({ providers: [...kit.providers] });
  const facade = TestBed.inject(ToolsFacade);
  await vi.waitFor(() => expect(facade.vm().catalogTotal).toBe(1));
  facade.open('aifg-a:112');
  await vi.waitFor(() => expect(facade.vm().study).not.toBeNull());
  return facade;
};

it('follows the selected moment from the model, inside the run', async () => {
  const facade = await openArrive();
  const moment = () => facade.vm().study?.worked;
  expect(moment()?.note).toContain('brakes');
  facade.studyIntent({ kind: 'step', step: 0 });
  expect(moment()?.lines.at(-1)).toContain('0.12');
  facade.studyIntent({ kind: 'step', step: 9999 });
  expect(moment()?.title).toBe('At rest at 24.00 seconds');
  facade.studyIntent({ kind: 'step', step: Number.NaN });
  expect(moment()?.title).toBe('At rest at 24.00 seconds');
});

it('is the one source of each section’s open state and of the view, reset with the reading', async () => {
  const facade = await openArrive();
  expect(facade.vm().study?.expanded).toEqual([]);
  facade.studyIntent({ kind: 'expand', section: 'limits', open: true });
  facade.studyIntent({ kind: 'expand', section: 'mechanism', open: true });
  facade.studyIntent({ kind: 'expand', section: 'limits', open: true });
  expect(facade.vm().study?.expanded).toEqual(['limits', 'mechanism']);
  facade.studyIntent({ kind: 'expand', section: 'limits', open: false });
  expect(facade.vm().study?.expanded).toEqual(['mechanism']);
  const drawing = () => {
    const visual = facade.vm().study?.visual;
    return visual?.family === 'motion' ? visual : null;
  };
  facade.studyIntent({ kind: 'view', view: 'timeline' });
  facade.studyIntent({ kind: 'step', step: 3 });
  expect(drawing()?.view).toBe('timeline');
  facade.open('aifg-a:112');
  expect(facade.vm().study?.expanded).toEqual(['mechanism']);
  expect(facade.vm().study?.visual?.step).toBe(3);
  expect(facade.arrive(undefined)).toBe(true);
  expect(facade.vm().selected).toBeNull();
  expect(facade.arrive('aifg-a:112')).toBe(true);
  await vi.waitFor(() => expect(facade.vm().study).not.toBeNull());
  expect(facade.vm().study?.expanded).toEqual([]);
  expect(drawing()?.view).toBe('motion');
  expect(facade.vm().study?.visual?.step).toBe(75);
});

it('reruns the example from a changed input, keeps the record’s parameters, and restores it', async () => {
  const facade = await openArrive();
  const textEquivalent = () => facade.vm().study?.visual?.textEquivalent;
  const original = textEquivalent();
  expect(facade.vm().study?.visual?.inputs[0]).toMatchObject({ name: 'slowRadius', value: 36 });
  facade.studyIntent({ kind: 'input', name: 'slowRadius', value: 8 });
  expect(facade.vm().study?.visual?.inputs[0].value).toBe(8);
  expect(textEquivalent()).not.toBe(original);
  facade.studyIntent({ kind: 'input', name: 'slowRadius', value: Number.NaN });
  expect(facade.vm().study?.visual?.inputs[0].value).toBe(8);
  facade.studyIntent({ kind: 'resetInputs' });
  expect(textEquivalent()).toBe(original);
  facade.studyIntent({ kind: 'input', name: 'slowRadius', value: 8 });
  expect(facade.arrive(undefined)).toBe(true);
  expect(facade.arrive('aifg-a:112')).toBe(true);
  await vi.waitFor(() => expect(facade.vm().study).not.toBeNull());
  expect(textEquivalent()).toBe(original);
});

it('runs the example only on command, stops on a hand step and offers nothing under reduced motion', async () => {
  const frames: FrameRequestCallback[] = [];
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => frames.push(callback));
  vi.stubGlobal('cancelAnimationFrame', () => undefined);
  const facade = await openArrive();
  const step = () => facade.vm().study?.visual?.step;
  const tick = (time: number) => frames.splice(0).forEach((callback) => callback(time));
  expect(facade.vm().study?.visual?.playing).toBe(false);
  frames.length = 0;
  expect(facade.vm().study?.visual?.step).toBe(75);
  facade.studyIntent({ kind: 'step', step: 10 });
  facade.studyIntent({ kind: 'play', playing: true });
  expect(facade.vm().study?.visual?.playing).toBe(true);
  // The run is 0.1 s to a step, and a gap past 100 ms counts as 100 ms, so a hidden tab
  // does not jump when it returns.
  for (const time of [0, 16, 216, 416]) tick(time);
  expect(step()).toBeGreaterThan(10);
  expect(step()).toBeLessThan(14);
  facade.studyIntent({ kind: 'step', step: 20 });
  expect(facade.vm().study?.visual?.playing).toBe(false);
  tick(500);
  expect(step()).toBe(20);
  facade.studyIntent({ kind: 'step', step: 240 });
  facade.studyIntent({ kind: 'play', playing: true });
  expect(step()).toBe(0);
  facade.studyIntent({ kind: 'play', playing: false });
  expect(facade.vm().study?.visual?.playing).toBe(false);
  vi.unstubAllGlobals();
});

it('says a concept has no study, loads one on opening, and retries a failure', async () => {
  const kit = provideToolsFacadeTestKit();
  let fail = true;
  const study = vi.fn(async () => {
    if (fail) throw new Error('Unavailable');
    return studyFixture;
  });
  TestBed.configureTestingModule({
    providers: [
      ...kit.providers,
      { provide: CatalogToken, useValue: { ...kit.catalog.loader, study } },
    ],
  });
  const facade = TestBed.inject(ToolsFacade);
  await vi.waitFor(() => expect(facade.vm().catalogTotal).toBe(3));
  expect(facade.vm().studyStatus).toBe('none');
  facade.open('sample:1');
  await vi.waitFor(() => expect(facade.vm().studyStatus).toBe('failed'));
  expect(facade.vm().study).toBeNull();
  fail = false;
  facade.retryStudy();
  await vi.waitFor(() => expect(facade.vm().studyStatus).toBe('ready'));
  expect(facade.vm().study?.id).toBe('sample:1');
  study.mockResolvedValue(null as never);
  facade.open('sample:2');
  await vi.waitFor(() => expect(facade.vm().studyStatus).toBe('none'));
  expect(facade.vm().study).toBeNull();
});

it('draws a study whose family has no motion frames, and scrubs it by frame', async () => {
  const record = await createCatalogLoader().study('rxc:152');
  if (!record) throw new Error('The switchMap record is missing.');
  const kit = provideToolsFacadeTestKit([{ ...catalogFixture[0], id: 'rxc:152' }], [record]);
  TestBed.configureTestingModule({ providers: [...kit.providers] });
  const facade = TestBed.inject(ToolsFacade);
  await vi.waitFor(() => expect(facade.vm().catalogTotal).toBe(1));
  facade.open('rxc:152');
  await vi.waitFor(() => expect(facade.vm().study).not.toBeNull());
  const visual = () => facade.vm().study?.visual;
  expect(visual()?.family).toBe('marbles');
  // A marble example opens on its last frame, the whole run.
  expect(visual()?.textEquivalent).toContain('Frame 14');
  facade.studyIntent({ kind: 'step', step: 0 });
  expect(visual()?.textEquivalent).toContain('Frame 0');
  expect(facade.vm().study?.worked?.title).toBe('Frame 0');
  facade.studyIntent({ kind: 'step', step: 9999 });
  expect(visual()?.textEquivalent).toContain('Frame 14');
  facade.studyIntent({ kind: 'view', view: 'timeline' });
  expect(visual()?.family).toBe('marbles');
});

it('keeps a model that throws to its own study, and the reading stays open', async () => {
  const study = await arrive();
  const broken = {
    ...study,
    example: { ...study.example, parameters: { ...study.example.parameters, slowRadius: 'far' } },
  };
  const kit = provideToolsFacadeTestKit([{ ...catalogFixture[0], id: 'aifg-a:112' }], [broken]);
  TestBed.configureTestingModule({ providers: [...kit.providers] });
  const facade = TestBed.inject(ToolsFacade);
  await vi.waitFor(() => expect(facade.vm().catalogTotal).toBe(1));
  facade.open('aifg-a:112');
  await vi.waitFor(() => expect(facade.vm().studyStatus).toBe('failed'));
  expect(facade.vm().study).toBeNull();
  expect(facade.vm().selected?.id).toBe('aifg-a:112');
});

it('goes back to the record’s own inputs on a retry', async () => {
  const facade = await openArrive();
  facade.studyIntent({ kind: 'input', name: 'slowRadius', value: 8 });
  expect(facade.vm().study?.visual?.inputs[0].value).toBe(8);
  facade.retryStudy();
  await vi.waitFor(() => expect(facade.vm().study?.visual?.inputs[0].value).toBe(36));
});

it('fails a study whose model is not listed, rather than showing it without its drawing', async () => {
  const study = await arrive();
  const unlisted = {
    ...study,
    visual: study.visual && { ...study.visual, model: 'libs/unlisted.model.ts' },
  };
  const kit = provideToolsFacadeTestKit([{ ...catalogFixture[0], id: 'aifg-a:112' }], [unlisted]);
  TestBed.configureTestingModule({ providers: [...kit.providers] });
  const facade = TestBed.inject(ToolsFacade);
  await vi.waitFor(() => expect(facade.vm().catalogTotal).toBe(1));
  facade.open('aifg-a:112');
  await vi.waitFor(() => expect(facade.vm().studyStatus).toBe('failed'));
});

it('shows a failed summary and retries it without reloading the catalog', async () => {
  const kit = provideToolsFacadeTestKit();
  let fail = true;
  const summary = vi.fn(async () => {
    if (fail) throw new Error('Unavailable');
    return kit.catalog.loader.summary();
  });
  TestBed.configureTestingModule({
    providers: [
      ...kit.providers,
      { provide: CatalogToken, useValue: { ...kit.catalog.loader, summary } },
    ],
  });
  const facade = TestBed.inject(ToolsFacade);
  await vi.waitFor(() => expect(facade.vm().summaryFailed).toBe(true));
  expect(facade.vm().failed).toBe(false);
  await vi.waitFor(() => expect(facade.vm().catalogTotal).toBe(3));
  const calls = kit.catalog.calls.length;
  fail = false;
  facade.retrySummary();
  await vi.waitFor(() => expect(facade.vm().studied.size).toBe(1));
  expect(facade.vm().summaryFailed).toBe(false);
  expect(kit.catalog.calls).toHaveLength(calls);
});

it('stops a running example and withdraws Play when reduced motion is turned on', async () => {
  const listeners: (() => void)[] = [];
  const preference = {
    matches: false,
    addEventListener: (_type: string, listener: () => void) => listeners.push(listener),
    removeEventListener: vi.fn(),
    // The layout's breakpoint observer asks the same global through the older listeners.
    addListener: () => undefined,
    removeListener: () => undefined,
  };
  vi.stubGlobal('matchMedia', () => preference);
  vi.stubGlobal('requestAnimationFrame', () => 1);
  vi.stubGlobal('cancelAnimationFrame', () => undefined);
  const facade = await openArrive();
  facade.studyIntent({ kind: 'play', playing: true });
  expect(facade.vm().study?.visual?.playing).toBe(true);
  preference.matches = true;
  listeners.forEach((listener) => listener());
  expect(facade.vm().study?.visual?.playing).toBeNull();
  facade.studyIntent({ kind: 'play', playing: true });
  expect(facade.vm().study?.visual?.playing).toBeNull();
  TestBed.resetTestingModule();
  expect(preference.removeEventListener).toHaveBeenCalled();
  vi.unstubAllGlobals();
});

it('lets an unknown address close a reading without opening anything', async () => {
  const kit = provideToolsFacadeTestKit();
  TestBed.configureTestingModule({ providers: [...kit.providers] });
  const facade = TestBed.inject(ToolsFacade);
  await vi.waitFor(() => expect(facade.vm().catalogTotal).toBe(3));
  facade.open('sample:1');
  expect(facade.arrive('nothing:1')).toBe(true);
  expect(facade.vm().selected).toBeNull();
  expect(facade.arrive(undefined)).toBe(false);
});

it('treats reaching the reading on the return stack as going back', async () => {
  const kit = provideToolsFacadeTestKit();
  TestBed.configureTestingModule({ providers: [...kit.providers] });
  const facade = TestBed.inject(ToolsFacade);
  await vi.waitFor(() => expect(facade.vm().catalogTotal).toBe(3));
  facade.open('sample:1');
  facade.open('sample:2');
  expect(facade.vm().canReturn).toBe(true);
  expect(facade.arrive('sample:1')).toBe(true);
  expect(facade.vm().selected?.id).toBe('sample:1');
  expect(facade.vm().canReturn).toBe(false);
  facade.open('sample:2');
  expect(facade.back()).toBe('sample:1');
  expect(facade.vm().canReturn).toBe(false);
});

it('counts studied concepts on the shelf, marks them and narrows the results to them', async () => {
  const kit = provideToolsFacadeTestKit();
  TestBed.configureTestingModule({ providers: [...kit.providers] });
  const facade = TestBed.inject(ToolsFacade);
  await vi.waitFor(() => expect(facade.vm().studied.size).toBe(1));
  await vi.waitFor(() => expect(facade.vm().catalogTotal).toBe(3));
  expect(facade.vm().shelf.map(({ work, studied }) => [work, studied])).toEqual([
    ['aifg', 1],
    ['poeaa', 0],
    ['geb', 0],
  ]);
  expect(facade.vm().studied.has('sample:1')).toBe(true);
  facade.search('a');
  expect(facade.vm().total).toBe(3);
  facade.filter('studied', 'studied');
  expect(facade.vm().rows.map(({ id }) => id)).toEqual(['sample:1']);
  expect(facade.vm().filterValues.studied).toBe('Has a study');
  facade.filter('studied', 'unstudied');
  expect(
    facade
      .vm()
      .rows.map(({ id }) => id)
      .sort(),
  ).toEqual(['sample:2', 'sample:3']);
  facade.filter('studied', 'everything');
  expect(facade.vm().filters.studied).toBe('unstudied');
  facade.reset();
  expect(facade.vm().filters.studied).toBeNull();
});

it('lists the open work’s studied concepts in book order and hands each study to the next', async () => {
  const second = { ...catalogFixture[0], id: 'sample:9' as const, title: 'Herd' };
  const nextStudy = { ...studyFixture, id: 'sample:9' as const, slug: 'herd' };
  const kit = provideToolsFacadeTestKit([...catalogFixture, second], [studyFixture, nextStudy]);
  TestBed.configureTestingModule({ providers: [...kit.providers] });
  const facade = TestBed.inject(ToolsFacade);
  await vi.waitFor(() => expect(facade.vm().catalogTotal).toBe(4));
  await vi.waitFor(() => expect(facade.vm().studied.size).toBe(2));
  expect(facade.vm().studiedTools).toEqual([]);
  facade.chooseWork('aifg');
  expect(facade.vm().studiedTools.map(({ id }) => id)).toEqual(['sample:1', 'sample:9']);
  facade.open('sample:1');
  await vi.waitFor(() =>
    expect(facade.vm().study?.next).toEqual({ id: 'sample:9', title: 'Herd' }),
  );
  facade.open('sample:9');
  await vi.waitFor(() => expect(facade.vm().study?.id).toBe('sample:9'));
  expect(facade.vm().study?.next).toBeNull();
});

it('opens the shelf, searches full definitions, applies result facets and persists readings', async () => {
  const kit = provideToolsFacadeTestKit();
  TestBed.configureTestingModule({ providers: [...kit.providers] });
  const facade = TestBed.inject(ToolsFacade);
  await vi.waitFor(() => expect(facade.vm().catalogTotal).toBe(3));
  expect(facade.vm().shelf.map((work) => work.work)).toEqual(['aifg', 'poeaa', 'geb']);
  expect(facade.vm().selected).toBeNull();
  facade.chooseWork('poeaa');
  expect(facade.vm().contents[0].count).toBe(1);
  facade.search('transaction');
  expect(facade.vm().rows.map((tool) => tool.id)).toEqual(['sample:2']);
  facade.filter('status', 'typed');
  expect(facade.vm().total).toBe(0);
  facade.filter('status', 'invalid');
  expect(facade.vm().filters.status).toBe('typed');
  facade.reset();
  facade.open('sample:2');
  expect(facade.vm().selected?.definition).toContain('transaction');
  expect(facade.vm().query).toBe('');
  TestBed.tick();
  expect(kit.storage.values.get('dotln-angular.tools')).toContain('sample:2');
});

it('recovers from a failed loader and never reports failure as an empty success', async () => {
  const kit = provideToolsFacadeTestKit();
  let fail = true;
  TestBed.configureTestingModule({
    providers: [
      ...kit.providers,
      {
        provide: CatalogToken,
        useValue: {
          ...kit.catalog.loader,
          load: async () => {
            if (fail) throw new Error('Unavailable');
            return catalogFixture;
          },
        },
      },
    ],
  });
  const facade = TestBed.inject(ToolsFacade);
  await vi.waitFor(() => expect(facade.vm().failed).toBe(true));
  expect(facade.vm().shelf).toEqual([]);
  fail = false;
  facade.retry();
  await vi.waitFor(() => expect(facade.vm().catalogTotal).toBe(3));
  expect(facade.vm().failed).toBe(false);
});

it('bounds result pagination and keeps only ten distinct readings across works', async () => {
  const tools = Array.from({ length: 61 }, (_, index) => ({
    ...catalogFixture[0],
    id: `sample:${index + 1}` as const,
  }));
  const kit = provideToolsFacadeTestKit(tools);
  TestBed.configureTestingModule({ providers: [...kit.providers] });
  const facade = TestBed.inject(ToolsFacade);
  await vi.waitFor(() => expect(facade.vm().catalogTotal).toBe(61));
  facade.search('flock');
  expect(facade.vm().rows).toHaveLength(30);
  facade.page(2);
  expect(facade.vm().rows).toHaveLength(1);
  facade.page(-1);
  facade.page(100);
  expect(facade.vm().page).toBe(2);
  for (const tool of tools.slice(0, 12)) facade.open(tool.id);
  expect(facade.vm().history.map((tool) => tool.id)).toEqual([
    'sample:12',
    'sample:11',
    'sample:10',
    'sample:9',
    'sample:8',
    'sample:7',
    'sample:6',
    'sample:5',
    'sample:4',
    'sample:3',
  ]);
  facade.open('sample:8');
  expect(facade.vm().history).toHaveLength(10);
  expect(facade.vm().history[0].id).toBe('sample:8');
});

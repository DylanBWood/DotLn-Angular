import { loadModelStudy, studyTranslate, tokensOf } from '../../../../testing/src';
import { codeBlocks, fillValues } from '../study-text';
import {
  afterEachReading,
  chunkOf,
  lazyLoadRun,
  type LazyLoadStep,
  model,
  readParameters,
  request,
  settle,
  summaryRead,
} from './lazy-load.model';

const record = await loadModelStudy('poeaa:260', 'states');
const parameters = record.example.parameters;
const example = { studiesInChunk: 20, failFirst: 0, chunkPerStudy: false };

const kindsOf = (steps: readonly LazyLoadStep[]) => steps.map(({ operation }) => operation.kind);
const lastOf = (steps: readonly LazyLoadStep[]) => steps[steps.length - 1];

it('runs the example the record names, from the record’s own parameters', () => {
  expect(parameters).toEqual({ ...example, chunkPerStudy: 0 });
  expect(readParameters(parameters)).toEqual(example);
  expect(record.pseudocode.executable?.module).toBe(record.visual.model);
  expect(codeBlocks(record.pseudocode.ordinary)).toHaveLength(record.mechanism.steps.length);
  expect(record.pseudocode.rxjs?.startsWith('// Illustrative: ')).toBe(true);
});

it('keeps every study a marker until a reading asks, and filters from the markers alone', () => {
  const steps = lazyLoadRun(example);
  expect(steps[0].loader).toEqual(summaryRead);
  expect(steps[1].operation).toEqual({ kind: 'filter' });
  expect(steps[1].loader).toBe(steps[0].loader);
  expect(Object.values(steps[1].loader.recordStates)).toEqual(['marker', 'marker', 'marker']);
  expect([steps[1].loader.requests, steps[1].loader.records]).toEqual([0, 0]);
});

it('loads the whole work on the first read and answers later reads from memory', () => {
  const first = request(summaryRead, example, 'lazyLoad');
  expect(first.recordStates).toEqual({
    lazyLoad: 'loading',
    unitOfWork: 'loading',
    recordSet: 'loading',
  });
  expect(first.requests).toBe(1);
  const settled = settle(first, example, 'lazyLoad');
  expect(settled.failed).toBe(false);
  // One request brings every record the work's chunk carries, not just the one asked for.
  expect(settled.loader.records).toBe(20);
  expect(() => request(settled.loader, example, 'unitOfWork')).toThrow();
  const steps = lazyLoadRun(example);
  expect(kindsOf(steps)).toEqual(['start', 'filter', 'request', 'arrive', 'cached', 'cached']);
  expect(lastOf(steps).loader).toMatchObject({ requests: 1, records: 20, failures: 0 });
});

it('forgets a failed import, so the retry asks again and the work still loads once', () => {
  const steps = lazyLoadRun({ ...example, failFirst: 1 });
  expect(kindsOf(steps)).toEqual([
    'start',
    'filter',
    'request',
    'fail',
    'request',
    'arrive',
    'cached',
    'cached',
  ]);
  expect(Object.values(steps[3].loader.recordStates)).toEqual(['marker', 'marker', 'marker']);
  expect(steps[3].loader.records).toBe(0);
  expect(steps[4].operation).toEqual({ kind: 'request', id: 'lazyLoad', retry: true });
  expect(lastOf(steps).loader).toMatchObject({ requests: 2, records: 20, failures: 1 });
});

it('makes a request for every study read when each study is its own chunk', () => {
  const perStudy = { ...example, chunkPerStudy: true };
  expect(chunkOf(perStudy, 'unitOfWork')).toEqual(['unitOfWork']);
  expect(chunkOf(example, 'unitOfWork')).toEqual(['lazyLoad', 'unitOfWork', 'recordSet']);
  const steps = lazyLoadRun(perStudy);
  expect(kindsOf(steps).filter((kind) => kind === 'cached')).toEqual([]);
  expect(lastOf(steps).loader).toMatchObject({ requests: 3, records: 3 });
  expect(afterEachReading(steps).map(({ requests }) => requests)).toEqual([0, 1, 2, 3]);
  expect(afterEachReading(lazyLoadRun(example)).map(({ requests }) => requests)).toEqual([
    0, 1, 1, 1,
  ]);
});

it('draws each study in its record’s state and names the moves in the text equivalent', () => {
  const run = model(parameters, studyTranslate);
  const frames = run.states.frames;
  expect(frames).toHaveLength(6);
  const at = (step: number) =>
    Object.fromEntries(frames[step].placements.map(({ object, node }) => [object, node]));
  expect(at(0)).toEqual({ lazyLoad: 'marker', unitOfWork: 'marker', recordSet: 'marker' });
  expect(frames[1].moves).toEqual([]);
  expect(frames[2].moves.map(({ object, transition }) => [object, transition])).toEqual([
    ['lazyLoad', 'firstRead'],
    ['unitOfWork', 'carried'],
    ['recordSet', 'carried'],
  ]);
  expect(at(3)).toEqual({ lazyLoad: 'loaded', unitOfWork: 'loaded', recordSet: 'loaded' });
  // A later read stays in memory: a loop back into the same state, with no request.
  expect(frames[4].moves).toEqual([
    { object: 'unitOfWork', from: 'loaded', to: 'loaded', transition: 'cachedRead' },
  ]);
  expect(frames[4].values['requests']).toBe('1');
  expect(frames[4].note).toBe(
    'The reader opens the reading of Unit of Work. Its record is already in memory, so the read is answered without a request.',
  );
  expect(fillValues(record.visual.textEquivalent, frames[2].values)).toBe(
    'Step 2: Lazy Load study moves from Marker to Loading by study(id); Unit of Work study, Record Set study move from Marker to Loading by same chunk. The records: Marker: none; Loading: Lazy Load study, Unit of Work study, Record Set study; Loaded: none. Chunk requests so far: 1; records in memory: 0.',
  );
  expect(frames[3].note).toBe(
    'The chunk arrives and 20 records are in memory, though the reader has asked for one.',
  );
  expect(frames[2].placements.map(({ note }) => note)).toEqual([
    'asked for',
    'comes with the chunk',
    'comes with the chunk',
  ]);
  // The whole chunk moves at the first request: every study, each under its own token letter.
  const keys = tokensOf(run.states);
  expect(frames[2].moves.map(({ object }) => keys[object])).toEqual(['L', 'U', 'R']);
});

it('shows the failed import sending every record back to a marker, then the retry', () => {
  const failing = model({ ...parameters, failFirst: 1 }, studyTranslate);
  const frame = failing.states.frames[3];
  expect(frame.moves.map(({ from, to, transition }) => [from, to, transition])).toEqual(
    Array(3).fill(['loading', 'marker', 'fail']),
  );
  expect(frame.placements.map(({ note }) => note)).toEqual(
    Array(3).fill('import failed; a marker again'),
  );
  expect(failing.states.frames[4].note).toBe(
    'The reader retries. The failed load was forgotten, so the read asks for the chunk again: request 2.',
  );
  expect(failing.moments.map(({ label, step }) => [label, step])).toEqual([
    ['Markers', 0],
    ['First read', 2],
    ['Failure', 3],
    ['In memory', 5],
    ['From memory', 6],
  ]);
});

it('compares one chunk for the work with one for each study, and names the moments in order', () => {
  const run = model(parameters, studyTranslate);
  const [perWork, perStudy] = run.comparison?.timeline.series ?? [];
  expect(perWork.values).toEqual([0, 1, 1, 1]);
  expect(perStudy.values).toEqual([0, 1, 2, 3]);
  expect(run.comparison?.findings[0]).toBe(
    'Readings: 3. One chunk for the work: requests 1, records held 20. A chunk for each study: requests 3, records held 3.',
  );
  expect(run.moments.map(({ label, step }) => [label, step])).toEqual([
    ['Markers', 0],
    ['First read', 2],
    ['In memory', 3],
    ['From memory', 4],
  ]);
  const perStudyRun = model({ ...parameters, chunkPerStudy: 1 }, studyTranslate);
  expect(perStudyRun.moments[perStudyRun.moments.length - 1]).toEqual({
    label: 'Last read',
    step: perStudyRun.states.frames.length - 1,
  });
});

import { loadModelStudy, studyTranslate, tokensOf } from '../../../../testing/src';
import { codeBlocks, fillValues } from '../study-text';
import {
  catalogOf,
  catalogRows,
  emptyLoader,
  follow,
  foreignKeyRun,
  load,
  model,
  placeOf,
  readParameters,
  rowByKey,
  type RowId,
} from './foreign-key-mapping.model';

const record = await loadModelStudy('poeaa:278', 'states');
const parameters = record.example.parameters;
const example = {
  lineDataMapper: 240,
  lineIdentityMap: 254,
  lineUnitOfWork: 246,
  identityMap: true,
  readLimit: 6,
};

it('runs the example the record names, from the record’s own parameters', () => {
  expect(parameters).toEqual({ ...example, identityMap: 1 });
  expect(readParameters(parameters)).toEqual(example);
  expect(record.pseudocode.executable?.module).toBe(record.visual.model);
  expect(codeBlocks(record.pseudocode.ordinary)).toHaveLength(record.mechanism.steps.length);
});

it('keeps each relation as the key of the row it names, on the referring row', () => {
  const catalog = catalogOf(example);
  expect(catalog.map(({ id, line, keys }) => [id, line, keys])).toEqual([
    ['dataMapper', 240, [254, 246]],
    ['identityMap', 254, [246, 240]],
    ['unitOfWork', 246, [254, 240]],
  ]);
  expect(rowByKey(catalog, 246).id).toBe('unitOfWork');
  expect(() => rowByKey(catalog, 999)).toThrow('No row has the key 999.');
});

it('registers an object before following its keys, so a key back to it finds it without a read', () => {
  const catalog = catalogOf(example);
  let loader = load(emptyLoader, catalog[0], true);
  expect(loader.identityMap).toEqual({ dataMapper: 0 });
  expect(loader.pending).toEqual([{ object: 0, next: 0 }]);
  loader = follow(loader, catalog, true).loader;
  loader = follow(loader, catalog, true).loader;
  // Unit of Work's first key names Identity Map, which is already built.
  const found = follow(loader, catalog, true);
  expect(found).toMatchObject({ from: 'unitOfWork', key: 254, to: 'identityMap', how: 'found' });
  expect(found.loader.reads).toBe(loader.reads);
  expect(found.loader.objects).toHaveLength(3);
});

it('reads each row once through the identity map, and every reference to a row is the same object', () => {
  const steps = foreignKeyRun(example);
  const last = steps[steps.length - 1].loader;
  expect(steps).toHaveLength(8);
  expect(last.reads).toBe(3);
  expect(last.pending).toEqual([]);
  expect(last.objects.map(({ row, references }) => [row, references])).toEqual([
    ['dataMapper', [1, 2]],
    ['identityMap', [2, 0]],
    ['unitOfWork', [1, 0]],
  ]);
  // Data Mapper's and Unit of Work's references to Identity Map are one object.
  expect(last.objects[0].references[0]).toBe(last.objects[2].references[0]);
  // Data Mapper, whose first key led round the cycle, is resolved last.
  const resolvedAt = (row: RowId) =>
    steps.findIndex(({ loader }) => placeOf(loader, row) === 'resolved');
  expect([resolvedAt('unitOfWork'), resolvedAt('identityMap'), resolvedAt('dataMapper')]).toEqual([
    5, 6, 7,
  ]);
});

it('stops at its read limit only when the next key still to resolve needs a read', () => {
  // Through the identity map the run reads each of its three rows once, and every key left after
  // the third read finds its object in the map. Whatever the limit, the run is the whole run cut
  // just before the step that would read past it, the read a following key needs; a key the map
  // resolves is followed whatever the count, so a limit of three or more leaves the run whole.
  const whole = foreignKeyRun(example);
  expect(whole.at(-1)?.loader.reads).toBe(3);
  for (let readLimit = 1; readLimit <= example.readLimit; readLimit++) {
    const past = whole.findIndex(({ loader }) => loader.reads > readLimit);
    if (past !== -1)
      expect(whole[past].operation, `limit ${readLimit}`).toMatchObject({ how: 'load' });
    const cut =
      past === -1
        ? whole
        : [
            ...whole.slice(0, past),
            { operation: { kind: 'stopped' }, loader: whole[past - 1].loader },
          ];
    expect(foreignKeyRun({ ...example, readLimit }), `limit ${readLimit}`).toEqual(cut);
  }
});

it('goes round the cycle without an identity map, building copies, until the limit stops it', () => {
  const steps = foreignKeyRun({ ...example, identityMap: false });
  const last = steps[steps.length - 1];
  expect(last.operation).toEqual({ kind: 'stopped' });
  expect(last.loader.reads).toBe(6);
  expect(last.loader.objects.map(({ row, copy }) => [row, copy])).toEqual([
    ['dataMapper', 1],
    ['identityMap', 1],
    ['unitOfWork', 1],
    ['identityMap', 2],
    ['unitOfWork', 2],
    ['identityMap', 3],
  ]);
  // Two references to Identity Map that are different objects: a change through one misses the other.
  expect(last.loader.objects[0].references[0]).not.toBe(last.loader.objects[2].references[0]);
  expect(catalogRows.map((row) => placeOf(last.loader, row))).toEqual([
    'resolving',
    'resolving',
    'resolving',
  ]);
  // A larger limit only lets it read more: the cycle never ends on its own.
  const longer = foreignKeyRun({ ...example, identityMap: false, readLimit: 20 });
  expect(longer[longer.length - 1]).toMatchObject({
    operation: { kind: 'stopped' },
    loader: { reads: 20 },
  });
});

it('draws each row in its place and names every place in the text equivalent', () => {
  const run = model(parameters, studyTranslate);
  const frames = run.states.frames;
  expect(frames).toHaveLength(8);
  const at = (step: number) =>
    Object.fromEntries(frames[step].placements.map(({ object, node }) => [object, node]));
  expect(at(0)).toEqual({ dataMapper: 'stored', identityMap: 'stored', unitOfWork: 'stored' });
  expect(at(3)).toEqual({
    dataMapper: 'resolving',
    identityMap: 'resolving',
    unitOfWork: 'resolving',
  });
  expect(at(7)).toEqual({
    dataMapper: 'resolved',
    identityMap: 'resolved',
    unitOfWork: 'resolved',
  });
  // A key to a row already built is a loop back into the same place, by find.
  expect(frames[4].moves).toEqual([
    { object: 'identityMap', from: 'resolving', to: 'resolving', transition: 'findResolving' },
  ]);
  expect(frames[7].moves).toEqual([
    { object: 'dataMapper', from: 'resolving', to: 'resolved', transition: 'resolve' },
    { object: 'unitOfWork', from: 'resolved', to: 'resolved', transition: 'findResolved' },
  ]);
  expect(fillValues(record.visual.textEquivalent, frames[4].values)).toBe(
    'Step 4: Identity Map stays in Resolving by resolve: in the map. The rows: Row only: none; Resolving: Data Mapper, Identity Map, Unit of Work; Resolved: none. Rows read 3 for 3 rows; objects built 3; references made 3.',
  );
  expect(frames[0].placements.find(({ object }) => object === 'dataMapper')?.note).toBe(
    'keys poeaa:254, poeaa:246',
  );
  expect(frames[7].note).toBe(
    "Data Mapper's key poeaa:246 names Unit of Work, which is in the identity map already, so the reference is that same object and no row is read. Every key of Data Mapper is now a reference, so it is resolved.",
  );
});

it('draws the run without an identity map stopping with every row still resolving', () => {
  const run = model({ ...parameters, identityMap: 0 }, studyTranslate);
  const frames = run.states.frames;
  const last = frames[frames.length - 1];
  expect(last.moves).toEqual([]);
  expect(last.placements.map(({ object, node, note }) => [object, node, note])).toEqual([
    ['dataMapper', 'resolving', '1 of 2 keys followed'],
    ['identityMap', 'resolving', '3 objects from this one row'],
    ['unitOfWork', 'resolving', '2 objects from this one row'],
  ]);
  expect(frames[4].moves).toEqual([
    { object: 'identityMap', from: 'resolving', to: 'resolving', transition: 'reload' },
  ]);
  // Every row stays in the example under its token letter, and nothing moves at the stop.
  expect(last.placements.map(({ object }) => tokensOf(run.states)[object])).toEqual([
    'D',
    'I',
    'U',
  ]);
  expect(run.moments.map(({ label, step }) => [label, step])).toEqual([
    ['Open', 1],
    ['Load', 2],
    ['Read again', 4],
    ['Stopped', 7],
  ]);
});

it('charts rows read with and without the identity map, and names the moments in order', () => {
  const run = model(parameters, studyTranslate);
  const [through, without] = run.comparison?.timeline.series ?? [];
  expect(through.values).toEqual([0, 1, 2, 3, 3, 3, 3, 3]);
  expect(without.values).toEqual([0, 1, 2, 3, 4, 5, 6, 6]);
  expect(run.comparison?.findings).toEqual([
    'Through the identity map the loader reads each of the 3 rows once, 3 reads in all, and finishes; without it, it has read 6 rows by the end of the run and is not done.',
    'Every read beyond one per row builds a duplicate: by then Identity Map alone stands as 3 separate objects, and a change made through one would not reach the others.',
  ]);
  expect(run.moments.map(({ label, step }) => [label, step])).toEqual([
    ['Open', 1],
    ['Load', 2],
    ['Found', 4],
    ['Resolved', 5],
    ['Done', 7],
  ]);
});

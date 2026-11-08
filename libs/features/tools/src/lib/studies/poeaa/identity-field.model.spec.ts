import { loadStatesStudy, studyTranslate } from '../../../../testing/src';
import { registerDrawing } from '../../composites/study-visuals/states/states-register';
import { codeBlocks, fillValues } from '../study-text';
import {
  collisionsIn,
  compose,
  identityFieldRun,
  isStored,
  keyOf,
  model,
  nextKey,
  open,
  save,
  type Scene,
  sharersOf,
} from './identity-field.model';

const record = await loadStatesStudy('poeaa:268');
const parameters = record.example.parameters;
const example = { keyFlank: 1, keyRidge: 2, rereads: 1 };

const twoTabs = (): Scene => {
  const stored = [
    { id: 'flank', key: 1 },
    { id: 'ridge', key: 2 },
  ] as const;
  return {
    storage: stored,
    tabs: { here: { list: stored, drafts: [] }, other: { list: stored, drafts: [] } },
  };
};

it('runs the example the record names, from the record’s own parameters', () => {
  expect(parameters).toEqual(example);
  expect(record.pseudocode.executable?.module).toBe(record.visual.model);
  expect(codeBlocks(record.pseudocode.ordinary)).toHaveLength(record.mechanism.steps.length);
});

it('reads each stored composition with its key, and leaves a new one without a key', () => {
  const scene = compose(twoTabs(), 'here', 'night');
  expect(keyOf(scene, 'flank')).toBe(1);
  expect(keyOf(scene, 'ridge')).toBe(2);
  expect(keyOf(scene, 'night')).toBeNull();
  expect(open(scene, 'here', 2)).toBe('ridge');
  // One past the highest, not the count: a gap in the numbers is never filled.
  expect(
    nextKey([
      { id: 'flank', key: 1 },
      { id: 'ridge', key: 4 },
    ]),
  ).toBe(5);
  expect(nextKey([])).toBe(1);
});

it('takes a fresh key when the save reads storage again, so one key names one composition', () => {
  const steps = identityFieldRun(example);
  expect(steps).toHaveLength(6);
  const [, , first, second] = steps;
  expect(first.operation).toMatchObject({ kind: 'save', tab: 'other', id: 'dawn', key: 3 });
  expect(second.operation).toMatchObject({ kind: 'save', tab: 'here', id: 'night', key: 4 });
  const last = steps[steps.length - 1].scene;
  expect(last.storage.map(({ id, key }) => [id, key])).toEqual([
    ['flank', 1],
    ['ridge', 2],
    ['dawn', 3],
    ['night', 4],
  ]);
  expect(collisionsIn(last)).toBe(0);
  expect(steps.slice(4).map(({ operation }) => operation)).toEqual([
    { kind: 'open', tab: 'here', key: 3, found: 'dawn' },
    { kind: 'open', tab: 'other', key: 3, found: 'dawn' },
  ]);
});

it('collides when a save keys from the list its tab already holds, and storage drops the first', () => {
  const steps = identityFieldRun({ ...example, rereads: 0 });
  const saved = steps[3];
  expect(saved.operation).toMatchObject({ kind: 'save', id: 'night', key: 3, reread: false });
  const scene = saved.scene;
  expect(sharersOf(scene, 'night')).toEqual(['dawn']);
  expect(sharersOf(scene, 'dawn')).toEqual(['night']);
  expect(collisionsIn(scene)).toBe(1);
  // A save writes the whole list, so the other tab's save is gone from storage.
  expect(isStored(scene, 'dawn')).toBe(false);
  expect(isStored(scene, 'night')).toBe(true);
  // The same key now opens a different composition in each tab.
  expect(open(scene, 'here', 3)).toBe('night');
  expect(open(scene, 'other', 3)).toBe('dawn');
  expect(() => save(scene, 'here', 'night', true)).toThrow('not a draft');
  expect(() => identityFieldRun({ ...example, keyRidge: 1 })).toThrow('must differ');
});

it('draws each composition in its column, with the collision as two moves at one step', () => {
  const run = model(parameters, studyTranslate);
  const frames = run.states.frames;
  const at = (step: number) =>
    Object.fromEntries(frames[step].placements.map(({ object, node }) => [object, node]));
  expect(at(0)).toEqual({ flank: 'own', ridge: 'own' });
  expect(at(1)).toEqual({ flank: 'own', ridge: 'own', dawn: 'unkeyed', night: 'unkeyed' });
  expect(at(3)).toEqual({ flank: 'own', ridge: 'own', dawn: 'own', night: 'own' });
  expect(frames[4].moves).toEqual([{ object: 'dawn', from: 'own', to: 'own', transition: 'open' }]);
  expect(fillValues(record.visual.textEquivalent, frames[3].values)).toBe(
    'Step 3: Night march moves from No key to Own key by save. This tab reads the stored list again before choosing, so the highest number it sees is 3 and Night march takes composition-4, which no other composition holds. Where each composition stands: No key: none; Own key: Flank left, Hold the ridge, Dawn raid, Night march; Shared key: none. Keys held: Flank left: composition-1; Hold the ridge: composition-2; Dawn raid: composition-3; Night march: composition-4. Keys held by two compositions: 0.',
  );
  const collided = model({ ...parameters, rereads: 0 }, studyTranslate);
  const step = collided.states.frames[3];
  expect(step.moves.map(({ object, transition }) => [object, transition])).toEqual([
    ['dawn', 'keyTaken'],
    ['night', 'saveShared'],
  ]);
  expect(step.values['keying']).toBe(
    "This tab chooses from the list it already holds, where the highest number is 2, so Night march takes composition-3, which Dawn raid already holds: the other tab's save is not in that list.",
  );
  expect(step.placements.find(({ object }) => object === 'dawn')?.note).toBe(
    'composition-3, also held by Night march; no longer stored',
  );
  expect(collided.states.frames[4].note).toBe(
    'This tab opens composition-3 and finds Night march, while in the other tab the same key opens Dawn raid.',
  );
  const drawing = registerDrawing(collided.states, 3);
  expect(drawing.tokens.filter(({ state }) => state === 'moving').map(({ key }) => key)).toEqual([
    'D',
    'N',
  ]);
});

it('names the moments in order, calling the second save a collision only when it is one', () => {
  const labels = (rereads: number) =>
    model({ ...parameters, rereads }, studyTranslate).moments.map(({ label, step }) => [
      label,
      step,
    ]);
  expect(labels(1)).toEqual([
    ['Compose', 1],
    ['First key', 2],
    ['Re-read', 3],
    ['Open by key', 4],
  ]);
  expect(labels(0)[2]).toEqual(['Collision', 3]);
});

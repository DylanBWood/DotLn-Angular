import { studyTranslate } from '../../../testing/src';
import { statesModel, type StatesRun } from './states';

const shape: StatesRun['shape'] = {
  nodes: [
    { id: 'clean', label: 'Clean' },
    { id: 'dirty', label: 'Dirty', tone: 'subject' },
  ],
  objects: [
    { id: 'a', label: 'Scene A', key: 'A' },
    { id: 'b', label: 'Scene B', key: 'B' },
  ],
  transitions: [
    { id: 'edit', from: 'clean', to: 'dirty', label: 'registerDirty' },
    { id: 'again', from: 'dirty', to: 'dirty', label: 'registerDirty' },
  ],
};
const parts = { moments: [{ label: 'Edited', step: 1 }], legend: [], caption: 'How to read it.' };

it('reads each step’s moves from where the objects stood before it, and names every state', () => {
  const { states } = statesModel(
    {
      shape,
      snapshots: [
        { at: { a: 'clean' } },
        { at: { a: 'dirty', b: 'clean' }, took: { a: 'edit' } },
        { at: { a: 'dirty', b: 'clean' }, took: { a: 'again' } },
        { at: { b: 'clean' } },
      ],
      text: [{ notes: { a: 'version 3' } }],
    },
    parts,
    studyTranslate,
  );
  expect(states.frames.map(({ moves }) => moves)).toEqual([
    [],
    [
      { object: 'a', from: 'clean', to: 'dirty', transition: 'edit' },
      { object: 'b', from: null, to: 'clean' },
    ],
    [{ object: 'a', from: 'dirty', to: 'dirty', transition: 'again' }],
    [{ object: 'a', from: 'dirty', to: null }],
  ]);
  expect(states.frames[0].placements).toEqual([{ object: 'a', node: 'clean', note: 'version 3' }]);
  expect(states.frames[1].values['moves']).toBe(
    'Scene A moves from Clean to Dirty by registerDirty; Scene B enters Clean',
  );
  expect(states.frames[1].values['placements']).toBe('Clean: Scene B; Dirty: Scene A');
  expect(states.frames[2].values['moves']).toBe('Scene A stays in Dirty by registerDirty');
  expect(states.frames[3].values['moves']).toBe('Scene A leaves Dirty');
  expect(states.frames[3].values['placements']).toBe('Clean: Scene B; Dirty: none');
  expect(states.frames[0].note).toBe('Nothing has moved yet.');
  expect(states.frames[3].note).toBe('At step 3, Scene A leaves Dirty.');
});

it('refuses an example that names a state, object or transition it does not have', () => {
  const run = (snapshots: StatesRun['snapshots']) => () =>
    statesModel({ shape, snapshots, text: [] }, parts, studyTranslate);
  expect(run([{ at: { a: 'clean' } }, { at: { a: 'gone' } }])).toThrow(/gone/);
  expect(run([{ at: { a: 'clean' } }, { at: { z: 'clean' } }])).toThrow(/z/);
  expect(run([{ at: { a: 'clean' } }, { at: { a: 'dirty' }, took: { a: 'jump' } }])).toThrow(
    /jump/,
  );
  // A named transition must be the way the object actually went.
  expect(run([{ at: { a: 'dirty' } }, { at: { a: 'clean' }, took: { a: 'edit' } }])).toThrow(
    /cannot take edit/,
  );
  expect(() =>
    statesModel(
      {
        shape: { ...shape, nodes: [...shape.nodes, { id: 'clean', label: 'Twice' }] },
        snapshots: [],
        text: [],
      },
      parts,
      studyTranslate,
    ),
  ).toThrow(/share the id clean/);
});

it('infers a move’s transition when exactly one joins its states, and names none where none does', () => {
  const { states } = statesModel(
    {
      shape,
      snapshots: [
        { at: { a: 'clean' } },
        { at: { a: 'dirty', b: 'clean' } },
        { at: { a: 'dirty' } },
      ],
      text: [],
    },
    parts,
    studyTranslate,
  );
  // Only edit joins Clean to Dirty; no transition brings an object into Clean from outside.
  expect(states.frames[1].moves).toEqual([
    { object: 'a', from: 'clean', to: 'dirty', transition: 'edit' },
    { object: 'b', from: null, to: 'clean' },
  ]);
  expect(states.frames[1].values['moves']).toBe(
    'Scene A moves from Clean to Dirty by registerDirty; Scene B enters Clean',
  );
  // An object that stays where it was takes a transition back into its state only when named.
  expect(states.frames[2].moves).toEqual([{ object: 'b', from: 'clean', to: null }]);
});

it('refuses an ambiguous move unless its snapshot names the transition it took', () => {
  const twoWays: StatesRun['shape'] = {
    ...shape,
    transitions: [
      ...shape.transitions,
      { id: 'touch', from: 'clean', to: 'dirty', label: 'touch' },
    ],
  };
  const snapshots = [{ at: { a: 'clean' } }, { at: { a: 'dirty' } }];
  expect(() => statesModel({ shape: twoWays, snapshots, text: [] }, parts, studyTranslate)).toThrow(
    'a moves from clean to dirty, which edit and touch each join; the snapshot must name one.',
  );
  const named = statesModel(
    {
      shape: twoWays,
      snapshots: [snapshots[0], { ...snapshots[1], took: { a: 'touch' } }],
      text: [],
    },
    parts,
    studyTranslate,
  );
  expect(named.states.frames[1].moves).toEqual([
    { object: 'a', from: 'clean', to: 'dirty', transition: 'touch' },
  ]);
});

it('leaves out an object placed nowhere and a note that says nothing', () => {
  const { states } = statesModel(
    {
      shape,
      snapshots: [{ at: { a: 'clean', b: null } }, { at: { a: 'clean', b: 'clean' } }],
      text: [{ notes: { a: 'version 3', b: null } }, { notes: { a: null, b: 'new' } }],
    },
    parts,
    studyTranslate,
  );
  expect(states.frames.map(({ placements }) => placements)).toEqual([
    [{ object: 'a', node: 'clean', note: 'version 3' }],
    [
      { object: 'a', node: 'clean' },
      { object: 'b', node: 'clean', note: 'new' },
    ],
  ]);
  expect(states.frames[1].moves).toEqual([{ object: 'b', from: null, to: 'clean' }]);
});

it('reads objects that take the same way at one step as one sentence naming them all', () => {
  const { states } = statesModel(
    {
      shape,
      snapshots: [
        { at: { a: 'clean', b: 'clean' } },
        { at: { a: 'dirty', b: 'dirty' }, took: { a: 'edit', b: 'edit' } },
      ],
      text: [],
    },
    parts,
    studyTranslate,
  );
  expect(states.frames[1].values['moves']).toBe(
    'Scene A, Scene B move from Clean to Dirty by registerDirty',
  );
  expect(states.frames[1].moves).toHaveLength(2);
});

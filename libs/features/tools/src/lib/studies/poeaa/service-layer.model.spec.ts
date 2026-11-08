import { loadStatesStudy, studyTranslate } from '../../../../testing/src';
import { registerDrawing } from '../../composites/study-visuals/states/states-register';
import { codeBlocks, fillValues } from '../study-text';
import {
  announce,
  check,
  model,
  readAndCheck,
  saveCalls,
  serviceLayerRun,
  stageOf,
  startState,
  writeDirect,
  writePending,
} from './service-layer.model';

const record = await loadStatesStudy('poeaa:226');
const parameters = record.example.parameters;
const example = { flankId: 1, ridgeId: 4, importBypasses: 0, importForeign: 0 };
const [nightCall, dawnCall, importCall] = saveCalls(example);

const names = (list: readonly { readonly name: string }[]) => list.map(({ name }) => name);

it('runs the example the record names, from the record’s own parameters', () => {
  expect(parameters).toEqual(example);
  expect(record.pseudocode.executable?.module).toBe(record.visual.model);
  expect(codeBlocks(record.pseudocode.ordinary)).toHaveLength(record.mechanism.steps.length);
});

it('keeps the rules in the domain: another scene is refused, and an id is one past the highest', () => {
  const stored = startState(example).stored;
  expect(check({ name: 'river', ownScene: false }, stored)).toEqual({ kind: 'refused' });
  // composition-2 and composition-3 are free, but the next id follows composition-4.
  expect(check({ name: 'night', ownScene: true }, stored)).toEqual({
    kind: 'accepted',
    composition: { name: 'night', id: 5 },
  });
});

it('takes every request through the same check, write and announcement, reading storage afresh', () => {
  const steps = serviceLayerRun(example);
  expect(steps.map(({ operation }) => operation.kind)).toEqual([
    'start',
    ...['check', 'write', 'announce'],
    ...['check', 'write', 'announce'],
    ...['check', 'write', 'announce'],
  ]);
  const last = steps[steps.length - 1].state;
  expect(last.stored).toEqual([
    { name: 'flank', id: 1 },
    { name: 'ridge', id: 4 },
    { name: 'night', id: 5 },
    { name: 'dawn', id: 6 },
    { name: 'river', id: 7 },
  ]);
  expect(last.writes).toBe(3);
  // Tab B's save reads Night march, which tab A saved after tab B opened, and keeps it.
  const dawnCheck = steps[4].operation;
  expect(dawnCheck.kind === 'check' && names(dawnCheck.read)).toEqual(['flank', 'ridge', 'night']);
  const importCheck = steps[7].operation;
  expect(importCheck.kind === 'check' && names(importCheck.read)).toContain('dawn');
});

it('announces only after the write, and the other tab hears nothing until its own save reads storage', () => {
  const checked = readAndCheck(startState(example), nightCall).state;
  expect(() => announce(checked, nightCall)).toThrow();
  const steps = serviceLayerRun(example);
  // Written but not yet announced: storage has Night march, no list shows it.
  expect(names(steps[2].state.stored)).toContain('night');
  expect(names(steps[2].state.listed.a)).not.toContain('night');
  expect(names(steps[3].state.listed.a)).toContain('night');
  expect(names(steps[3].state.listed.b)).not.toContain('night');
  expect(names(steps[5].state.listed.b)).not.toContain('night');
  expect(names(steps[6].state.listed.b)).toEqual(['flank', 'ridge', 'night', 'dawn']);
});

it('loses tab B’s save when the import skips the service and writes the list its tab holds', () => {
  const steps = serviceLayerRun({ ...example, importBypasses: 1 });
  const last = steps[steps.length - 1];
  expect(last.operation).toMatchObject({ kind: 'writeDirect', lost: ['dawn'] });
  expect(names(last.state.stored)).toEqual(['flank', 'ridge', 'night', 'river']);
  // Tab B still lists Dawn raid, and River crossing takes the id tab B gave it.
  expect(names(last.state.listed.b)).toContain('dawn');
  const dawnId = steps[steps.length - 2].state.stored.find(({ name }) => name === 'dawn')?.id;
  expect(last.state.stored.find(({ name }) => name === 'river')?.id).toBe(dawnId);
  // No list is told about River crossing.
  expect([...last.state.listed.a, ...last.state.listed.b].map(({ name }) => name)).not.toContain(
    'river',
  );
  expect(stageOf(last.state, 'dawn')).toBeNull();
  expect(stageOf(last.state, 'river')).toBe('stored');
});

it('refuses a foreign export through the service, but writes it when the import skips the service', () => {
  const refused = serviceLayerRun({ ...example, importForeign: 1 });
  const last = refused[refused.length - 1];
  expect(last.operation).toMatchObject({ kind: 'check', verdict: { kind: 'refused' } });
  expect(last.state.stored).toEqual(refused[refused.length - 2].state.stored);
  expect(last.state.writes).toBe(2);
  expect(stageOf(last.state, 'river')).toBe('refused');
  const bypassed = serviceLayerRun({ ...example, importBypasses: 1, importForeign: 1 });
  expect(names(bypassed[bypassed.length - 1].state.stored)).toContain('river');
});

it('still loses a save that lands between the operation’s read and its write', () => {
  // Tab A reads and checks, tab B saves in full, then tab A writes the list it read.
  let state = readAndCheck(startState(example), nightCall).state;
  state = readAndCheck(state, dawnCall).state;
  state = announce(writePending(state, dawnCall).state, dawnCall).state;
  state = writePending(state, nightCall).state;
  expect(names(state.stored)).toEqual(['flank', 'ridge', 'night']);
  expect(names(state.listed.b)).toContain('dawn');
  // The import's own code shows the same loss from a stale copy, without any interleaving.
  expect(names(writeDirect(state, importCall).state.stored)).not.toContain('dawn');
});

it('draws each composition in its stage and names the stages in the text equivalent', () => {
  const run = model(parameters, studyTranslate);
  const frames = run.states.frames;
  expect(frames).toHaveLength(10);
  const at = (step: number) =>
    Object.fromEntries(frames[step].placements.map(({ object, node }) => [object, node]));
  expect(at(0)).toEqual({ night: 'draft', dawn: 'draft', river: 'draft' });
  expect(at(1)).toEqual({ night: 'accepted', dawn: 'draft', river: 'draft' });
  expect(at(2)).toEqual({ night: 'stored', dawn: 'draft', river: 'draft' });
  expect(at(9)).toEqual({ night: 'announced', dawn: 'announced', river: 'announced' });
  expect(frames[4].moves).toEqual([
    { object: 'dawn', from: 'draft', to: 'accepted', transition: 'check' },
  ]);
  expect(fillValues(record.visual.textEquivalent, frames[3].values)).toBe(
    'Step 3: Night march moves from Stored to Announced by announce. The compositions: Draft: Dawn raid, River crossing; Accepted: none; Stored: none; Announced: Night march; Refused: none. Storage holds Flank left (composition-1), Hold the ridge (composition-4), Night march (composition-5); writes so far: 1.',
  );
  expect(frames[1].placements.find(({ object }) => object === 'night')?.note).toBe(
    'composition-5; not written yet',
  );
  expect(run.moments.map(({ label, step }) => [label, step])).toEqual([
    ['Check', 1],
    ['Announce', 3],
    ['Other tab', 4],
    ['Import', 7],
  ]);
});

it('draws the bypass skipping Accepted, the overwritten save leaving, and a refusal', () => {
  const bypassed = model({ ...parameters, importBypasses: 1 }, studyTranslate).states;
  const last = bypassed.frames[bypassed.frames.length - 1];
  expect(bypassed.frames).toHaveLength(8);
  expect(last.moves).toEqual([
    { object: 'dawn', from: 'announced', to: null, transition: 'overwritten' },
    { object: 'river', from: 'draft', to: 'stored', transition: 'writeDirect' },
  ]);
  expect(last.note).toContain('Dawn raid is gone from storage while tab B still lists it');
  const drawing = registerDrawing(bypassed, bypassed.frames.length - 1);
  expect(drawing.tokens.map(({ key }) => key)).toEqual(['N', 'R']);
  expect(drawing.ghosts).toHaveLength(1);
  const refused = model({ ...parameters, importForeign: 1 }, studyTranslate).states;
  expect(refused.frames[refused.frames.length - 1].moves).toEqual([
    { object: 'river', from: 'draft', to: 'refused', transition: 'refuse' },
  ]);
});

import { loadStatesStudy, studyTranslate } from '../../../../testing/src';
import { registerDrawing } from '../../composites/study-visuals/states/states-register';
import { codeBlocks, fillValues } from '../study-text';
import {
  assembleActor,
  assembleBuild,
  assembleEvidence,
  byteLength,
  dataTransferRun,
  decode,
  domainObjects,
  emptyTransfer,
  encode,
  encodesDirectly,
  model,
  readUnchecked,
} from './data-transfer-object.model';

const record = await loadStatesStudy('poeaa:363');
const parameters = record.example.parameters;
const example = { serverVersion: 1, pageVersion: 1, buildSteps: 4 };

it('runs the example the record names, from the record’s own parameters', () => {
  expect(parameters).toEqual(example);
  expect(record.pseudocode.executable?.module).toBe(record.visual.model);
  expect(record.pseudocode.rxjs).toBeNull();
  expect(codeBlocks(record.pseudocode.ordinary)).toHaveLength(record.mechanism.steps.length);
});

it('cannot send the domain objects as they stand: the build points back at the actor', () => {
  const objects = domainObjects(example);
  expect(objects.build.usedBy).toEqual([objects.actor]);
  expect(encodesDirectly(objects)).toBe(false);
});

it('copies each object as data, every reference as an id, and links one way', () => {
  const { actor, build, evidence } = domainObjects(example);
  const transfer = assembleEvidence(
    assembleBuild(assembleActor(emptyTransfer, actor), build),
    evidence,
  );
  expect(transfer).toEqual({
    panels: {
      actors: [
        {
          id: 'definition-1',
          cells: [{ key: 'kind', value: 'saved-definition', evidence: ['evidence-1'] }],
          links: [{ target: 'build-1' }],
        },
      ],
      builds: [{ id: 'build-1', cells: [{ key: 'steps', value: 4, evidence: [] }], links: [] }],
    },
    evidence: [{ id: 'evidence-1', source: 'definitions' }],
  });
  // The copy has no cycle, so it encodes.
  const text = encode(transfer, 1);
  expect(JSON.parse(text).viewModelVersion).toBe('uifa-board-v1');
  // It is a copy: the build saved again afterwards changes only a text encoded afterwards.
  const savedAgain = domainObjects({ ...example, buildSteps: 5 });
  const later = encode(assembleBuild(emptyTransfer, savedAgain.build), 1);
  expect(JSON.parse(text).panels.builds[0].cells[0].value).toBe(4);
  expect(JSON.parse(later).panels.builds[0].cells[0].value).toBe(5);
});

it('encodes once and lets the page read a version it knows, resolving links inside the document', () => {
  const steps = dataTransferRun(example);
  expect(steps.map(({ operation }) => operation.kind)).toEqual([
    'start',
    'assemble',
    'assemble',
    'assemble',
    'encode',
    'decode',
  ]);
  expect(steps.slice(0, 4).every(({ text }) => text === null)).toBe(true);
  const last = steps[steps.length - 1];
  expect(steps[4].text).toBe(last.text);
  expect(last.decoded).toEqual({
    read: true,
    sent: 1,
    view: {
      cells: { 'definition-1': 1, 'build-1': 1 },
      targets: { 'definition-1': 'actors', 'build-1': 'builds' },
      resolved: ['build-1'],
      dangling: [],
    },
  });
});

it('refuses a version the page does not know, which unchecked would read as missing cells', () => {
  const steps = dataTransferRun({ ...example, serverVersion: 2 });
  const last = steps[steps.length - 1];
  expect(last.decoded).toEqual({ read: false, sent: 2 });
  // Read without the check, version 2's renamed field leaves every row with no cells.
  const unchecked = readUnchecked(last.text ?? '');
  expect(unchecked.cells).toEqual({ 'definition-1': 0, 'build-1': 0 });
  expect(decode(last.text ?? '', 2).read).toBe(true);
});

it('leaves a link dangling when the document did not carry what it names', () => {
  const { actor } = domainObjects(example);
  const alone = encode(assembleActor(emptyTransfer, actor), 1);
  const decoded = decode(alone, 1);
  expect(decoded.read && decoded.view.resolved).toEqual([]);
  expect(decoded.read && decoded.view.dangling).toEqual(['build-1']);
});

it('draws each object where it stands and names every state in the text equivalent', () => {
  const run = model(parameters, studyTranslate);
  const frames = run.states.frames;
  expect(frames).toHaveLength(6);
  const at = (step: number) =>
    Object.fromEntries(frames[step].placements.map(({ object, node }) => [object, node]));
  expect(at(0)).toEqual({ actor: 'domain', build: 'domain', evidence: 'domain' });
  expect(at(2)).toEqual({ actor: 'dto', build: 'dto', evidence: 'domain' });
  expect(at(5)).toEqual({ actor: 'view', build: 'view', evidence: 'view' });
  // One encoding moves all three objects at once: one text carries them.
  expect(frames[4].moves.map(({ object, transition }) => [object, transition])).toEqual([
    ['actor', 'encode'],
    ['build', 'encode'],
    ['evidence', 'encode'],
  ]);
  const bytes = byteLength(dataTransferRun(example)[4].text ?? '');
  expect(bytes).toBe(334);
  expect(fillValues(record.visual.textEquivalent, frames[4].values)).toBe(
    `Step 4: Actor definition, Saved build, Evidence record move from In the DTO to Encoded by encode. Where each object stands: Domain object: none; In the DTO: none; Encoded: Actor definition, Saved build, Evidence record; Page view: none; Refused: none. The text on the wire: ${bytes} bytes, written as uifa-board-v1.`,
  );
  expect(frames[1].placements.find(({ object }) => object === 'actor')?.note).toBe(
    'build and evidence as ids',
  );
  expect(frames[0].worked?.lines[0]).toBe(
    'Encoding the domain objects as they stand: refused, since the build points back at the actor',
  );
  expect(frames[5].note).toBe(
    "The page knows uifa-board-v1 and finds it, so it reads the document into its own view: the actor's link to build-1 resolves, because the build travelled in the same document.",
  );
});

it('draws a refused document as every object leaving for Refused, and names the moments', () => {
  const refused = model({ ...parameters, serverVersion: 2 }, studyTranslate);
  const last = refused.states.frames[refused.states.frames.length - 1];
  expect(last.moves.map(({ to, transition }) => [to, transition])).toEqual([
    ['refused', 'decodeRefused'],
    ['refused', 'decodeRefused'],
    ['refused', 'decodeRefused'],
  ]);
  expect(last.note).toBe(
    'The page knows uifa-board-v1 but the text names uifa-board-v2, so it refuses the whole document rather than misread it.',
  );
  expect(last.placements[0].note).toBe('not read: uifa-board-v2');
  const drawing = registerDrawing(refused.states, refused.states.frames.length - 1);
  expect(drawing.tokens.map(({ key }) => key)).toEqual(['A', 'B', 'E']);
  expect(refused.moments.map(({ label, step }) => [label, step])).toEqual([
    ['Domain objects', 0],
    ['Assembled', 1],
    ['Encoded', 4],
    ['Refused', 5],
  ]);
  const run = model(parameters, studyTranslate);
  expect(run.moments[3]).toEqual({ label: 'Decoded', step: 5 });
});

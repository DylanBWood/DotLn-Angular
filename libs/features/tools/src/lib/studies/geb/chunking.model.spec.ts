import { loadModelStudy, studyTranslate } from '../../../../testing/src';
import { numberParameter } from '../parameters';
import { codeBlocks, fillValues } from '../study-text';
import { model } from './chunking.model';
import { guideEvents, runChunking } from './chunking.simulation';

const record = await loadModelStudy('geb2:9', 'relations');
const parameters = record.example.parameters;

it('preserves event order in full and short chunks and reports their combined counts', () => {
  expect(parameters).toEqual({ chunkSize: 2 });
  expect(codeBlocks(record.pseudocode.ordinary)).toHaveLength(record.mechanism.steps.length);
  const run = runChunking(guideEvents, numberParameter(parameters, 'chunkSize'));

  expect(run.chunks).toEqual([
    { members: ['runOpened', 'guideRead'], refusalCount: 0 },
    { members: ['writeRefused', 'linksChecked'], refusalCount: 1 },
    { members: ['gatePassed'], refusalCount: 0 },
  ]);
  expect(run.guideCheck).toEqual({ chunkCount: 3, eventCount: 5, refusalCount: 1 });
});

it('handles empty, exact and oversized groups and counts repeated refusals', () => {
  const empty = runChunking([], 2);
  expect(empty.chunks).toEqual([]);
  expect(empty.guideCheck).toEqual({ chunkCount: 0, eventCount: 0, refusalCount: 0 });
  expect(runChunking(guideEvents, guideEvents.length + 1).chunks).toEqual([
    { members: guideEvents, refusalCount: 1 },
  ]);
  const exact = runChunking(['writeRefused', 'writeRefused', 'linksChecked', 'gatePassed'], 2);
  expect(exact.chunks.map(({ members }) => members.length)).toEqual([2, 2]);
  expect(exact.guideCheck).toEqual({ chunkCount: 2, eventCount: 4, refusalCount: 2 });
});

it('rejects widths other than positive safe integers', () => {
  for (const width of [0, -1, 1.5, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    expect(() => runChunking(guideEvents, width)).toThrow(RangeError);
  }
});

it('draws the chunks from the run, with the refusal in its own group and the final total', () => {
  const { relations } = model(parameters, studyTranslate);
  const frames = relations.frames;

  expect(relations.nodes.map(({ label }) => label)).toEqual([
    'Guide events',
    'Chunk 1',
    'Chunk 2',
    'Chunk 3',
    'Guide check',
  ]);
  const [input, first, second, third, summary] = relations.nodes;
  expect(first.x).toBe(second.x);
  expect(second.x).toBe(third.x);
  expect(input.x + relations.nodeWidth).toBeLessThan(first.x);
  expect(first.x + relations.nodeWidth).toBeLessThan(summary.x);
  expect(input.y).toBe(second.y);
  expect(summary.y).toBe(second.y);
  expect(relations.edges).toContainEqual(
    expect.objectContaining({
      from: 'chunk-2',
      to: 'guide-check',
      label: 'contributes to',
    }),
  );
  expect(frames[2].values).toMatchObject({ focus: 'Chunk 2', refusalCount: '1', eventCount: '2' });
  expect(frames[2].note).toContain('Write refused');
  expect(frames[3].note).toBe(
    'The recording ends before this chunk fills. It holds Gate passed. Its refused writes total 0.',
  );
  expect(fillValues(record.visual.textEquivalent, frames[4].values)).toBe(
    'Guide check. Chunks total 3, events total 5, and refused writes total 1.',
  );
});

it('regroups the same events when the displayed chunk size changes', () => {
  const { relations } = model({ ...parameters, chunkSize: 3 }, studyTranslate);
  expect(relations.nodes.map(({ label }) => label)).toEqual([
    'Guide events',
    'Chunk 1',
    'Chunk 2',
    'Guide check',
  ]);
  expect(relations.frames.map(({ values }) => values['chunkSize'])).toEqual(['3', '3', '3', '3']);
  expect(relations.frames[1].note).toContain('Write refused');
  expect(relations.frames[2].note).toContain('Links checked');
  expect(relations.frames[3].note).toBe(
    'Chunks total 2, events total 5, and refused writes total 1.',
  );
});

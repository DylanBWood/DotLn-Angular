import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import { assertScrubbed } from '../scrub-board-fixture.mjs';
import { isMain, workspaceRoot } from '../source-files.mjs';

export const dataDirectory = resolve(workspaceRoot, 'libs/shared/catalog/src/data');
export const batches = {
  'aifg-a': { work: 'aifg', files: { 'ai-for-games-3e-part-a.jsonl': 'aifg-a' } },
  'aifg-b': { work: 'aifg', files: { 'ai-for-games-3e-part-b.jsonl': 'aifg-b' } },
  eip: { work: 'eip', files: { 'enterprise-integration-patterns.jsonl': 'eip' } },
  poeaa: { work: 'poeaa', files: { 'poeaa.jsonl': 'poeaa' } },
  'rxjs-core': { work: 'rxjs', files: { 'rxjs-core.jsonl': 'rxc' } },
  'rxjs-patterns': { work: 'rxjs', files: { 'rxjs-patterns.jsonl': 'rxp' } },
  geb: { work: 'geb', files: { 'geb-map-part-1.jsonl': 'geb1', 'geb-map-part-2.jsonl': 'geb2' } },
  tt: {
    work: 'tt',
    files: { 'map-part-1.jsonl': 'tt1', 'map-part-2.jsonl': 'tt2', 'map-part-3.jsonl': 'tt3' },
  },
};

const schema = JSON.parse(
  readFileSync(
    resolve(workspaceRoot, 'libs/shared/catalog/src/schema/tool-v0.schema.json'),
    'utf8',
  ),
);
const ajv = new Ajv2020({ allErrors: true, allowUnionTypes: true });
export const validateTool = ajv.compile(schema);
const validateCheckpointShape = ajv.compile({ $ref: `${schema.$id}#/$defs/checkpoint` });
const canonical = (value) =>
  Array.isArray(value)
    ? value.map(canonical)
    : value && typeof value === 'object'
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .map((key) => [key, canonical(value[key])]),
        )
      : value;
const equal = (a, b) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
const sameKeys = (a, b) => equal(Object.keys(a).sort(), [...b].sort());

// Only schema-owned path segments are printable; unknown input keys may be private.
const pointerKeys = new Set([
  'schema',
  'batch',
  'maps',
  'tools',
  'id',
  'work',
  'title',
  'rowType',
  'kind',
  'status',
  'classifiedBy',
  'provenance',
  'map',
  'file',
  'line',
  'sha256',
  'rows',
  'faces',
  'scene',
  'selection',
  'target',
  'min',
  'max',
  'transform',
  'params',
  'name',
  'unit',
  'default',
  'reason',
  'observable',
  'toyMetric',
  'analog',
  'roles',
  'clause',
]);
const safePointer = (pointer) =>
  pointer
    .split('/')
    .map((part) =>
      part === '' || pointerKeys.has(part) || /^\d{1,7}$/.test(part) ? part : '[field]',
    )
    .join('/') || '/';

class CatalogValidationError extends Error {
  constructor(message, pointer = '/', batch = undefined) {
    super(message);
    this.pointer = safePointer(pointer);
    this.batch = Object.hasOwn(batches, batch) ? batch : undefined;
  }
}

export function catalogDiagnostic(error) {
  return error instanceof CatalogValidationError
    ? `${error.batch ? `batch=${error.batch}; ` : ''}at ${error.pointer}: ${error.message}`
    : 'Input read, JSON parse or output operation failed.';
}

function scrub(value) {
  try {
    assertScrubbed(value);
  } catch (error) {
    const pointer = / at (\/.*)$/s.exec(error.message)?.[1] ?? '/';
    throw new CatalogValidationError('scrub rejected a private path', pointer, value?.batch);
  }
}

const fail = (condition, message) => {
  if (!condition) throw new CatalogValidationError(message);
};

export function checkCheckpoint(checkpoint) {
  scrub(checkpoint);
  if (!validateCheckpointShape(checkpoint)) {
    const error = validateCheckpointShape.errors[0];
    throw new CatalogValidationError(
      `schema ${error.keyword}`,
      error.instancePath,
      checkpoint?.batch,
    );
  }
  const batch = batches[checkpoint.batch];
  fail(batch, 'Unknown classifier batch.');
  fail(
    equal(checkpoint.maps.map(({ file }) => file).sort(), Object.keys(batch.files).sort()),
    'Batch map inventory differs.',
  );
  const maps = new Map(checkpoint.maps.map((map) => [map.file, map]));
  const ids = new Set();
  const lines = new Map(checkpoint.maps.map(({ file }) => [file, new Set()]));
  for (const tool of checkpoint.tools) {
    fail(!ids.has(tool.id), 'Duplicate tool id.');
    ids.add(tool.id);
    fail(tool.work === batch.work, 'Tool work differs from its batch.');
    fail(
      tool.classifiedBy === `classifier-${checkpoint.batch}`,
      'Classifier label differs from its batch.',
    );
    if (tool.provenance === 'map') {
      const map = maps.get(tool.map.file);
      fail(map && tool.map.sha256 === map.sha256, 'Tool map digest differs.');
      fail(
        tool.map.line <= map.rows && tool.id === `${batch.files[map.file]}:${tool.map.line}`,
        'Tool id or source line differs.',
      );
      fail(!lines.get(map.file).has(tool.map.line), 'Duplicate source line.');
      lines.get(map.file).add(tool.map.line);
    }
    if (tool.faces) {
      const { selection, transform } = tool.faces;
      fail(
        selection.max === null || selection.min <= selection.max,
        'Selection range is inverted.',
      );
      if (tool.status === 'typed') {
        const names = new Set();
        for (const param of transform.params) {
          fail(!names.has(param.name), 'Duplicate transform parameter.');
          names.add(param.name);
          fail(
            param.min <= param.default && param.default <= param.max,
            'Parameter default is outside its range.',
          );
        }
      }
    }
  }
  for (const map of checkpoint.maps)
    fail(lines.get(map.file).size === map.rows, 'Source line coverage is incomplete.');
  return checkpoint;
}

export function readCheckpoints(directory = dataDirectory, partial = false) {
  // Hidden files such as the Finder's .DS_Store are not catalog data.
  const names = readdirSync(directory).filter((name) => !name.startsWith('.'));
  const expected = Object.keys(batches).map((batch) => `tools-${batch}.json`);
  fail(
    names.every((name) => name === 'catalog-summary.json' || expected.includes(name)),
    'Unexpected catalog data file.',
  );
  if (!partial)
    fail(
      expected.every((name) => names.includes(name)),
      'Catalog checkpoint is missing.',
    );
  const checkpoints = expected
    .filter((name) => names.includes(name))
    .map((name) => {
      const checkpoint = checkCheckpoint(
        JSON.parse(readFileSync(resolve(directory, name), 'utf8')),
      );
      fail(
        name === `tools-${checkpoint.batch}.json`,
        'Checkpoint filename differs from its batch.',
      );
      return checkpoint;
    });
  fail(checkpoints.length > 0, 'No catalog checkpoints.');
  const ids = checkpoints.flatMap(({ tools }) => tools.map(({ id }) => id));
  fail(new Set(ids).size === ids.length, 'Duplicate tool id across checkpoints.');
  return checkpoints;
}

export function catalogCounts(checkpoints) {
  const count = (values) =>
    Object.fromEntries(
      [...new Set(values)]
        .sort()
        .map((value) => [value, values.filter((item) => item === value).length]),
    );
  const tools = checkpoints.flatMap((checkpoint) => checkpoint.tools);
  return {
    work: count(tools.map((tool) => tool.work)),
    kind: count(tools.map((tool) => tool.kind)),
    transformKind: count(
      tools.filter((tool) => tool.status === 'typed').map((tool) => tool.faces.transform.kind),
    ),
    status: count(tools.map((tool) => tool.status)),
  };
}

export function checkSummary(summary, checkpoints) {
  scrub(summary);
  fail(
    sameKeys(summary, [
      'schema',
      'date',
      'mappedRows',
      'totalRows',
      'maps',
      'counts',
      'works',
      'workers',
    ]),
    'Summary fields differ.',
  );
  fail(
    summary.schema === 'catalog-summary-v0' && /^\d{4}-\d{2}-\d{2}$/.test(summary.date),
    'Summary version or date invalid.',
  );
  const maps = checkpoints
    .flatMap((checkpoint) => checkpoint.maps)
    .sort((a, b) => a.file.localeCompare(b.file));
  fail(equal(summary.maps, maps), 'Summary map inventory differs.');
  const tools = checkpoints.flatMap((checkpoint) => checkpoint.tools);
  const mappedRows = tools.filter((tool) => tool.provenance === 'map').length;
  fail(
    mappedRows === maps.reduce((sum, map) => sum + map.rows, 0) && mappedRows === 3463,
    'Mapped row total differs from the recorded 3463.',
  );
  fail(
    summary.mappedRows === mappedRows && summary.totalRows === tools.length,
    'Summary totals differ.',
  );
  fail(equal(summary.counts, catalogCounts(checkpoints)), 'Summary counts differ.');
  fail(
    Array.isArray(summary.works) && summary.works.length === 6,
    'Summary must contain six works.',
  );
  const workIds = new Set();
  for (const work of summary.works) {
    fail(
      sameKeys(work, ['work', 'sceneType', 'firstThree', 'typedShortfall']),
      'Summary work fields differ.',
    );
    fail(
      !workIds.has(work.work) && Object.hasOwn(summary.counts.work, work.work),
      'Summary work inventory differs.',
    );
    workIds.add(work.work);
    fail(
      schema.$defs.faces.properties.scene.items.enum.includes(work.sceneType),
      'Unknown summary scene type.',
    );
    fail(
      Array.isArray(work.firstThree) &&
        new Set(work.firstThree).size === work.firstThree.length &&
        work.firstThree.length <= 3,
      'Invalid first-three list.',
    );
    const typed = tools.filter((tool) => tool.work === work.work && tool.status === 'typed');
    fail(
      work.firstThree.length === Math.min(3, typed.length) &&
        work.typedShortfall === Math.max(0, 3 - typed.length),
      'Summary shortfall differs.',
    );
    fail(
      work.firstThree.every((id) => typed.some((tool) => tool.id === id)),
      'First-three tool is not typed in its work.',
    );
  }
  fail(
    sameKeys(summary.workers, ['classifiers', 'checkers', 'synthesizer', 'critic']),
    'Summary worker fields differ.',
  );
  fail(
    equal(
      [...summary.workers.classifiers].sort(),
      Object.keys(batches)
        .map((batch) => `classifier-${batch}`)
        .sort(),
    ),
    'Classifier labels differ.',
  );
  fail(
    equal(summary.workers.checkers, ['checker-a', 'checker-b']) &&
      summary.workers.synthesizer === 'synthesizer' &&
      summary.workers.critic === 'critic',
    'Review worker labels differ.',
  );
  return summary;
}

export function checkCatalog(directory = dataDirectory, partial = false) {
  const checkpoints = readCheckpoints(directory, partial);
  if (!partial)
    checkSummary(
      JSON.parse(readFileSync(resolve(directory, 'catalog-summary.json'), 'utf8')),
      checkpoints,
    );
  return checkpoints;
}

if (isMain(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    if (args.length === 1 && args[0] !== '--partial') {
      checkCheckpoint(JSON.parse(readFileSync(resolve(args[0]), 'utf8')));
      console.log('PASS catalog checkpoint: schema, allow-list, provenance and line coverage.');
    } else {
      fail(args.length === 0 || equal(args, ['--partial']), 'Invalid arguments.');
      const checkpoints = checkCatalog(dataDirectory, args.includes('--partial'));
      console.log(
        `PASS catalog${args.includes('--partial') ? ' (partial)' : ''}: ${checkpoints.length} checkpoints, ${checkpoints.reduce((sum, batch) => sum + batch.tools.length, 0)} tools; schema, allow-list, provenance and counts.`,
      );
    }
  } catch (error) {
    console.error(
      `FAIL catalog validation: ${catalogDiagnostic(error)} Raw values and input paths are withheld.`,
    );
    process.exitCode = 1;
  }
}

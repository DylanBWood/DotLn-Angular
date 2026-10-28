import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import { isMain, workspaceRoot } from '../source-files.mjs';

export const dataDirectory = resolve(workspaceRoot, 'libs/shared/catalog/src/data');
// Each batch names its work, the research run's output folder that holds its maps,
// and the id prefix of every declared map file.
export const batches = {
  'aifg-a': {
    work: 'aifg',
    folder: 'maps',
    files: { 'ai-for-games-3e-part-a.jsonl': 'aifg-a' },
  },
  'aifg-b': {
    work: 'aifg',
    folder: 'maps',
    files: { 'ai-for-games-3e-part-b.jsonl': 'aifg-b' },
  },
  eip: { work: 'eip', folder: 'maps', files: { 'enterprise-integration-patterns.jsonl': 'eip' } },
  poeaa: { work: 'poeaa', folder: 'maps', files: { 'poeaa.jsonl': 'poeaa' } },
  'rxjs-core': { work: 'rxjs', folder: 'maps', files: { 'rxjs-core.jsonl': 'rxc' } },
  'rxjs-patterns': { work: 'rxjs', folder: 'maps', files: { 'rxjs-patterns.jsonl': 'rxp' } },
  geb: {
    work: 'geb',
    folder: 'geb',
    files: { 'geb-map-part-1.jsonl': 'geb1', 'geb-map-part-2.jsonl': 'geb2' },
  },
  tt: {
    work: 'tt',
    folder: 'tt',
    files: { 'map-part-1.jsonl': 'tt1', 'map-part-2.jsonl': 'tt2', 'map-part-3.jsonl': 'tt3' },
  },
};

/**
 * The run's verification note decides how a reading is marked. A note is partial only
 * when it says "partial" as a word, so a URL such as `.../PartialObserver` stays sourced.
 */
export function verificationKind(note) {
  if (/(?:^|[\s(])partial\b/i.test(note)) return 'partial';
  return /^(model-knowledge|MK)\b/i.test(note) ? 'model-knowledge' : 'sourced';
}

const schema = JSON.parse(
  readFileSync(
    resolve(workspaceRoot, 'libs/shared/catalog/src/schema/tool-v1.schema.json'),
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
  'definition',
  'place',
  'part',
  'chapter',
  'section',
  'subsection',
  'related',
  'hooks',
  'domain',
  'verified',
  'note',
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

const fail = (condition, message) => {
  if (!condition) throw new CatalogValidationError(message);
};

export function checkCheckpoint(checkpoint) {
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
      fail(
        tool.verified.kind === verificationKind(tool.verified.note),
        'Verification kind differs from its note.',
      );
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
  if (!partial) {
    const byId = new Map(checkpoints.flatMap(({ tools }) => tools.map((tool) => [tool.id, tool])));
    for (const { tools } of checkpoints)
      for (const tool of tools)
        for (const relation of tool.related) {
          fail(
            relation.id === null || byId.get(relation.id)?.work === tool.work,
            'Relation target is missing or belongs to another work.',
          );
          fail(relation.id !== tool.id, 'Relation links a concept to itself.');
        }
  }
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

export const sceneTransformKinds = [
  'steer.blend',
  'steer.priority',
  'formation.twoLevel',
  'formation.fixed',
  'objective.set',
];

export function summarizeWork(tools, work, sceneType, typedShortfall) {
  const rows = tools.filter((tool) => tool.work === work);
  const chapters = new Map();
  for (const tool of rows) {
    const key = JSON.stringify([tool.place.part ?? '', tool.place.chapter]);
    const chapter = chapters.get(key) ?? {
      part: tool.place.part ?? '',
      title: tool.place.chapter,
      count: 0,
    };
    chapter.count++;
    chapters.set(key, chapter);
  }
  return {
    work,
    sceneType,
    typedShortfall,
    chapters: [...chapters.values()],
    sceneTools: rows
      .filter(
        (tool) =>
          tool.status === 'typed' && sceneTransformKinds.includes(tool.faces.transform.kind),
      )
      .map((tool) => tool.id),
  };
}

// The summary's date is the UTC day it was last written from the checkpoints.
export function createSummary(checkpoints, previous) {
  const tools = checkpoints.flatMap((checkpoint) => checkpoint.tools);
  return {
    ...previous,
    schema: 'catalog-summary-v1',
    date: new Date().toISOString().slice(0, 10),
    mappedRows: tools.filter((tool) => tool.provenance === 'map').length,
    totalRows: tools.length,
    maps: checkpoints
      .flatMap((checkpoint) => checkpoint.maps)
      .sort((a, b) => a.file.localeCompare(b.file)),
    counts: catalogCounts(checkpoints),
    works: previous.works.map((work) =>
      summarizeWork(tools, work.work, work.sceneType, work.typedShortfall),
    ),
  };
}

export function checkSummary(summary, checkpoints) {
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
    summary.schema === 'catalog-summary-v1' && /^\d{4}-\d{2}-\d{2}$/.test(summary.date),
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
      equal(work, summarizeWork(tools, work.work, work.sceneType, work.typedShortfall)),
      'Summary work contents differ.',
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
    fail(work.typedShortfall === (work.work === 'tt' ? 1 : 0), 'Historical shortfall differs.');
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
      console.log('PASS catalog checkpoint: schema, provenance and line coverage.');
    } else {
      fail(args.length === 0 || equal(args, ['--partial']), 'Invalid arguments.');
      const checkpoints = checkCatalog(dataDirectory, args.includes('--partial'));
      console.log(
        `PASS catalog${args.includes('--partial') ? ' (partial)' : ''}: ${checkpoints.length} checkpoints, ${checkpoints.reduce((sum, batch) => sum + batch.tools.length, 0)} tools; schema, provenance and counts.`,
      );
    }
  } catch (error) {
    console.error(
      `FAIL catalog validation: ${catalogDiagnostic(error)} Raw values and input paths are withheld.`,
    );
    process.exitCode = 1;
  }
}

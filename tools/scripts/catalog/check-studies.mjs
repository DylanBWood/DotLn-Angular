import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import ts from 'typescript';
import { isMain, workspaceRoot } from '../source-files.mjs';
import { dataDirectory, readCheckpoints } from './check-catalog.mjs';

export const studiesDirectory = resolve(workspaceRoot, 'libs/shared/catalog/src/studies');

const schema = JSON.parse(
  readFileSync(
    resolve(workspaceRoot, 'libs/shared/catalog/src/schema/concept-study-v0.schema.json'),
    'utf8',
  ),
);
const validate = new Ajv2020({ allErrors: true, allowUnionTypes: true }).compile(schema);

/** How many reviewers a checked record names: at least the two critics of its batch. */
const requiredReviewers = 2;

/** The blank-line-separated blocks of a pseudocode text, which match the mechanism's steps. */
export const codeBlocks = (code) =>
  code
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

const withoutCast = (expression) =>
  ts.isAsExpression(expression) || ts.isSatisfiesExpression(expression)
    ? withoutCast(expression.expression)
    : expression;

/** The paths of the JSON files a chunk imports, by name, and the names its default export lists. */
export function chunkContents(text) {
  const source = ts.createSourceFile('chunk.ts', text, ts.ScriptTarget.Latest);
  const imports = new Map();
  let exported = [];
  // Read from the syntax, so a commented-out line can stand for neither.
  for (const statement of source.statements) {
    if (ts.isImportDeclaration(statement)) {
      const { importClause: clause, moduleSpecifier: path } = statement;
      // A type-only import is erased, so it brings no record into the chunk.
      if (clause?.name && !clause.isTypeOnly && path.text.endsWith('.json'))
        imports.set(clause.name.text, path.text);
    } else if (ts.isExportAssignment(statement)) {
      const list = withoutCast(statement.expression);
      if (ts.isArrayLiteralExpression(list))
        exported = list.elements.map((element) => element.getText(source));
    }
  }
  return { imports, exported };
}

/** Everything wrong with one record, as messages that name a part of it and no value of it. */
export function studyProblems(study, tools, root = workspaceRoot) {
  if (!validate(study)) {
    const { instancePath, keyword, params } = validate.errors[0];
    const missing = params?.missingProperty ? ` ${params.missingProperty}` : '';
    return [`at ${instancePath || '/'}: schema ${keyword}${missing}`];
  }
  const problems = [];
  const tool = tools.get(study.id);
  if (!tool) problems.push('its id is not in the catalog');
  else if (tool.work !== study.work) problems.push("its work differs from the catalog row's");
  for (const { id } of study.nearby)
    if (!tools.has(id)) problems.push(`nearby id ${id} is not in the catalog`);
    else if (id === study.id) problems.push('a nearby concept names the study itself');
  const steps = study.mechanism.steps.length;
  const blocks = codeBlocks(study.pseudocode.ordinary).length;
  if (steps !== blocks)
    problems.push(`${steps} mechanism steps against ${blocks} blocks of ordinary pseudocode`);
  for (const path of [study.visual?.model, study.pseudocode.executable?.module]) {
    if (!path) continue;
    if (!existsSync(resolve(root, path))) problems.push(`${path} does not exist`);
    if (!existsSync(resolve(root, path.replace(/\.ts$/, '.spec.ts'))))
      problems.push(`${path} has no spec beside it`);
  }
  problems.push(...rxjsProblems(study, root));
  if (study.authored.state !== 'checked') problems.push('it is a draft, which never ships');
  else if (new Set(study.authored.reviewedBy).size < requiredReviewers)
    problems.push(`it names fewer than ${requiredReviewers} reviewers`);
  return problems;
}

/** Code with its whitespace and trailing commas gone, so a formatter's choices do not count. */
export const squeezedCode = (code) => code.replace(/\s+/g, '').replace(/,(?=[)\]}])/g, '');

/** A module's source without its comments, so a comment cannot stand in for the code that runs. */
export const withoutComments = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

/** A reading that runs nowhere says so, with its reason, at the top of its code. */
const illustrativeMark = /^\/\/ Illustrative: \S/;

/**
 * The rules of an RxJS reading. An executable reading's code is in the module its spec runs, and
 * a marble drawing reads that same module; in the RxJS work a reading either runs or is marked
 * illustrative with its reason, since every operator there could run.
 */
function rxjsProblems(study, root) {
  const problems = [];
  const { rxjs, executable } = study.pseudocode;
  const runs = executable?.kind === 'rxjs';
  if (runs) {
    if (rxjs === null) problems.push('its executable RxJS reading has no code to show');
    else {
      const path = resolve(root, executable.module);
      if (
        existsSync(path) &&
        !squeezedCode(withoutComments(readFileSync(path, 'utf8'))).includes(
          squeezedCode(withoutComments(rxjs)),
        )
      )
        problems.push('its RxJS code is not in its executable module');
      // The spec beside the module runs the example through the family's helper, which asserts
      // the strings the drawing reads.
      const spec = path.replace(/\.ts$/, '.spec.ts');
      if (
        existsSync(spec) &&
        !withoutComments(readFileSync(spec, 'utf8')).includes('expectMarbleExample(')
      )
        problems.push('its spec does not run the example through expectMarbleExample');
    }
  }
  if (study.visual?.family === 'marbles' && study.visual.model !== executable?.module)
    problems.push('its marbles drawing does not read its executable module');
  if (study.work === 'rxjs' && !runs && !(rxjs === null || illustrativeMark.test(rxjs)))
    problems.push('its RxJS reading neither runs nor is marked illustrative with a reason');
  return problems;
}

/** A record, or null for a file that does not parse, which the schema then refuses. */
function readRecord(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

/** Every record under a work's directory, in file order, with the path it came from. */
export function readStudies(directory = studiesDirectory) {
  const works = readdirSync(directory, { withFileTypes: true }).filter((entry) =>
    entry.isDirectory(),
  );
  return works.flatMap(({ name }) =>
    readdirSync(resolve(directory, name))
      .filter((file) => file.endsWith('.json'))
      .sort()
      .map((file) => {
        const path = resolve(directory, name, file);
        return { path, directory: name, file, study: readRecord(path) };
      }),
  );
}

export function createSummary(records) {
  const byWork = new Map();
  for (const { study } of records)
    byWork.set(study.work, [
      ...(byWork.get(study.work) ?? []),
      { id: study.id, state: study.authored.state },
    ]);
  return {
    schema: 'studies-summary-v0',
    works: [...byWork]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([work, studies]) => ({
        work,
        studies: studies.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true })),
      })),
  };
}

/** The filing rules a set of records must meet together, beyond each record's own. */
export function collectionProblems(records, directory = studiesDirectory) {
  const problems = [];
  const seen = new Map();
  for (const { study, directory: folder, file, path } of records) {
    const name = relative(workspaceRoot, path);
    if (folder !== study.work) problems.push(`${name}: its folder differs from its work`);
    if (file !== `${study.slug}.json`)
      problems.push(`${name}: its file name differs from its slug`);
    const slug = `${study.work}/${study.slug}`;
    if (seen.has(slug)) problems.push(`${name}: its slug repeats within its work`);
    seen.set(slug, name);
  }
  const ids = records.map(({ study }) => study.id);
  if (new Set(ids).size !== ids.length) problems.push('two records study one concept');
  // A work's chunk lists its records by hand, so a record it misses would never load.
  for (const work of new Set(records.map(({ study }) => study.work))) {
    const index = resolve(directory, `${work}.ts`);
    if (!existsSync(index)) {
      problems.push(`${work}: it has no chunk listing its records`);
      continue;
    }
    const { imports, exported } = chunkContents(readFileSync(index, 'utf8'));
    const listed = [...imports.values()].sort();
    if (JSON.stringify([...imports.keys()].sort()) !== JSON.stringify(exported.sort()))
      problems.push(`${work}: its chunk's export differs from its imports`);
    const files = records
      .filter(({ study }) => study.work === work)
      .map(({ file }) => `./${work}/${file}`)
      .sort();
    if (JSON.stringify(listed) !== JSON.stringify(files))
      problems.push(`${work}: its chunk's list differs from its records`);
  }
  return problems;
}

const catalogTools = () =>
  new Map(
    readCheckpoints(dataDirectory).flatMap(({ tools }) => tools.map((tool) => [tool.id, tool])),
  );

export function checkStudies({ write = false, directory = studiesDirectory } = {}) {
  const tools = catalogTools();
  const records = readStudies(directory);
  const problems = records.flatMap(({ path, study }) =>
    studyProblems(study, tools).map((problem) => `${relative(workspaceRoot, path)}: ${problem}`),
  );
  // A record the schema refuses has no shape to count, so nothing below may read it.
  if (records.some(({ study }) => !validate(study))) return { records, problems };
  problems.push(...collectionProblems(records, directory));
  const summary = `${JSON.stringify(createSummary(records), null, 2)}\n`;
  const path = resolve(directory, 'studies-summary.json');
  if (write) writeFileSync(path, summary);
  else if (!existsSync(path) || readFileSync(path, 'utf8') !== summary)
    problems.push('studies-summary.json is stale; run this check with --write-summary');
  return { records, problems };
}

/** Per work, the rows that carry a record, those checked, and all the work's rows. */
export function coverage(records, tools) {
  const rows = new Map();
  for (const tool of tools.values()) rows.set(tool.work, (rows.get(tool.work) ?? 0) + 1);
  return [...rows].map(([work, total]) => {
    const studies = records.filter(({ study }) => study.work === work);
    return {
      work,
      studied: studies.length,
      checked: studies.filter(({ study }) => study.authored.state === 'checked').length,
      total,
    };
  });
}

/** Every address the records cite, with the slugs that cite it. */
export function citedUrls(records) {
  const cited = new Map();
  for (const { study } of records)
    for (const { url } of [...study.references, ...study.implementations])
      cited.set(url, [...new Set([...(cited.get(url) ?? []), study.slug])]);
  return cited;
}

// Some sites refuse a client that does not look like a browser.
const browserAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
const linkTimeoutMs = 20_000;

async function linkStatus(url) {
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      headers: { 'user-agent': browserAgent },
      signal: AbortSignal.timeout(linkTimeoutMs),
    });
    await response.body?.cancel();
    return String(response.status);
  } catch (error) {
    return `failed: ${error.name}`;
  }
}

/** Opens every cited address once and prints its status. The gates never reach the network. */
async function reportLinks() {
  const cited = citedUrls(readStudies());
  for (const [url, slugs] of cited)
    console.log(`${await linkStatus(url)}\t${url}\t${slugs.join(', ')}`);
}

function main(argv) {
  if (argv.includes('--links')) return reportLinks();
  const report = argv.includes('--report');
  const write = argv.includes('--write-summary');
  const paths = argv.filter((argument) => !argument.startsWith('--'));
  if (report) {
    for (const row of coverage(readStudies(), catalogTools()))
      console.log(`${row.work}: ${row.studied} studied, ${row.checked} checked, ${row.total} rows`);
    return;
  }
  // A named file is checked alone, as the negative fixtures are. One that does not parse is read
  // as null, which the schema then refuses, so it is reported like any other problem.
  if (paths.length) {
    const tools = catalogTools();
    const problems = paths.flatMap((path) =>
      studyProblems(readRecord(resolve(path)), tools).map((problem) => `${path}: ${problem}`),
    );
    for (const problem of problems) console.error(`FAIL check-studies: ${problem}`);
    process.exitCode = problems.length ? 1 : 0;
    return;
  }
  const { records, problems } = checkStudies({ write });
  for (const problem of problems) console.error(`FAIL check-studies: ${problem}`);
  console.log(`check-studies: ${records.length} records; ${problems.length} problems`);
  process.exitCode = problems.length ? 1 : 0;
}

if (isMain(import.meta.url)) main(process.argv.slice(2));

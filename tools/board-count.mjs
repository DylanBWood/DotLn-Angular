import { execFileSync } from 'node:child_process';
import { lstatSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const workspaceRoot = fileURLToPath(new URL('../', import.meta.url));
const scriptExtensions = new Set(['.ts', '.mts', '.mjs', '.js']);

/** @param {string} source JavaScript or TypeScript text. @returns {Set<number>} Comment offsets. */
function scriptComments(source) {
  const starts = new Set();
  const file = ts.createSourceFile('source.ts', source, ts.ScriptTarget.Latest, true);
  const visit = (node) => {
    for (const range of ts.getLeadingCommentRanges(source, node.pos) ?? []) {
      starts.add(range.pos);
    }
    // Token children include closing delimiters, where an empty block's
    // comments and comments after its last statement are leading trivia.
    for (const child of node.getChildren(file)) visit(child);
  };
  visit(file);
  return starts;
}

/**
 * @param {string} source HTML or Sass text.
 * @param {string} extension Its dotted extension, which selects the comment syntax.
 * @returns {Set<number>} Comment offsets outside quoted values and HTML raw text.
 */
function textComments(source, extension) {
  // Consume quoted values before comments, so a marker inside one stays text.
  const tokens =
    extension === '.html'
      ? /<(script|style|textarea|title|xmp|iframe|noembed|noframes)(?=[\s/>])[^>"']*(?:(?:"[^"]*"|'[^']*')[^>"']*)*>[\s\S]*?(?:<\/\1\s*>|$)|<!--[\s\S]*?(?:-->|$)|<[^>"']*(?:(?:"[^"]*"|'[^']*')[^>"']*)*>/gi
      : /"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'|\/\*[\s\S]*?(?:\*\/|$)|\/\/[^\r\n]*/g;
  return new Set(
    [...source.matchAll(tokens)]
      .filter(([token]) => /^(?:<!--|\/\/|\/\*)/.test(token))
      .map((match) => match.index),
  );
}

/** @param {string} source YAML text. @returns {Set<number>} Comments outside scalars. */
function yamlComments(source) {
  const starts = new Set();
  let blockIndent = null;
  let quote = null;
  let flowDepth = 0;
  let offset = 0;
  for (const line of source.split('\n')) {
    const indent = line.search(/\S/);
    if (blockIndent !== null && (indent < 0 || indent > blockIndent)) {
      offset += line.length + 1;
      continue;
    }
    blockIndent = null;
    let scalarStart = !quote;
    let quotedScalar = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (quote) {
        if (quote === '"' && char === '\\') i++;
        else if (quote === "'" && char === "'" && line[i + 1] === "'") i++;
        else if (char === quote) {
          quote = null;
          quotedScalar = true;
        }
      } else if (char === '#' && (i === 0 || /\s/.test(line[i - 1]))) {
        starts.add(offset + i);
        break;
      } else if ((char === '"' || char === "'") && scalarStart) {
        quote = char;
        scalarStart = false;
      } else if (
        /[|>]/.test(char) &&
        /(?:^|[:\-?]\s+)\s*$/.test(line.slice(0, i)) &&
        /^[|>][\d+-]*\s*(?:#.*)?$/.test(line.slice(i))
      ) {
        blockIndent = indent;
        break;
      } else if ((char === '[' || char === '{') && scalarStart) {
        flowDepth++;
      } else if ((char === ']' || char === '}') && flowDepth) {
        flowDepth--;
        scalarStart = false;
      } else if (
        (char === ':' &&
          (i + 1 === line.length || /\s/.test(line[i + 1]) || (flowDepth && quotedScalar))) ||
        (char === ',' && flowDepth) ||
        ((char === '-' || char === '?') && scalarStart && /\s/.test(line[i + 1] ?? ''))
      ) {
        scalarStart = true;
        quotedScalar = false;
      } else if (/\S/.test(char)) {
        scalarStart = false;
        quotedScalar = false;
      }
    }
    offset += line.length + 1;
  }
  return starts;
}

/**
 * @param {string} path Workspace-relative filename.
 * @param {string} source The file's text.
 * @returns {{path: string, line: number, text: string}[]} Standalone boarded comments.
 */
export function boardMarkers(path, source) {
  const extension = extname(path);
  const starts = scriptExtensions.has(extension)
    ? scriptComments(source)
    : ['.scss', '.html'].includes(extension)
      ? textComments(source, extension)
      : ['.yml', '.yaml'].includes(extension)
        ? yamlComments(source)
        : new Set();
  const markers = [];
  let offset = 0;
  for (const [index, line] of source.split('\n').entries()) {
    const first = line.search(/\S/);
    if (
      starts.has(offset + first) &&
      /^(?:\/\/|\/\*|<!--|#)[\t ]*BOARDED:/.test(line.slice(first))
    ) {
      markers.push({ path, line: index + 1, text: line.trim() });
    }
    offset += line.length + 1;
  }
  return markers;
}

/**
 * @param {string} root Workspace to read, without following untracked files or symlinks.
 * @returns {{path: string, line: number, text: string}[]} Tracked source's boarded comments.
 */
export function countBoards(root = workspaceRoot) {
  const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' });
  return tracked
    .split('\0')
    .filter(Boolean)
    .flatMap((path) => {
      if (path.startsWith('docs/') || path.split('/').includes('node_modules')) return [];
      if (!/\.(?:ts|mts|mjs|js|scss|html|yml|yaml)$/.test(path)) return [];
      const absolute = join(root, path);
      if (!lstatSync(absolute, { throwIfNoEntry: false })?.isFile()) return [];
      return boardMarkers(path, readFileSync(absolute, 'utf8'));
    });
}

if (import.meta.main) {
  const markers = countBoards();
  for (const { path, line, text } of markers) console.log(`${path}:${line}: ${text}`);
  console.log(`Board count: ${markers.length}`);
}

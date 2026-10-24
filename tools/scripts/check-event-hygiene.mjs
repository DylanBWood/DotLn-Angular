import { relative } from 'node:path';
import ts from 'typescript';
import {
  isMain,
  location,
  property,
  readSource,
  sourceFiles,
  visitTs,
  workspaceRoot,
} from './source-files.mjs';

const flows = new Set([
  'ui:data-access',
  'ui:navigation',
  'ui:app',
  'data-access:navigation',
  'data-access:app',
  'app:navigation',
]);
function declarationGroups() {
  const groups = new Map();
  for (const path of sourceFiles(['libs/shared/events/src/lib'])) {
    if (path.endsWith('.spec.ts')) continue;
    const source = readSource(path);
    visitTs(source, (node) => {
      if (
        !ts.isVariableDeclaration(node) ||
        !node.initializer ||
        !ts.isCallExpression(node.initializer) ||
        node.initializer.expression.getText(source) !== 'eventGroup'
      )
        return;
      const config = node.initializer.arguments[0];
      const sourceName = property(config, 'source');
      if (!sourceName || !ts.isStringLiteral(sourceName))
        throw new Error(`Missing literal event source: ${location(source, node)}`);
      const tier = /^\[?(UI|Data-access|Navigation|App) /i.exec(sourceName.text)?.[1].toLowerCase();
      if (!tier) throw new Error(`Unknown event tier: ${location(source, node)}`);
      groups.set(node.name.getText(source), tier);
    });
  }
  return groups;
}
export function checkEventHygiene(paths = ['libs', 'apps']) {
  const groups = declarationGroups(),
    findings = [],
    inspected = [];
  let exceptions = 0;
  for (const path of sourceFiles(paths).filter(
    (path) => path.endsWith('.ts') && !path.endsWith('.spec.ts'),
  )) {
    const source = readSource(path),
      text = source.text;
    if (!/\b(dispatch|injectDispatch|Dispatcher|withEventHandlers|withCommand)\b/.test(text))
      continue;
    inspected.push(relative(workspaceRoot, path));
    const aliases = new Map([...groups.keys()].map((name) => [name, name]));
    const dispatchers = new Map();
    visitTs(source, (node) => {
      if (ts.isImportSpecifier(node) && groups.has((node.propertyName ?? node.name).text))
        aliases.set(node.name.text, (node.propertyName ?? node.name).text);
      if (
        (ts.isVariableDeclaration(node) || ts.isPropertyDeclaration(node)) &&
        node.initializer &&
        ts.isCallExpression(node.initializer) &&
        node.initializer.expression.getText(source) === 'injectDispatch'
      ) {
        const group = aliases.get(node.initializer.arguments[0]?.getText(source));
        if (group) dispatchers.set(node.name.getText(source), group);
      }
    });
    function creator(node) {
      if (!node || !ts.isPropertyAccessExpression(node)) return undefined;
      const owner = node.expression.getText(source),
        group = aliases.get(owner) ?? dispatchers.get(owner.replace(/^this\./, ''));
      return group ? { group, event: node.name.text, tier: groups.get(group) } : undefined;
    }
    const exceptionLines = new Set();
    text.split('\n').forEach((line, index) => {
      if (/\/\/\s*hygiene-exception:\s*\S/.test(line)) {
        exceptions++;
        exceptionLines.add(index);
      }
    });
    const reported = new Set();
    function judge(from, to, node) {
      if (!from || !to) return;
      if (
        from.group === to.group &&
        [from.event + 'Success', from.event + 'Failure'].includes(to.event)
      )
        return;
      if (flows.has(`${from.tier}:${to.tier}`)) return;
      const line = source.getLineAndCharacterOfPosition(node.getStart(source)).line;
      if (exceptionLines.has(line) || exceptionLines.has(line - 1)) return;
      const key = `${line}:${from.group}.${from.event}:${to.group}.${to.event}`;
      if (!reported.has(key))
        findings.push(
          `${location(source, node)}: forbidden ${from.tier} -> ${to.tier} mapping (${from.group}.${from.event} -> ${to.group}.${to.event})`,
        );
      reported.add(key);
    }
    function sources(node) {
      const found = [];
      visitTs(node, (child) => {
        if (
          ts.isCallExpression(child) &&
          (child.expression.getText(source) === 'on' ||
            (ts.isPropertyAccessExpression(child.expression) &&
              child.expression.name.text === 'on'))
        ) {
          for (const arg of child.arguments) {
            const value = creator(arg);
            if (value) found.push(value);
          }
        }
      });
      return found;
    }
    visitTs(source, (node) => {
      if (!ts.isCallExpression(node)) return;
      if (
        node.expression.getText(source) === 'withCommand' &&
        node.arguments[0] &&
        ts.isObjectLiteralExpression(node.arguments[0])
      ) {
        const config = node.arguments[0],
          trigger = creator(property(config, 'trigger'));
        for (const field of ['success', 'failure'])
          judge(trigger, creator(property(config, field)), node);
      }
      // Stream scopes keep an unrelated handler in the same file from lending its tier.
      const isStreamScope =
        ts.isPropertyAccessExpression(node.expression) &&
        ['pipe', 'subscribe'].includes(node.expression.name.text);
      const isReducer = node.expression.getText(source) === 'on';
      if (!isStreamScope && !isReducer) return;
      const from = isStreamScope
        ? sources(node.expression.expression)
        : node.arguments.map(creator).filter(Boolean);
      for (const arg of node.arguments)
        visitTs(arg, (child) => {
          if (!ts.isCallExpression(child)) return;
          const to = creator(child.expression);
          if (to) for (const origin of from) judge(origin, to, child);
        });
    });
  }
  return { findings, exceptions, inspected };
}
if (isMain(import.meta.url)) {
  const result = checkEventHygiene(process.argv.length > 2 ? process.argv.slice(2) : undefined);
  result.findings.forEach((finding) => console.error(finding));
  console.log(
    `${result.findings.length ? 'FAIL' : 'PASS'} event hygiene: ${result.exceptions} exceptions; ${result.inspected.length} files inspected`,
  );
  process.exitCode = result.findings.length ? 1 : 0;
}

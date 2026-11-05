import { readdirSync, readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import ts from 'typescript';
import { workspaceRoot } from '../source-files.mjs';
import { atPath, englishMessages, studyMessagePaths } from './study-messages.mjs';

const messageKey = /^study[A-Z][A-Za-z0-9]*\.[\w:.-]+[\w]$/;
const visibleFields = new Set([
  'label',
  'caption',
  'note',
  'title',
  'intro',
  'findings',
  'lines',
  'xLabel',
  'yLabel',
  'unit',
  'textEquivalent',
  'operator',
  'content',
  'states',
  'notes',
  'valueMessages',
  'errorMessage',
]);

/** Literal presentation fields are keys or translated expressions, never a second prose store. */
export function presentationProblems(text, path = 'study.ts') {
  const source = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true);
  const declarations = new Map();
  const keys = new Set();
  const problems = [];
  const visit = (node, action) => {
    action(node);
    ts.forEachChild(node, (child) => visit(child, action));
  };
  visit(source, (node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer)
      declarations.set(node.name.text, node.initializer);
    if (ts.isStringLiteralLike(node) && messageKey.test(node.text)) keys.add(node.text);
  });
  const inspect = (expression, seen = new Set()) => {
    if (seen.has(expression)) return;
    seen.add(expression);
    if (ts.isStringLiteralLike(expression)) {
      if (expression.text && !messageKey.test(expression.text)) {
        const { line } = source.getLineAndCharacterOfPosition(expression.getStart());
        problems.push(`${path}:${line + 1}: presentation text must use a study message`);
      }
    } else if (ts.isIdentifier(expression)) {
      const value = declarations.get(expression.text);
      if (value) inspect(value, seen);
    } else if (ts.isConditionalExpression(expression)) {
      inspect(expression.whenTrue, seen);
      inspect(expression.whenFalse, seen);
    } else if (ts.isArrayLiteralExpression(expression)) {
      expression.elements.forEach((element) => inspect(element, seen));
    } else if (ts.isObjectLiteralExpression(expression)) {
      const descriptor = expression.properties.some(
        (property) =>
          ts.isPropertyAssignment(property) &&
          property.name.getText(source) === 'key' &&
          ts.isStringLiteralLike(property.initializer) &&
          messageKey.test(property.initializer.text),
      );
      for (const property of expression.properties)
        if (
          ts.isPropertyAssignment(property) &&
          (!descriptor || property.name.getText(source) !== 'params')
        )
          inspect(property.initializer, seen);
    } else if (ts.isTemplateExpression(expression)) {
      const { line } = source.getLineAndCharacterOfPosition(expression.getStart());
      problems.push(`${path}:${line + 1}: presentation templates must be parameterized messages`);
    }
  };
  visit(source, (node) => {
    if (
      ts.isPropertyAssignment(node) &&
      visibleFields.has(node.name.getText(source).replace(/['"]/g, ''))
    ) {
      // Maps of node ids to held symbols are machine identities, even for a node called operator.
      let ancestor = node.parent;
      while (
        ancestor &&
        !(ts.isPropertyAssignment(ancestor) && ancestor.name.getText(source) === 'held')
      )
        ancestor = ancestor.parent;
      if (ancestor) return;
      inspect(node.initializer);
    }
  });
  return { keys, problems: [...new Set(problems)] };
}

function modelSources(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory()
      ? modelSources(path)
      : entry.name.endsWith('.ts') && !/\.spec\.ts$|-testing\.ts$/.test(entry.name)
        ? [path]
        : [];
  });
}

/** The record and the source code are both consumers of the lazily served message catalogs. */
export function checkStudyMessages(root = workspaceRoot) {
  const message = englishMessages(root);
  const problems = [];
  const keys = new Set();
  const studies = resolve(root, 'libs/shared/catalog/src/studies');
  for (const work of readdirSync(studies, { withFileTypes: true }).filter((entry) =>
    entry.isDirectory(),
  )) {
    for (const file of readdirSync(resolve(studies, work.name)).filter((name) =>
      name.endsWith('.json'),
    )) {
      const path = resolve(studies, work.name, file);
      const record = JSON.parse(readFileSync(path, 'utf8'));
      if (record.schema !== 'concept-study-v1') {
        problems.push(
          `${relative(root, path)}: authored text requires concept-study-v1 message keys`,
        );
        continue;
      }
      for (const field of studyMessagePaths(record)) keys.add(atPath(record, field));
      const scope = record.intuition.text.split('.')[0];
      for (const id of [record.id, ...record.nearby.map((entry) => entry.id)])
        keys.add(`${scope}.titles.${id}`);
    }
  }
  for (const path of modelSources(resolve(root, 'libs/features/tools/src/lib/studies'))) {
    const result = presentationProblems(readFileSync(path, 'utf8'), relative(root, path));
    result.keys.forEach((key) => keys.add(key));
    problems.push(...result.problems);
  }
  for (const key of keys)
    if (typeof key !== 'string' || !messageKey.test(key) || message(key) === undefined)
      problems.push(`missing or invalid study message: ${key}`);
  return problems;
}

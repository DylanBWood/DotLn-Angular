import { readFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import {
  BindingPipe,
  Interpolation,
  LiteralPrimitive,
  RecursiveAstVisitor,
  TmplAstRecursiveVisitor,
  parseTemplate,
  tmplAstVisitAll,
} from '@angular/compiler';
import ts from 'typescript';
import {
  importedNames,
  location,
  property,
  readSource,
  sourceFiles,
  visitTs,
  workspaceRoot,
} from './source-files.mjs';

export function templates(paths) {
  const result = new Map();
  const add = (id, text, line = 1) => {
    const parsed = parseTemplate(text, id, { preserveWhitespaces: true });
    if (parsed.errors?.length) throw new Error(`${id}:${line}: invalid Angular template`);
    result.set(id, { id, text, line, nodes: parsed.nodes });
  };
  // A template is what a component declares: its inline `template` or the file
  // its `templateUrl` names. A standalone .html file, such as the host page
  // apps/dotln/src/index.html, is not an Angular template and is left alone.
  for (const path of sourceFiles(paths)) {
    if (path.endsWith('.html')) continue;
    const source = readSource(path);
    const isComponent = importedNames(source, '@angular/core', 'Component');
    visitTs(source, (node) => {
      if (
        !ts.isDecorator(node) ||
        !ts.isCallExpression(node.expression) ||
        !isComponent(node.expression.expression)
      )
        return;
      const metadata = node.expression.arguments[0];
      if (!metadata || !ts.isObjectLiteralExpression(metadata)) {
        throw new Error(
          `${location(source, node)}: component metadata must be an object for template inspection`,
        );
      }
      const inline = property(metadata, 'template');
      const external = property(metadata, 'templateUrl');
      if (inline) {
        if (!ts.isStringLiteral(inline) && !ts.isNoSubstitutionTemplateLiteral(inline)) {
          throw new Error(`${location(source, inline)}: template must be a literal for inspection`);
        }
        add(
          `${relative(workspaceRoot, path)}#${node.pos}`,
          inline.text,
          source.getLineAndCharacterOfPosition(inline.getStart()).line + 1,
        );
      }
      if (external) {
        if (!ts.isStringLiteralLike(external))
          throw new Error(`${location(source, external)}: templateUrl must be literal`);
        const templatePath = resolve(dirname(path), external.text);
        add(relative(workspaceRoot, templatePath), readFileSync(templatePath, 'utf8'));
      }
    });
  }
  return [...result.values()];
}

export function inspectTemplate(template) {
  const findings = [];
  const pipes = [];
  const visibleAttributes = new Set([
    'title',
    'alt',
    'placeholder',
    'aria-label',
    'aria-description',
  ]);
  const report = (node, message) => {
    const line = template.line + (node.sourceSpan?.start?.line ?? 0);
    findings.push(`${template.id}:${line}: ${message}`);
  };
  class Expressions extends RecursiveAstVisitor {
    visitPipe(pipe, context) {
      pipes.push(pipe);
      return super.visitPipe(pipe, context);
    }
  }
  const expressions = new Expressions();
  let sourceData = false;
  const isSourceExpression = (expression) => {
    let hasLiteral = false;
    class Literals extends RecursiveAstVisitor {
      visitLiteralPrimitive(node) {
        if (node instanceof LiteralPrimitive) hasLiteral = true;
      }
    }
    expression.visit(new Literals());
    return sourceData && !hasLiteral;
  };
  function inspectTextExpression(node) {
    const ast = node.value.ast ?? node.value;
    ast.visit(expressions);
    if (ast instanceof Interpolation) {
      if (ast.strings.some((text) => text.trim()))
        report(node, 'literal text outside a t interpolation');
      for (const expression of ast.expressions) {
        if (
          (!(expression instanceof BindingPipe) || expression.name !== 't') &&
          !isSourceExpression(expression)
        ) {
          report(node, 'rendered text must pass through the t pipe');
        }
      }
    } else if ((!(ast instanceof BindingPipe) || ast.name !== 't') && !isSourceExpression(ast)) {
      report(node, 'rendered text must pass through the t pipe');
    }
  }
  class Visitor extends TmplAstRecursiveVisitor {
    visitElement(node) {
      const parent = sourceData;
      sourceData =
        parent ||
        node.attributes.some(
          (attribute) => attribute.name === 'translate' && attribute.value === 'no',
        );
      super.visitElement(node);
      sourceData = parent;
    }
    visitText(node) {
      if (node.value.trim()) report(node, 'literal template text');
    }
    visitBoundText(node) {
      inspectTextExpression(node);
    }
    visitTextAttribute(node) {
      if (visibleAttributes.has(node.name) && node.value.trim())
        report(node, 'literal user-facing attribute');
    }
    visitBoundAttribute(node) {
      if (visibleAttributes.has(node.name.replace(/^attr\./, ''))) inspectTextExpression(node);
      else node.value.visit(expressions);
    }
    visitLetDeclaration(node) {
      node.value.visit(expressions);
    }
  }
  tmplAstVisitAll(new Visitor(), template.nodes);
  return { findings, pipes };
}

export function translocoTemplate(template) {
  const replacements = inspectTemplate(template).pipes.filter((pipe) => pipe.name === 't');
  let text = template.text;
  for (const pipe of replacements.sort((a, b) => b.nameSpan.start - a.nameSpan.start)) {
    text = `${text.slice(0, pipe.nameSpan.start)}transloco${text.slice(pipe.nameSpan.end)}`;
  }
  return text;
}

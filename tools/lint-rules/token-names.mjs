import ts from 'typescript';
import { inspectTokenNames } from '../scripts/check-token-names.mjs';

export default {
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      description: 'Token descriptions must be string literals starting with dotln-angular.',
    },
  },
  create(context) {
    return {
      Program() {
        const source = ts.createSourceFile(
          context.filename,
          context.sourceCode.text,
          ts.ScriptTarget.Latest,
          true,
        );
        for (const node of inspectTokenNames(source)) {
          context.report({
            messageId: 'description',
            loc: {
              start: context.sourceCode.getLocFromIndex(node.getStart(source)),
              end: context.sourceCode.getLocFromIndex(node.getEnd()),
            },
          });
        }
      },
    };
  },
};

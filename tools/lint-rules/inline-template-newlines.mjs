export default {
  meta: {
    type: 'layout',
    fixable: 'whitespace',
    schema: [],
    messages: {
      newlines:
        'Inline component templates need a newline after the opening backtick and the closing backtick on its own line.',
    },
  },
  create(context) {
    const components = new Set();
    return {
      ImportDeclaration(node) {
        if (node.source.value !== '@angular/core') return;
        for (const specifier of node.specifiers) {
          if (specifier.imported?.name === 'Component') components.add(specifier.local.name);
        }
      },
      Decorator(node) {
        const call = node.expression;
        if (call.type !== 'CallExpression' || !components.has(call.callee.name)) return;
        const metadata = call.arguments[0];
        if (metadata?.type !== 'ObjectExpression') return;
        const template = metadata.properties.find(
          (property) => (property.key?.name ?? property.key?.value) === 'template',
        );
        if (!template) return;
        const raw = context.sourceCode.getText(template.value);
        if (/^`\r?\n[\s\S]*\r?\n[ \t]*`$/.test(raw)) return;
        context.report({
          node: template.value,
          messageId: 'newlines',
          fix(fixer) {
            if (template.value.type !== 'TemplateLiteral' || template.value.expressions.length)
              return null;
            const indent = ' '.repeat(template.loc.start.column);
            return fixer.replaceText(
              template.value,
              '`\n' + indent + '  ' + raw.slice(1, -1).trim() + '\n' + indent + '`',
            );
          },
        });
      },
    };
  },
};

import nx from '@nx/eslint-plugin';
import angular from 'angular-eslint';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import inlineTemplateNewlines from './tools/lint-rules/inline-template-newlines.mjs';
import tokenNames from './tools/lint-rules/token-names.mjs';

const privateSyntax = {
  selector: '[accessibility="private"]',
  message: 'Use ECMAScript #private members instead of TypeScript private.',
};
const domainImports = [
  '@dotln-angular/*-data-access',
  '@dotln-angular/state',
  '@dotln-angular/state/**',
];
const behaviorImports = ['@angular/aria', '@angular/aria/**', '@angular/cdk', '@angular/cdk/**'];
const restrictions = (groups) => [
  'error',
  {
    patterns: [
      {
        group: groups,
        message: 'Import is outside this component role; compose through inputs and outputs.',
      },
    ],
  },
];

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: [
      '**/dist',
      '**/out-tsc',
      '**/.nx/**',
      'tools/lint-fixtures/**',
      '**/vitest.config.*.timestamp*',
    ],
  },
  {
    files: ['**/*.{ts,tsx,cts,mts,js,jsx,cjs,mjs}'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { args: 'all', argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            { sourceTag: 'scope:shared', onlyDependOnLibsWithTags: ['scope:shared'] },
            { sourceTag: 'scope:dotln', onlyDependOnLibsWithTags: ['scope:shared', 'scope:dotln'] },
            { sourceTag: 'type:app', onlyDependOnLibsWithTags: ['*'] },
            {
              sourceTag: 'type:feature',
              onlyDependOnLibsWithTags: [
                'type:ui',
                'type:data-access',
                'type:state',
                'type:events',
                'type:core',
                'type:util',
                'type:i18n',
                'type:auth',
                'type:models',
              ],
            },
            {
              sourceTag: 'type:data-access',
              onlyDependOnLibsWithTags: ['type:events', 'type:models', 'type:core', 'type:util'],
            },
            {
              sourceTag: 'type:state',
              onlyDependOnLibsWithTags: ['type:events', 'type:models', 'type:core', 'type:util'],
            },
            {
              sourceTag: 'type:ui',
              onlyDependOnLibsWithTags: ['type:util', 'type:i18n', 'type:models'],
            },
            {
              sourceTag: 'type:auth',
              onlyDependOnLibsWithTags: [
                'type:data-access',
                'type:events',
                'type:models',
                'type:core',
                'type:util',
              ],
            },
            { sourceTag: 'type:events', onlyDependOnLibsWithTags: ['type:models', 'type:util'] },
            {
              sourceTag: 'type:core',
              onlyDependOnLibsWithTags: ['type:util', 'type:models', 'type:i18n'],
            },
            { sourceTag: 'type:i18n', onlyDependOnLibsWithTags: ['type:util', 'type:models'] },
            { sourceTag: 'type:util', onlyDependOnLibsWithTags: ['type:util'] },
            { sourceTag: 'type:models', onlyDependOnLibsWithTags: [] },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.ts'],
    plugins: {
      '@angular-eslint': angular.tsPlugin,
      dotln: {
        rules: { 'token-names': tokenNames, 'inline-template-newlines': inlineTemplateNewlines },
      },
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'dotln/token-names': 'error',
      'dotln/inline-template-newlines': 'error',
      '@angular-eslint/prefer-on-push-component-change-detection': 'error',
      '@angular-eslint/prefer-host-metadata-property': 'error',
      'simple-import-sort/imports': [
        'error',
        { groups: [['^\\u0000', '^node:', '^@?\\w'], ['^@dotln-angular/'], ['^\\.']] },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: '[accessibility="private"]',
          message: 'Use ECMAScript #private members instead of TypeScript private.',
        },
      ],
      '@angular-eslint/prefer-signals': 'error',
      '@angular-eslint/prefer-output-readonly': 'error',
    },
  },
  {
    basePath: import.meta.dirname,
    files: ['apps/**/*.ts', 'libs/**/*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/prefer-readonly': 'error',
    },
  },

  {
    basePath: import.meta.dirname,
    files: ['apps/**/*.ts', 'libs/**/*.ts'],
    ignores: ['**/wrappers/**', 'libs/shared/ui/src/lib/provide-dotln-ui.ts'],
    rules: { 'no-restricted-imports': restrictions(behaviorImports) },
  },
  {
    files: ['**/{fragments,templates,composites,layouts}/**/*.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        privateSyntax,
        {
          selector: 'CallExpression[callee.name="inject"]',
          message: 'Presentational components receive inputs; they do not inject.',
        },
        {
          selector: 'MethodDefinition[kind="constructor"] > FunctionExpression[params.length>0]',
          message: 'Presentational components must not use constructor injection.',
        },
      ],
      'no-restricted-imports': restrictions([
        ...domainImports,
        '@angular/router',
        ...behaviorImports,
      ]),
    },
  },
  {
    files: ['**/wrappers/**/*.ts'],
    rules: { 'no-restricted-imports': restrictions([...domainImports, '@angular/router']) },
  },
  {
    files: ['**/mappers/**/*.ts'],
    rules: { 'no-restricted-imports': restrictions([...domainImports, ...behaviorImports]) },
  },
];

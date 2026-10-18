import nx from '@nx/eslint-plugin';
import angular from 'angular-eslint';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  { ignores: ['**/dist', '**/out-tsc', '**/.nx/**', 'tools/lint-fixtures/**'] },
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
            { sourceTag: 'type:core', onlyDependOnLibsWithTags: ['type:util', 'type:models'] },
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
    plugins: { '@angular-eslint': angular.tsPlugin },
    rules: {
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
];

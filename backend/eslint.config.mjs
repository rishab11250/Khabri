import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import jsdoc from 'eslint-plugin-jsdoc';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';

export default [
  {
    ignores: ['coverage/**', 'node_modules/**'],
  },
  js.configs.recommended,
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      eqeqeq: ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
      'no-empty': 'error',
      'no-console': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      complexity: ['warn', 12],
      'max-lines-per-function': ['warn', { max: 80, skipBlankLines: true, skipComments: true }],
      'max-depth': ['warn', 4],
      'no-shadow': 'warn',
      'require-await': 'warn',
      'no-param-reassign': 'warn',
    },
  },
  {
    files: [
      'src/security/**/*.js',
      'src/ai/**/*.js',
      'src/engine/**/*.js',
      'src/services/**/*.js',
      'src/middleware/**/*.js',
      'src/models/**/*.js',
      'src/validators/**/*.js',
      'src/routes/**/*.js',
      'src/controllers/**/*.js',
      'src/config/**/*.js',
      'src/integrations/**/*.js',
    ],
    plugins: {
      jsdoc,
    },
    rules: {
      'jsdoc/require-jsdoc': [
        'warn',
        {
          enableFixer: false,
          publicOnly: true,
          require: {
            FunctionDeclaration: true,
            MethodDefinition: true,
            ClassDeclaration: true,
            ArrowFunctionExpression: true,
            FunctionExpression: true,
          },
        },
      ],
      'jsdoc/require-param': ['warn', { enableFixer: false }],
      'jsdoc/require-returns': ['warn', { enableFixer: false }],
      'jsdoc/check-param-names': 'warn',
    },
  },
  prettier,
];

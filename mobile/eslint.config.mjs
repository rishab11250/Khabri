import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import jsdoc from 'eslint-plugin-jsdoc';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';

export default [
  {
    ignores: ['.expo/**', 'dist/**', 'node_modules/**', 'web-build/**'],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    plugins: {
      react,
      'react-hooks': reactHooks,
      'simple-import-sort': simpleImportSort,
    },
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        __DEV__: 'readonly',
      },
    },
    settings: {
      react: {
        version: '19.3',
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react/jsx-uses-vars': 'error',
      'react/jsx-no-undef': 'error',
      'react/jsx-key': 'error',
      'react-hooks/exhaustive-deps': 'error',
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
      'no-restricted-syntax': [
        'warn',
        {
          selector: "JSXAttribute[name.name='style'] > JSXExpressionContainer > ObjectExpression",
          message: 'Avoid inline style objects; prefer StyleSheet.create / useStyles.',
        },
      ],
    },
  },
  {
    files: [
      'src/lib/**/*.{js,jsx}',
      'src/store/**/*.{js,jsx}',
      'src/hooks/**/*.{js,jsx}',
      'src/theme/**/*.{js,jsx}',
      'src/features/**/*.{js,jsx}',
      'src/components/**/*.{js,jsx}',
      'src/app/**/*.{js,jsx}',
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

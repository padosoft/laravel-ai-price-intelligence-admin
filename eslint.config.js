import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default tseslint.config(
  { ignores: ['resources/dist', 'node_modules', 'vendor', 'playwright-report', 'coverage'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['resources/js/**/*.{ts,tsx}', 'tests/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // eslint-plugin-react-hooks v7 (required for the eslint 10 peer range) redefined
      // configs.recommended to include the full React Compiler rule family. Bumping the
      // plugin here is only to satisfy eslint 10's peer dependency — not an opt-in to
      // React Compiler linting — so we keep the project's established lint contract: the
      // two classic hook rules that v5's `recommended` enforced. Adopting the Compiler
      // rules is a deliberate, separate decision left to a maintainer.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
);

import { baseConfig } from '@adda/eslint/base.js';

/** @type {import("eslint").Linter.Config[]} */
export default [
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/.turbo/**', '**/.next/**'],
  },
  ...baseConfig,
];

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['scripts/*.mjs'],
    languageOptions: { globals: { console: 'readonly' } },
  },
  ...tseslint.configs.recommended,
);

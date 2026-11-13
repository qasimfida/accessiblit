import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'site/dist/**',
      'coverage/**',
      'test-results/**',
      'playwright-report/**',
      'node_modules/**',
      '**/.next/**',
    ],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      globals: { console: 'readonly', process: 'readonly', URL: 'readonly' },
    },
  },
  {
    // These consumer fixtures intentionally exercise the promised CommonJS API.
    files: ['examples/**/*.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: { require: 'readonly' },
    },
    rules: {
      '@typescript-eslint/no-require-imports': [
        'error',
        {
          allow: ['^node:', '^@qasimfida/accessiblit(?:/package\\.json)?$'],
        },
      ],
    },
  },
);

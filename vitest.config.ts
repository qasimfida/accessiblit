import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      reporter: ['text', 'json-summary', 'html'],
      thresholds: {
        lines: 85,
        branches: 85,
        'src/core/**': { lines: 90, branches: 90 },
      },
    },
  },
});

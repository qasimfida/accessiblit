import { defineConfig } from 'tsup';
const shared = {
  target: 'es2019',
  platform: 'browser' as const,
  minify: true,
  sourcemap: true,
  clean: false,
};
export default defineConfig([
  {
    ...shared,
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    outExtension: ({ format }) => ({ js: format === 'cjs' ? '.cjs' : '.mjs' }),
  },
  {
    ...shared,
    entry: { react: 'src/react/index.ts' },
    format: ['esm', 'cjs'],
    external: ['react', '@qasimfida/accessiblit'],
    banner: { js: '"use client";' },
    dts: true,
    outExtension: ({ format }) => ({ js: format === 'cjs' ? '.cjs' : '.mjs' }),
  },
  {
    ...shared,
    entry: { accessiblit: 'src/index.ts' },
    format: ['iife'],
    globalName: 'Accessiblit',
    outExtension: () => ({ js: '.min.js' }),
  },
]);

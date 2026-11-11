import { defineConfig } from 'tsup';
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs', 'iife'],
  globalName: 'Accessiblit',
  outExtension({ format }) {
    return {
      js: format === 'esm' ? '.mjs' : format === 'cjs' ? '.cjs' : '.global.js',
    };
  },
  target: 'es2019',
  platform: 'browser',
  dts: true,
  minify: true,
  sourcemap: true,
  clean: true,
});

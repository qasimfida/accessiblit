import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs', 'iife'],
  globalName: 'Accessiblit',
  target: 'es2019',
  platform: 'browser',
  dts: true,
  minify: true,
  sourcemap: true,
  clean: true,
  outExtension({ format }) {
    return {
      js: format === 'iife' ? '.global.js' : format === 'cjs' ? '.cjs' : '.js',
    };
  },
});

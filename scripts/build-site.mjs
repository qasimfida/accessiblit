import { cp, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build as compile } from 'tsup';
import { build } from 'vite';

// Keep generated widget files outside tracked public assets; always use the real local build.
const assets = await mkdtemp(join(tmpdir(), 'accessiblit-site-'));
try {
  await cp(new URL('../site/public/', import.meta.url), assets, {
    recursive: true,
  });
  for (const name of ['accessiblit.min.js', 'accessiblit.min.js.map'])
    await cp(new URL(`../dist/${name}`, import.meta.url), join(assets, name));
  await compile({
    config: false,
    entry: {
      bootstrap: fileURLToPath(
        new URL('../site/src/bootstrap.ts', import.meta.url),
      ),
    },
    format: ['iife'],
    target: 'es2019',
    minify: true,
    sourcemap: false,
    dts: false,
    clean: false,
    silent: true,
    outDir: assets,
    outExtension: () => ({ js: '.js' }),
  });
  await build({
    configFile: fileURLToPath(
      new URL('../site/vite.config.ts', import.meta.url),
    ),
    publicDir: assets,
  });
} finally {
  await rm(assets, { recursive: true, force: true });
}

import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  mkdtempSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  copyFileSync,
  rmSync,
  lstatSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'tsup';
import { run } from './examples/process.mjs';
import { serve } from './examples/servers.mjs';
import { siteSnippets } from './site/snippets.mjs';
import { checkSnippetBrowsers } from './site/snippet-browser.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const snippets = siteSnippets();
const folder = mkdtempSync(join(tmpdir(), 'accessiblit-site-consumers-'));
let server;
try {
  run('npm', ['run', 'build'], root);
  const packed = JSON.parse(
    execFileSync('npm', ['pack', '--json', '--pack-destination', folder], {
      cwd: root,
      encoding: 'utf8',
    }),
  )[0];
  const versions = JSON.parse(
    readFileSync(join(root, 'package.json'), 'utf8'),
  ).devDependencies;
  writeFileSync(
    join(folder, 'package.json'),
    JSON.stringify({
      private: true,
      type: 'module',
      dependencies: {
        '@qasimfida/accessiblit': `file:./${packed.filename}`,
        react: versions.react,
        'react-dom': versions['react-dom'],
        '@types/react': versions['@types/react'],
        '@types/react-dom': versions['@types/react-dom'],
      },
    }),
  );
  run(
    'npm',
    ['install', '--ignore-scripts', '--no-audit', '--no-fund'],
    folder,
  );
  assert.equal(
    lstatSync(
      join(folder, 'node_modules/@qasimfida/accessiblit'),
    ).isSymbolicLink(),
    false,
  );
  for (const id of ['esm', 'lifecycle', 'react', 'next'])
    writeFileSync(
      join(folder, `${id}.${['react', 'next'].includes(id) ? 'tsx' : 'ts'}`),
      snippets.get(id).code,
    );
  const shell = [];
  for (const [id, snippet] of snippets)
    if (snippet.language === 'sh') {
      const result = spawnSync('bash', ['-n'], {
        input: snippet.code,
        encoding: 'utf8',
      });
      assert.equal(result.status, 0, result.stderr);
      shell.push(id);
    }
  const config = {
    compilerOptions: {
      target: 'ES2019',
      lib: ['ES2019', 'DOM'],
      strict: true,
      noUncheckedIndexedAccess: true,
      noEmit: true,
      jsx: 'react-jsx',
      skipLibCheck: true,
    },
    include: ['esm.ts', 'lifecycle.ts', 'react.tsx', 'next.tsx'],
  };
  for (const mode of ['Node16', 'Bundler']) {
    const file = join(folder, `tsconfig.${mode}.json`);
    writeFileSync(
      file,
      JSON.stringify({
        ...config,
        compilerOptions: {
          ...config.compilerOptions,
          module: mode === 'Node16' ? 'Node16' : 'ESNext',
          moduleResolution: mode,
        },
      }),
    );
    run(
      'node',
      [join(root, 'node_modules/typescript/bin/tsc'), '-p', file],
      folder,
    );
  }
  for (const id of ['esm', 'lifecycle']) {
    const extra =
      id === 'lifecycle'
        ? "Reflect.set(globalThis, '__snippetState', state);"
        : "Reflect.set(globalThis, '__snippetUnmount', () => widget.destroy());";
    writeFileSync(
      join(folder, `${id}-entry.ts`),
      snippets.get(id).code + '\n' + extra,
    );
  }
  for (const id of ['react', 'next'])
    writeFileSync(
      join(folder, `${id}-entry.tsx`),
      `import { createElement, StrictMode } from 'react';\nimport { createRoot } from 'react-dom/client';\nimport Accessibility from './${id}';\nconst root = createRoot(document.getElementById('app')!);\nroot.render(createElement(StrictMode, null, createElement(Accessibility)));\nReflect.set(globalThis, '__snippetUnmount', () => root.unmount());`,
    );
  const output = join(folder, 'public');
  mkdirSync(output);
  let inputs = [];
  await build({
    config: false,
    tsconfig: join(folder, 'tsconfig.Bundler.json'),
    entry: Object.fromEntries(
      ['esm', 'lifecycle', 'react', 'next'].map((id) => [
        id,
        join(
          folder,
          `${id}-entry.${['react', 'next'].includes(id) ? 'tsx' : 'ts'}`,
        ),
      ]),
    ),
    format: ['iife'],
    platform: 'browser',
    define: { 'process.env.NODE_ENV': '"development"' },
    target: 'es2019',
    minify: true,
    dts: false,
    splitting: false,
    noExternal: [/.*/],
    outDir: output,
    outExtension: () => ({ js: '.js' }),
    silent: true,
    esbuildOptions(options) {
      options.metafile = true;
    },
    esbuildPlugins: [
      {
        name: 'packed-source-proof',
        setup(builder) {
          builder.onEnd((result) => {
            inputs = Object.keys(result.metafile.inputs);
          });
        },
      },
    ],
  });
  assert.ok(
    inputs.some((path) =>
      path.includes('node_modules/@qasimfida/accessiblit/dist/index.mjs'),
    ),
  );
  assert.ok(
    !inputs.some((path) => path.startsWith('src/')),
    'consumer must not use the repository TypeScript alias',
  );
  const iife = readFileSync(
    join(folder, 'node_modules/@qasimfida/accessiblit/dist/accessiblit.min.js'),
    'utf8',
  );
  mkdirSync(join(output, 'vendor'));
  copyFileSync(
    join(folder, 'node_modules/@qasimfida/accessiblit/dist/accessiblit.min.js'),
    join(output, 'vendor/accessiblit.min.js'),
  );
  for (const id of [
    'cdn',
    'self-hosted',
    'esm',
    'lifecycle',
    'react',
    'next',
  ]) {
    const scripts = ['cdn', 'self-hosted'].includes(id)
      ? snippets.get(id).code
      : `<script src="/${id}.js"></script>`;
    writeFileSync(
      join(output, `${id}.html`),
      `<!doctype html><html lang="en"><meta charset="utf-8"><title>Extracted ${id} example</title><main><h1>Snippet consumer</h1><div id="app"></div></main>${scripts}</html>`,
    );
  }
  server = await serve(output);
  const rows = await checkSnippetBrowsers(server.url, iife);
  console.log(
    'SITE_SNIPPETS',
    JSON.stringify({
      extracted: [...snippets.keys()],
      types: ['Node16', 'Bundler'],
      shellSyntax: shell,
      installedTarball: packed.filename,
      packedSource: true,
      strictModeDevelopment: true,
      rows,
      notes: [
        'CDN bytes intercepted from the tarball because the public package is not published.',
        'Private registry and Git shell examples are syntax checked; no private credentials or registry is used.',
      ],
    }),
  );
} finally {
  await server?.close();
  rmSync(folder, { recursive: true, force: true });
}

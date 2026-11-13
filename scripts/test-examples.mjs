import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  mkdtempSync,
  cpSync,
  readFileSync,
  copyFileSync,
  rmSync,
  writeFileSync,
  mkdirSync,
  lstatSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { run } from './examples/process.mjs';
import { reactCompatibility } from './examples/compat.mjs';
import { auditBundles } from './examples/bundles.mjs';
import { serve, nextServer } from './examples/servers.mjs';
import { browserExamples } from './examples/browser.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
run('npm', ['run', 'build'], root);
const folder = mkdtempSync(join(tmpdir(), 'accessiblit-consumers-'));
const servers = {};
try {
  const dry = JSON.parse(
    execFileSync('npm', ['pack', '--dry-run', '--json'], {
      cwd: root,
      encoding: 'utf8',
    }),
  )[0];
  const files = dry.files.map((f) => f.path);
  assert.ok(
    files.every(
      (f) =>
        ['package.json', 'README.md', 'LICENSE'].includes(f) ||
        /^dist\/[\w.-]+\.(mjs|cjs|js|ts|cts|map)$/.test(f),
    ),
  );
  const packed = JSON.parse(
    execFileSync('npm', ['pack', '--json', '--pack-destination', folder], {
      cwd: root,
      encoding: 'utf8',
    }),
  )[0];
  copyFileSync(join(folder, packed.filename), join(folder, 'accessiblit.tgz'));
  const installed = {};
  for (const name of [
    'html',
    'node-ssr-check',
    'react-vite',
    'nextjs',
    'consumers',
  ]) {
    const directory = join(folder, name);
    cpSync(join(root, 'examples', name), directory, { recursive: true });
    run(
      'npm',
      ['install', '--ignore-scripts', '--no-audit', '--no-fund'],
      directory,
    );
    assert.equal(
      lstatSync(
        join(directory, 'node_modules/@qasimfida/accessiblit'),
      ).isSymbolicLink(),
      false,
    );
    installed[name] = directory;
  }
  run('npm', ['test'], installed['node-ssr-check']);
  run('npm', ['test'], installed.consumers);
  run(
    'node',
    [
      join(root, 'node_modules/typescript/bin/tsc'),
      'core-types.mts',
      '--noEmit',
      '--strict',
      '--module',
      'Node16',
      '--moduleResolution',
      'Node16',
      '--target',
      'ES2019',
      '--lib',
      'ES2019,DOM',
    ],
    installed['node-ssr-check'],
  );
  run('node', ['ssr.mjs'], installed['react-vite']);
  const compatibility = await reactCompatibility(folder);
  const bundleAudit = await auditBundles(installed['react-vite']);
  run('npm', ['run', 'build'], installed['react-vite']);
  run('npm', ['run', 'build'], installed.nextjs);
  const bundle = readFileSync(
    join(
      installed.html,
      'node_modules/@qasimfida/accessiblit/dist/accessiblit.min.js',
    ),
    'utf8',
  );
  const sri = 'sha384-' + createHash('sha384').update(bundle).digest('base64');
  assert.equal(
    execFileSync('node', ['scripts/sri.mjs'], {
      cwd: root,
      encoding: 'utf8',
    }).trim(),
    sri,
  );
  servers.html = await serve(installed.html);
  servers.react = await serve(join(installed['react-vite'], 'dist'));
  servers.next = await nextServer(installed.nextjs);
  const serverHtml = await (await globalThis.fetch(servers.next.url)).text();
  assert.ok(serverHtml.includes('This text is server-rendered.'));
  assert.ok(!serverHtml.includes('data-accessiblit-host'));
  const rows = await browserExamples(
    servers,
    bundle,
    readFileSync(join(root, 'examples/consumers/cdn.html'), 'utf8'),
  );
  const evidence = {
    compatibility,
    bundleAudit,
    files,
    sri,
    examples: Object.keys(installed),
    types: ['Node16 ESM/CJS', 'Bundler ESM/TSX'],
    rows,
  };
  if (process.env.ACCESSIBLIT_PACKAGING_EVIDENCE) {
    const output = join(root, 'reports/assets/phase-6');
    mkdirSync(output, { recursive: true });
    writeFileSync(
      join(output, 'examples.json'),
      JSON.stringify(evidence, null, 2) + '\n',
    );
  }
  console.log('PACKED_EXAMPLES', JSON.stringify(evidence));
} finally {
  for (const server of Object.values(servers)) await server.close();
  rmSync(folder, { recursive: true, force: true });
}

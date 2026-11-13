import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { SourceMap } from 'node:module';
import { join } from 'node:path';
import { Buffer } from 'node:buffer';
import { gzipSync } from 'node:zlib';
import { build } from 'vite';

/** Source-map ranges attribute raw bytes; gzip belongs to the whole bundle, not additive parts. */
export async function auditBundles(directory) {
  const dist = join(directory, 'node_modules/@qasimfida/accessiblit/dist');
  const read = (name) => readFileSync(join(dist, name), 'utf8');
  const code = read('accessiblit.min.js');
  const payload = JSON.parse(read('accessiblit.min.js.map'));
  const map = new SourceMap(payload);
  const groups = {};
  let line = 0,
    column = 0;
  for (const character of code) {
    const entry = map.findEntry(line, column);
    let group = 'wrapper/unmapped';
    if (entry.generatedLine === line && entry.originalSource) {
      const source = entry.originalSource;
      group = source.includes('/core/')
        ? 'core'
        : source.includes('/features/')
          ? 'features'
          : source.includes('/ui/')
            ? 'ui'
            : 'entry';
    }
    groups[group] = (groups[group] ?? 0) + Buffer.byteLength(character);
    if (character === '\n') {
      line++;
      column = 0;
    } else column += character.length;
  }
  const reactSources = JSON.parse(read('react.mjs.map')).sources;
  assert.deepEqual(reactSources, ['../src/react/index.ts']);
  assert.deepEqual(JSON.parse(read('react.cjs.map')).sources, reactSources);
  assert.equal(
    payload.sources.some(
      (s) => s.includes('/react/') || s.includes('node_modules'),
    ),
    false,
  );
  assert.equal(
    JSON.parse(read('index.mjs.map')).sources.some((s) =>
      s.includes('/react/'),
    ),
    false,
  );
  assert.match(read('react.mjs'), /from["']@qasimfida\/accessiblit["']/);
  assert.match(read('react.cjs'), /require\(["']@qasimfida\/accessiblit["']\)/);
  for (const name of ['react.mjs', 'react.cjs'])
    assert.ok(read(name).startsWith('"use client";'));
  const compile = async (name, content) => {
    const file = join(directory, name + '.mjs');
    writeFileSync(file, content);
    const result = await build({
      configFile: false,
      root: directory,
      logLevel: 'silent',
      build: {
        write: false,
        minify: true,
        sourcemap: true,
        lib: { entry: file, formats: ['es'] },
        rollupOptions: {
          external: ['react'],
          output: { entryFileNames: 'audit.mjs' },
        },
      },
    });
    const outputs = Array.isArray(result)
      ? result.flatMap((o) => o.output)
      : result.output;
    return outputs.find((o) => o.type === 'chunk');
  };
  const unused = await compile(
    'tree-unused',
    'import { init } from "@qasimfida/accessiblit"; import { AccessiblitWidget } from "@qasimfida/accessiblit/react"; export const retained = 1;',
  );
  assert.deepEqual(unused.exports, ['retained']);
  // Vite's ES library output preserves source-path and sourceMappingURL comments.
  // Count executable output, and independently require that only the entry survives.
  const unusedExecutable = unused.code
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('//'))
    .join('\n')
    .trim();
  assert.equal(unused.moduleIds.length, 1);
  assert.ok(unused.moduleIds[0].endsWith('/tree-unused.mjs'));
  assert.ok(unusedExecutable.length < 128);
  assert.equal(unusedExecutable.includes('accessiblit'), false);
  const used = await compile(
    'tree-used',
    'export { init, destroy } from "@qasimfida/accessiblit"; export { AccessiblitWidget, useAccessiblit } from "@qasimfida/accessiblit/react";',
  );
  const coreModules = used.moduleIds.filter((id) =>
    id.endsWith('/@qasimfida/accessiblit/dist/index.mjs'),
  );
  const reactModules = used.moduleIds.filter((id) =>
    id.endsWith('/@qasimfida/accessiblit/dist/react.mjs'),
  );
  assert.equal(coreModules.length, 1);
  assert.equal(reactModules.length, 1);
  const gzip = gzipSync(code).length;
  assert.ok(gzip <= 35000);
  return {
    rawBytes: Buffer.byteLength(code),
    gzipBytes: gzip,
    sourceMapRawAttribution: groups,
    coreSourceCount: payload.sources.length,
    reactSources,
    reactEsmBytes: Buffer.byteLength(read('react.mjs')),
    reactCjsBytes: Buffer.byteLength(read('react.cjs')),
    unusedImportOutput: unusedExecutable,
    combinedCoreModuleCount: coreModules.length,
    combinedReactModuleCount: reactModules.length,
  };
}

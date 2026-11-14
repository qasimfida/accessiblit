import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { format } from 'prettier';
import { createSiteServer } from './site/serve.mjs';

const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 22 || (major === 22 && minor < 19))
  throw new Error(
    'The optional Lighthouse 13.6 audit needs Node 22.19+; library/site builds still support Node 20.',
  );
const folder = new URL(
  '../reports/assets/phase-8/lighthouse/',
  import.meta.url,
);
await mkdir(folder, { recursive: true });
const server = createSiteServer();
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const originalChrome = process.env.CHROME_PATH;
// Chrome Launcher uses this documented path; never inspect or reuse a personal browser profile.
process.env.CHROME_PATH = chromium.executablePath();
const rows = [];
try {
  for (const [name, path] of [
    ['home', ''],
    ['install', 'install/'],
    ['options', 'options/'],
    ['faq', 'faq/'],
    ['404', '404.html'],
  ]) {
    const output = fileURLToPath(new URL(`${name}.json`, folder));
    const url = `http://127.0.0.1:${server.address().port}/accessiblit/${path}`;
    const args = [
      'exec',
      '--yes',
      '--package=lighthouse@13.6.0',
      '--',
      'lighthouse',
      url,
      '--quiet',
      '--chrome-flags=--headless',
      '--no-enable-error-reporting',
      '--only-categories=performance,accessibility,best-practices,seo',
      '--output=json',
      `--output-path=${output}`,
    ];
    await new Promise((resolve, reject) => {
      const child = spawn('npm', args, { stdio: 'inherit' });
      child.once('error', reject);
      child.once('exit', (code) =>
        code === 0
          ? resolve()
          : reject(new Error(`Lighthouse ${name} exited ${code}`)),
      );
    });
    const result = JSON.parse(await readFile(output, 'utf8'));
    await writeFile(
      output,
      await format(JSON.stringify(result), { parser: 'json' }),
    );
    const scores = Object.fromEntries(
      Object.entries(result.categories).map(([key, value]) => [
        key,
        value.score * 100,
      ]),
    );
    const metrics = Object.fromEntries(
      [
        'first-contentful-paint',
        'largest-contentful-paint',
        'total-blocking-time',
        'cumulative-layout-shift',
        'total-byte-weight',
      ].map((key) => [key, result.audits[key]?.numericValue ?? null]),
    );
    rows.push({ name, version: result.lighthouseVersion, scores, metrics });
    console.log('SITE_LIGHTHOUSE', JSON.stringify(rows.at(-1)));
  }
  await writeFile(
    new URL('summary.json', folder),
    await format(
      JSON.stringify({
        rows,
        notes: [
          'Pinned ephemeral Lighthouse; no new root dependency or runtime code.',
          'Default Lighthouse mobile simulation; raw configuration is retained per page.',
          '404 intentionally uses noindex and is excluded from the sitemap.',
        ],
      }),
      { parser: 'json' },
    ),
  );
} finally {
  if (originalChrome === undefined) delete process.env.CHROME_PATH;
  else process.env.CHROME_PATH = originalChrome;
  await new Promise((resolve) => server.close(resolve));
}

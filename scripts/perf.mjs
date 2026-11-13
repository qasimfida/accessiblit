import { execFileSync } from 'node:child_process';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { cpus, platform, arch, totalmem, release } from 'node:os';
import { parseArgs } from 'node:util';
import { chromium, webkit } from '@playwright/test';
import { format } from 'prettier';
import { summarize, regression } from './perf/statistics.mjs';
import { measureInit } from './perf/measure.mjs';

const { values } = parseArgs({
  options: {
    ci: { type: 'boolean', default: false },
    'other-apps-open': { type: 'boolean', default: false },
    baseline: { type: 'string' },
    output: { type: 'string' },
  },
});
const mac = platform() === 'darwin';
const command = (name, args) =>
  execFileSync(name, args, { encoding: 'utf8' }).trim();
const power = mac ? command('pmset', ['-g', 'batt']) : null;
if (!values.ci && (!mac || !power.includes("'AC Power'")))
  throw new Error('The reference run requires this Mac connected to AC power.');
if (
  !values.ci &&
  !values['other-apps-open'] &&
  process.env.PERF_CONDITIONS_CONFIRMED !== '1'
)
  throw new Error(
    'Confirm other apps are closed with PERF_CONDITIONS_CONFIRMED=1.',
  );
const report = {
  date: new Date().toISOString(),
  source: command('git', ['rev-parse', 'HEAD']),
  mode: values.ci ? 'ci-trend' : 'macos-reference',
  machine: {
    model: mac ? command('sysctl', ['-n', 'hw.model']) : null,
    chip: mac
      ? command('sysctl', ['-n', 'machdep.cpu.brand_string'])
      : cpus()[0]?.model,
    ramBytes: totalmem(),
    platform: platform(),
    architecture: arch(),
    os: mac ? command('sw_vers', []) : release(),
    node: process.version,
    logicalCpus: cpus().length,
  },
  conditions: {
    power,
    otherAppsClosed: values.ci
      ? 'not applicable: shared CI'
      : !values['other-apps-open'],
    appsConditionException: values['other-apps-open']
      ? 'Maintainer explicitly requested running with other apps open.'
      : null,
    headless: true,
    tracing: false,
  },
  method: {
    warmupRuns: 5,
    measuredRuns: 30,
    timer: 'performance.now around init() only',
    fixture:
      'plain semantic host; 5000 paragraphs; default options; empty storage',
    gate: values.ci
      ? 'report absolute; fail above 1.5 times committed CI median'
      : 'median <= 50 ms per engine',
    median: 'mean of middle pair',
    p95: 'nearest rank',
  },
  browsers: {},
};
const baseline = values.baseline
  ? JSON.parse(await readFile(values.baseline, 'utf8'))
  : null;
if (values.ci && !baseline)
  throw new Error('CI requires a committed baseline.');
const bundle = await readFile(
  new URL('../dist/accessiblit.min.js', import.meta.url),
  'utf8',
);
let failed = false;
for (const [name, engine] of Object.entries({ chromium, webkit })) {
  const browser = await engine.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    // A stable origin permits the real guarded storage path without a server or network.
    await page.route('http://accessiblit.test/**', (route) =>
      route.fulfill({
        contentType: 'text/html',
        body: '<!doctype html><html lang="en"><title>Init performance</title><body><main><h1>Host page</h1></main></body></html>',
      }),
    );
    await page.goto('http://accessiblit.test/');
    await page.evaluate(() => {
      const main = globalThis.document.querySelector('main');
      const fragment = globalThis.document.createDocumentFragment();
      for (let i = 0; i < 5000; i++) {
        const p = globalThis.document.createElement('p');
        p.textContent = `Host paragraph ${i}`;
        fragment.append(p);
      }
      main.append(fragment);
    });
    await page.addScriptTag({ content: bundle });
    const raw = await page.evaluate(measureInit);
    if (errors.length) throw new Error(errors.join('\n'));
    const stats = summarize(raw.samples);
    const guard = baseline
      ? regression(stats.medianMs, baseline.browsers[name].medianMs)
      : null;
    const pass = values.ci ? guard.pass : stats.medianMs <= 50;
    report.browsers[name] = {
      version: browser.version(),
      ...raw,
      ...stats,
      guard,
      pass,
    };
    failed ||= !pass;
    console.log(
      `${name}: median ${stats.medianMs} ms; p95 ${stats.p95Ms} ms; ${pass ? 'PASS' : 'FAIL'}`,
    );
  } finally {
    await browser.close();
  }
}
report.pass = !failed;
await mkdir(new URL('../reports/', import.meta.url), { recursive: true });
const output =
  values.output ??
  (values.ci ? 'reports/perf-ci.json' : 'reports/perf-macos.json');
await writeFile(
  output,
  await format(JSON.stringify(report), { parser: 'json' }),
);
console.log(`PERF_REPORT ${JSON.stringify(report)}`);
if (failed) process.exitCode = 1;

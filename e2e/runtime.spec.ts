import { readFileSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import type { init, destroy } from '../src/index';

declare global {
  interface Window {
    Accessiblit: { init: typeof init; destroy: typeof destroy };
  }
}
const bundle = readFileSync(
  new URL('../dist/index.global.js', import.meta.url),
  'utf8',
);
const html =
  '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Runtime probe</title></head><body><main><h1>Runtime probe</h1><p>Stable host content.</p></main><script src="/runtime.js"></script></body></html>';
async function loadBundle(page: Page, policy?: string) {
  await page.route('**/runtime.js', (route) =>
    route.fulfill({ contentType: 'application/javascript', body: bundle }),
  );
  await page.route('**/runtime-probe', (route) =>
    route.fulfill({
      contentType: 'text/html',
      headers: policy ? { 'Content-Security-Policy': policy } : {},
      body: html,
    }),
  );
  await page.goto('/runtime-probe');
  await page.waitForFunction(() => !!window.Accessiblit);
}

for (const fallback of [false, true]) {
  test(`honours strict style CSP with ${fallback ? 'nonce fallback' : 'constructed sheets'}`, async ({
    page,
  }) => {
    if (fallback)
      await page.addInitScript(() => {
        Object.defineProperty(CSSStyleSheet.prototype, 'replaceSync', {
          configurable: true,
          value: undefined,
        });
      });
    await page.addInitScript(() => {
      const violations: string[] = [];
      Reflect.set(globalThis, 'cspViolations', violations);
      document.addEventListener('securitypolicyviolation', (event) =>
        violations.push(event.violatedDirective),
      );
    });
    await loadBundle(
      page,
      "default-src 'none'; script-src 'self'; style-src 'nonce-test-owner'; connect-src 'none'; base-uri 'none'",
    );
    await page.evaluate(() => {
      (Reflect.get(globalThis, 'cspViolations') as string[]).length = 0;
      window.Accessiblit.init({ nonce: 'test-owner', persist: false });
    });
    const style = await page
      .locator('[data-accessiblit-host]')
      .evaluate((host) => {
        const root = host.shadowRoot!;
        const status = root.querySelector('[role=status]')!;
        return {
          hostPosition: getComputedStyle(host).position,
          regionWidth: getComputedStyle(status).inlineSize,
          clip: getComputedStyle(status).clipPath,
          nonce: root.querySelector('style')?.nonce,
          constructed: root.adoptedStyleSheets.length,
        };
      });
    expect(style.hostPosition).toBe('fixed');
    expect(style.regionWidth).toBe('1px');
    expect(style.clip).toBe('inset(50%)');
    if (fallback) {
      expect(style.nonce).toBe('test-owner');
      expect(style.constructed).toBe(0);
    } else expect(style.constructed).toBe(2);
    // Measure library CSP effects before axe injects its own audit probes.
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    expect(
      await page.evaluate(() => Reflect.get(globalThis, 'cspViolations')),
    ).toEqual([]);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.evaluate(() => window.Accessiblit.destroy());
    await expect(page.locator('[data-accessiblit-host]')).toHaveCount(0);
  });
}

test('production init stays below 50 ms, causes no layout shift or requests, and restores DOM', async ({
  page,
}) => {
  expect(bundle).not.toContain('Test font size');
  await loadBundle(page);
  const requests: string[] = [];
  page.on('request', (request) => {
    if (request.resourceType() !== 'other') requests.push(request.url());
  });
  const evidence = await page.evaluate(async () => {
    const before = document.documentElement.outerHTML;
    const times: number[] = [];
    const rects: { width: number; height: number }[] = [];
    const supported =
      PerformanceObserver.supportedEntryTypes.includes('layout-shift');
    let shift = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries())
        shift += (entry as PerformanceEntry & { value: number }).value;
    });
    if (supported) observer.observe({ type: 'layout-shift' });
    const frame = () =>
      new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    for (let i = 0; i < 10; i++) {
      const started = performance.now();
      const instance = window.Accessiblit.init({
        storageKey: 'e2e:performance',
      });
      times.push(performance.now() - started);
      const rect = document
        .querySelector('[data-accessiblit-host]')!
        .getBoundingClientRect();
      rects.push({ width: rect.width, height: rect.height });
      await frame();
      instance.destroy();
      await frame();
    }
    for (const entry of observer.takeRecords())
      shift += (entry as PerformanceEntry & { value: number }).value;
    observer.disconnect();
    return {
      times,
      cls: supported ? shift : null,
      rects,
      restored: before === document.documentElement.outerHTML,
    };
  });
  console.log('RUNTIME_EVIDENCE', JSON.stringify(evidence));
  expect(Math.max(...evidence.times)).toBeLessThan(50);
  expect(evidence.restored).toBe(true);
  expect(requests).toEqual([]);
  for (const rect of evidence.rects)
    expect(rect).toEqual({ width: 0, height: 0 });
  if (evidence.cls !== null) expect(evidence.cls).toBe(0);
});

test('isolates the invisible mount from aggressive host CSS', async ({
  page,
}) => {
  await loadBundle(page);
  await page.addStyleTag({
    content:
      'div { position:static!important; padding:20px!important; margin:20px!important; min-width:200px!important; min-height:100px!important; border:3px solid red!important; }',
  });
  const before = await page.evaluate(() => document.documentElement.outerHTML);
  await page.evaluate(() => window.Accessiblit.init({ persist: false }));
  const size = await page
    .locator('[data-accessiblit-host]')
    .evaluate((host) => {
      const rect = host.getBoundingClientRect();
      return {
        width: rect.width,
        height: rect.height,
        position: getComputedStyle(host).position,
      };
    });
  expect(size).toEqual({ width: 0, height: 0, position: 'fixed' });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.evaluate(() => window.Accessiblit.destroy());
  expect(await page.evaluate(() => document.documentElement.outerHTML)).toBe(
    before,
  );
});

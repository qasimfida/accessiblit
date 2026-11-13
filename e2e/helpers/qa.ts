import { readFileSync } from 'node:fs';
import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import type {
  AccessiblitInstance,
  AccessiblitOptions,
  ChangeEvent,
} from '../../src/core/types';
import { uiEvidence } from './ui-evidence';
import AxeBuilder from '@axe-core/playwright';
declare global {
  interface Window {
    qaInstance: AccessiblitInstance;
    qaInit: (options?: AccessiblitOptions) => AccessiblitInstance;
    qaChanges: ChangeEvent[];
  }
}
/** CSP variants exercise both supported stylesheet installation paths. */
export const QA_HOSTS = [
  'plain',
  'shadow',
  'iframes',
  'csp',
  'csp-nonce',
  'heavy',
  'modal',
  'reset',
] as const;
/** These profiles are independent dimensions, not a claim to test every settings permutation. */
export const QA_PROFILES = [
  'standard',
  'forced',
  'reduced',
  'dark',
  'rtl',
] as const;
/** Raw HTML delivery avoids Vite's development websocket under a deliberately restrictive policy. */
export async function loadQA(page: Page, host: string, profile: string) {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.emulateMedia({
    forcedColors: profile === 'forced' ? 'active' : 'none',
    reducedMotion: profile === 'reduced' ? 'reduce' : 'no-preference',
    colorScheme: profile === 'dark' ? 'dark' : 'light',
  });
  if (host === 'csp-nonce')
    await page.addInitScript(() => {
      Reflect.set(
        globalThis,
        'qaNativeReplaceSync',
        CSSStyleSheet.prototype.replaceSync,
      );
      Object.defineProperty(CSSStyleSheet.prototype, 'replaceSync', {
        configurable: true,
        value: undefined,
      });
    });
  await page.route('**/qa/*.html*', (route) => {
    const name = new URL(route.request().url()).pathname.split('/').at(-1)!;
    let body = readFileSync(
      new URL('../../fixtures/qa/' + name, import.meta.url),
      'utf8',
    );
    // The helper's directory is e2e/helpers, so fixtures are two parents above it.
    if (profile === 'rtl')
      body = body.replace('<html lang="en">', '<html lang="en" dir="rtl">');
    const headers: Record<string, string> = host.startsWith('csp')
      ? {
          'Content-Security-Policy':
            "default-src 'none'; script-src 'self'; style-src 'self' 'nonce-qa-owner'; style-src-attr 'none'; img-src data:; frame-src 'self'; connect-src 'none'; base-uri 'none'; object-src 'none'",
        }
      : {};
    return route.fulfill({ contentType: 'text/html', body, headers });
  });
  await page.goto(
    `/qa/${host === 'csp-nonce' ? 'csp' : host}.html${host === 'csp-nonce' ? '?nonce=qa-owner' : ''}`,
  );
  await page.waitForFunction(() => !!window.qaInstance);
  return errors;
}
/** Every sampled state has both a closed and an open widget audit with unmodified axe rules. */
export async function auditQA(page: Page) {
  // Let the widget finish installing fallback sheets before restoring APIs for axe's own probes.
  if (
    await page.evaluate(
      () =>
        typeof Reflect.get(globalThis, 'qaNativeReplaceSync') === 'function',
    )
  ) {
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    const installed = await page
      .locator('[data-accessiblit-host]')
      .evaluate((host) => ({
        constructed: host.shadowRoot!.adoptedStyleSheets.length,
        nonces: [
          ...host.shadowRoot!.querySelectorAll('style'),
          ...document.querySelectorAll<HTMLStyleElement>(
            'style[data-accessiblit-style]',
          ),
        ].map((s) => s.nonce),
      }));
    expect(installed.constructed).toBe(0);
    expect(installed.nonces.length).toBeGreaterThan(0);
    expect(installed.nonces.every((n) => n === 'qa-owner')).toBe(true);
    await page.evaluate(() =>
      Object.defineProperty(CSSStyleSheet.prototype, 'replaceSync', {
        configurable: true,
        value: Reflect.get(globalThis, 'qaNativeReplaceSync'),
      }),
    );
  }
  await page.evaluate(() => window.qaInstance.close());
  expect(
    (
      await new AxeBuilder({ page })
        .include('[data-accessiblit-host]')
        .options({ iframes: false })
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.bringToFront();
  await page.evaluate(() => window.qaInstance.open());
  await expect(
    page.getByRole('dialog', { name: 'Accessibility options' }),
  ).toBeVisible();
  expect(
    (
      await new AxeBuilder({ page })
        .include('[data-accessiblit-host]')
        .options({ iframes: false })
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.bringToFront();
  const evidence = await uiEvidence(page);
  expect(evidence.panel.scrollWidth).toBeLessThanOrEqual(
    evidence.panel.clientWidth + 1,
  );
  expect(evidence.panel.left).toBeGreaterThanOrEqual(-1);
  expect(evidence.panel.right).toBeLessThanOrEqual(
    await page.evaluate(() => innerWidth + 1),
  );
  expect(
    Math.min(...evidence.targets.map((t) => Math.min(t.width, t.height))),
  ).toBeGreaterThanOrEqual(24);
  expect(Math.min(...evidence.text.map((t) => t.ratio))).toBeGreaterThanOrEqual(
    4.5,
  );
  expect(
    Math.min(...evidence.boundaries.map((t) => t.ratio)),
  ).toBeGreaterThanOrEqual(3);
  return {
    minimumTarget: Math.min(
      ...evidence.targets.map((t) => Math.min(t.width, t.height)),
    ),
    minimumTextContrast: Math.min(...evidence.text.map((t) => t.ratio)),
    minimumBoundaryContrast: Math.min(
      ...evidence.boundaries.map((t) => t.ratio),
    ),
    panel: evidence.panel,
    focus: evidence.focus,
  };
}

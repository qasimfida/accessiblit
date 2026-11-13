/* global document, getComputedStyle */
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium, firefox, webkit } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const engines = { chromium, firefox, webkit };
/** Audit real installed examples without importing repository source into the browser. */
export async function browserExamples(servers, bundle, cdnHtml) {
  const rows = [];
  for (const [name, engine] of Object.entries(engines)) {
    const browser = await engine.launch({
      headless: !process.env.ACCESSIBLIT_HEADED,
    });
    try {
      for (const format of ['html', 'cdn', 'esm', 'react', 'next']) {
        const context = await browser.newContext({
          viewport: { width: 320, height: 256 },
        });
        const page = await context.newPage();
        page.setDefaultTimeout(15000);
        console.log('PACKED_BROWSER', name, format);
        const errors = [];
        page.on('pageerror', (e) => errors.push(e.message));
        page.on('console', (m) => {
          if (m.type() === 'error') errors.push(m.text());
        });
        if (format === 'cdn') {
          await page.route(
            'https://cdn.jsdelivr.net/npm/@qasimfida/accessiblit@0.0.0/dist/accessiblit.min.js',
            (route) =>
              route.fulfill({ contentType: 'text/javascript', body: bundle }),
          );
          await page.route('**/cdn.html', (route) =>
            route.fulfill({ contentType: 'text/html', body: cdnHtml }),
          );
        }
        const url =
          format === 'cdn'
            ? servers.html.url + '/cdn.html'
            : format === 'esm'
              ? servers.react.url + '/esm.html'
              : servers[format].url;
        await page.goto(url);
        const launcher = page.getByRole('button', {
          name: 'Open accessibility options',
        });
        await launcher.waitFor();
        assert.equal(await page.locator('[data-accessiblit-host]').count(), 1);
        if (format === 'esm') assert.ok((await launcher.boundingBox()).x < 50);
        const closed = await new AxeBuilder({ page })
          .include('[data-accessiblit-host]')
          .analyze();
        assert.deepEqual(closed.violations, []);
        // axe closes an auxiliary tab; restore the real page before native input.
        await page.bringToFront();
        await page.keyboard.press('Alt+KeyA');
        const dialog = page.getByRole('dialog', {
          name: 'Accessibility options',
        });
        await dialog.waitFor();
        const open = await new AxeBuilder({ page })
          .include('[data-accessiblit-host]')
          .analyze();
        assert.deepEqual(open.violations, []);
        await page.bringToFront();
        await page.waitForFunction(() => document.hasFocus());
        const tab =
          name === 'webkit' && process.platform === 'darwin'
            ? 'Alt+Tab'
            : 'Tab';
        const names = [];
        for (let i = 0; i < 40; i++) {
          await page.keyboard.press(tab);
          const focused = await page.evaluate(() => {
            const root = document.querySelector(
              '[data-accessiblit-host]',
            ).shadowRoot;
            const element = root.activeElement;
            if (!element) return null;
            return (
              element.getAttribute('aria-label') ??
              element.textContent ??
              element.tagName
            );
          });
          if (focused === null) break;
          names.push(focused);
          if (focused === 'Reset all') break;
        }
        assert.ok(names.includes('Reset all'));
        await page.keyboard.press('Escape');
        assert.equal(
          await launcher.evaluate((e) => e.getRootNode().activeElement === e),
          true,
        );
        await page.keyboard.press('Alt+KeyA');
        const measured = await page.evaluate(() => {
          const root = document.querySelector(
            '[data-accessiblit-host]',
          ).shadowRoot;
          const controls = [...root.querySelectorAll('button,input')]
            .map((e) => e.getBoundingClientRect())
            .filter((r) => r.width && r.height);
          const button = root.querySelector('.accessiblit-launcher');
          const focus = getComputedStyle(root.activeElement);
          const panel = root.querySelector('[role=dialog]');
          return {
            minimumTarget: Math.min(
              ...controls.map((r) => Math.min(r.width, r.height)),
            ),
            focusWidth: parseFloat(focus.outlineWidth),
            foreground: getComputedStyle(button).color,
            background: getComputedStyle(button).backgroundColor,
            overflow: panel.scrollWidth - panel.clientWidth,
          };
        });
        assert.ok(measured.minimumTarget >= 24);
        assert.ok(measured.focusWidth >= 2);
        assert.ok(measured.overflow <= 1);
        if (process.env.ACCESSIBLIT_PACKAGING_EVIDENCE) {
          const folder = new URL(
            '../../reports/assets/phase-6/',
            import.meta.url,
          );
          await mkdir(folder, { recursive: true });
          await page.screenshot({
            path: new URL(`${name}-${format}.png`, folder).pathname,
          });
        }
        await page.keyboard.press('Escape');
        const remounts = [];
        const verifyRemount = async (owner, expectedHidden) => {
          await page
            .locator('[data-accessiblit-host]')
            .waitFor({ state: 'attached' });
          assert.equal(
            await page.locator('[data-accessiblit-host]').count(),
            1,
          );
          const hiddenBeforeShortcut = await page
            .locator('[data-accessiblit-host] .accessiblit-launcher')
            .evaluate((element) => element.hidden);
          if (expectedHidden !== undefined)
            assert.equal(hiddenBeforeShortcut, expectedHidden);
          // A focused host control may intentionally hide an overlapping launcher; the shortcut must still work.
          await page.keyboard.press('Alt+KeyA');
          await dialog.waitFor();
          await page.keyboard.press('Escape');
          await launcher.waitFor();
          assert.equal(
            await launcher.evaluate(
              (element) => element.getRootNode().activeElement === element,
            ),
            true,
          );
          remounts.push({ owner, hiddenBeforeShortcut });
        };
        if (format === 'react') {
          await page
            .getByRole('button', { name: 'Unmount widget', exact: true })
            .click();
          await page.waitForFunction(
            () => !document.querySelector('[data-accessiblit-host]'),
          );
          // Reproduce the protected-focus state independently of platform button metrics.
          await page.addStyleTag({
            content:
              '.example-focus-overlap{position:fixed;inset-inline-end:16px;inset-block-end:16px;inline-size:64px;block-size:48px}',
          });
          await page
            .getByRole('button', { name: 'Effect snippet', exact: true })
            .evaluate((element) =>
              element.classList.add('example-focus-overlap'),
            );
          await page
            .getByRole('button', { name: 'Effect snippet', exact: true })
            .focus();
          await page.keyboard.press('Space');
          await verifyRemount('effect', true);
          assert.equal(
            await page.locator('[data-accessiblit-host]').count(),
            1,
          );
          await page
            .getByRole('button', { name: 'Unmount widget', exact: true })
            .click();
          await page.waitForFunction(
            () => !document.querySelector('[data-accessiblit-host]'),
          );
          await page
            .getByRole('button', { name: 'Component example', exact: true })
            .click();
          await verifyRemount('component');
        }
        if (format === 'next') {
          await page
            .getByRole('button', { name: 'Unmount widget', exact: true })
            .click();
          await page.waitForFunction(
            () => !document.querySelector('[data-accessiblit-host]'),
          );
          await page
            .getByRole('button', { name: 'Mount widget', exact: true })
            .click();
          await verifyRemount('next');
        }
        assert.deepEqual(errors, []);
        rows.push({
          browser: name,
          format,
          axeClosed: closed.violations.length,
          axeOpen: open.violations.length,
          measured,
          tabStops: names.length,
          remounts,
        });
        await context.close();
      }
    } finally {
      await browser.close();
    }
  }
  return rows;
}

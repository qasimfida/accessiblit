import assert from 'node:assert/strict';
import { chromium, firefox, webkit } from '@playwright/test';

/** Mount the extracted examples in isolated documents and prove their advertised cleanup. */
export async function checkSnippetBrowsers(url, iife) {
  const rows = [];
  for (const [name, engine] of Object.entries({ chromium, firefox, webkit })) {
    const browser = await engine.launch();
    try {
      for (const id of [
        'cdn',
        'self-hosted',
        'esm',
        'lifecycle',
        'react',
        'next',
      ]) {
        const context = await browser.newContext();
        try {
          const page = await context.newPage(),
            errors = [];
          page.on('pageerror', (error) => errors.push(error.message));
          page.on('console', (message) => {
            if (message.type() === 'error') errors.push(message.text());
          });
          if (id === 'react' || id === 'next')
            await page.addInitScript(() => {
              const lifecycle = { created: 0, removed: 0 };
              Reflect.set(globalThis, '__siteStrictLifecycle', lifecycle);
              new globalThis.MutationObserver((records) => {
                for (const record of records) {
                  for (const node of record.addedNodes)
                    if (
                      node.nodeType === 1 &&
                      node.hasAttribute('data-accessiblit-host')
                    )
                      lifecycle.created++;
                  for (const node of record.removedNodes)
                    if (
                      node.nodeType === 1 &&
                      node.hasAttribute('data-accessiblit-host')
                    )
                      lifecycle.removed++;
                }
              }).observe(globalThis.document, {
                childList: true,
                subtree: true,
              });
            });
          // The public package is not released; exercise the exact URL against packed bytes.
          await context.route(
            'https://cdn.jsdelivr.net/npm/@qasimfida/accessiblit@0.0.0/dist/accessiblit.min.js',
            (route) =>
              route.fulfill({ contentType: 'text/javascript', body: iife }),
          );
          await page.goto(`${url}/${id}.html`);
          if (id === 'lifecycle') {
            assert.equal(
              await page.locator('[data-accessiblit-host]').count(),
              0,
            );
            const state = await page.evaluate(() =>
              Reflect.get(globalThis, '__snippetState'),
            );
            assert.equal(state.fontSize, 120);
            assert.equal(Object.keys(state).length, 18);
          } else {
            const launcher = page.getByRole('button', {
              name: 'Open accessibility options',
              exact: true,
            });
            await launcher.waitFor();
            assert.equal(
              await page.locator('[data-accessiblit-host]').count(),
              1,
            );
            if (id === 'react' || id === 'next')
              await page.waitForFunction(
                () =>
                  Reflect.get(globalThis, '__siteStrictLifecycle').created >= 2,
              );
            if (id === 'esm') {
              const box = await launcher.boundingBox();
              assert.ok(
                box.x < 100,
                'documented bottom-left option must be honored',
              );
            }
            await launcher.click();
            await page
              .getByRole('dialog', { name: 'Accessibility options' })
              .waitFor();
            await page
              .getByRole('button', { name: 'Close', exact: true })
              .click();
            await page.evaluate((id) => {
              if (id === 'cdn' || id === 'self-hosted')
                globalThis.Accessiblit.destroy();
              else Reflect.get(globalThis, '__snippetUnmount')();
            }, id);
            await page.waitForFunction(
              () =>
                !globalThis.document.querySelector('[data-accessiblit-host]'),
            );
          }
          assert.deepEqual(errors, []);
          const strictMode =
            id === 'react' || id === 'next'
              ? await page.evaluate(() =>
                  Reflect.get(globalThis, '__siteStrictLifecycle'),
                )
              : null;
          if (strictMode) assert.equal(strictMode.created, strictMode.removed);
          rows.push({
            browser: name,
            snippet: id,
            errors,
            cleanup: true,
            strictMode,
          });
        } finally {
          await context.close();
        }
      }
    } finally {
      await browser.close();
    }
  }
  return rows;
}

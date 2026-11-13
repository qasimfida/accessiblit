import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import type { FeatureId } from '../src/core/types';
import './helpers/content';
const bundle = readFileSync(
  new URL('../dist/accessiblit.min.js', import.meta.url),
  'utf8',
);
const article = readFileSync(
  new URL('../fixtures/article.html', import.meta.url),
  'utf8',
).replace(
  '<script type="module" src="/content.mjs"></script>',
  '<script src="/colour-bundle.js"></script><script>window.contentInit=Accessiblit.init;window.contentInstance=Accessiblit.init({storageKey:"phase4:paint"});</script>',
);
for (const [id, colour, bg] of [
  ['darkMode', 'rgb(255, 255, 255)', 'rgb(18, 18, 18)'],
  ['highContrast', 'rgb(255, 255, 255)', 'rgb(0, 0, 0)'],
  ['monochrome', 'rgb(41, 41, 41)', 'rgba(0, 0, 0, 0)'],
  ['lowSaturation', 'rgb(35, 42, 48)', 'rgba(0, 0, 0, 0)'],
] as const)
  test(`${id} is restored on the first rendered content frame`, async ({
    page,
    browserName,
  }) => {
    await page.route('**/colour-bundle.js', (route) =>
      route.fulfill({ contentType: 'application/javascript', body: bundle }),
    );
    await page.route('**/early-colour', (route) =>
      route.fulfill({ contentType: 'text/html', body: article }),
    );
    await page.addInitScript(() => {
      const rows: string[][] = [];
      Reflect.set(window, 'colourFrames', rows);
      const tick = () => {
        const probe = document.querySelector('[data-content-probe]');
        if (probe) {
          const s = getComputedStyle(probe);
          rows.push([s.color, s.backgroundColor]);
        }
        if (rows.length < 5) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await page.goto('/early-colour');
    await page.evaluate(
      (id) => window.contentInstance.setFeature(id as FeatureId, true),
      id,
    );
    await page.reload();
    await page.waitForFunction(
      () => Reflect.get(window, 'colourFrames').length >= 5,
    );
    const rows = await page.evaluate(
      () => Reflect.get(window, 'colourFrames') as string[][],
    );
    for (const row of rows) expect(row).toEqual([colour, bg]);
    console.log('COLOUR_FIRST_PAINT', browserName, id, JSON.stringify(rows));
  });

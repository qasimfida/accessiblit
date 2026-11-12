import { expect, test } from '@playwright/test';
import type { FeatureId } from '../src/core/types';
import { loadContent } from './helpers/content';
const cases: [FeatureId, unknown, unknown][] = [
  ['lineHeight', 2, 0],
  ['letterSpacing', 0.2, 0],
  ['wordSpacing', 0.32, 0],
  ['textAlign', 'right', 'off'],
  ['contentScale', 200, 100],
  ['readableFont', 'readable', 'off'],
];
for (const [id, enabled, disabled] of cases)
  test(`${id} meets the 5000-node toggle budget`, async ({
    page,
    browserName,
  }) => {
    await loadContent(page, 'article');
    await page.evaluate(() => {
      const fragment = document.createDocumentFragment();
      for (let i = 0; i < 5000; i++) {
        const p = document.createElement('p');
        p.textContent = 'Readable text ' + i;
        fragment.append(p);
      }
      document.querySelector('main')!.replaceChildren(fragment);
    });
    const rows = await page.evaluate(
      async ({ id, enabled, disabled }) => {
        const rows = [];
        for (const value of [enabled, disabled, enabled, disabled]) {
          const start = performance.now();
          window.contentInstance.setFeature(id, value);
          const synchronous = performance.now() - start;
          await new Promise<void>((resolve) =>
            requestAnimationFrame(() => resolve()),
          );
          rows.push({ synchronous, nextFrame: performance.now() - start });
        }
        return rows;
      },
      { id, enabled, disabled },
    );
    console.log('CONTENT_PERFORMANCE', browserName, id, JSON.stringify(rows));
    for (const row of rows) {
      expect(row.synchronous).toBeLessThan(100);
      expect(row.nextFrame).toBeLessThan(100);
    }
  });

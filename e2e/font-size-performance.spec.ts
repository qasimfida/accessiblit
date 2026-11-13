import { expect, test } from '@playwright/test';
import { loadContent } from './helpers/content';
import { PERFORMANCE_TRACE } from './helpers/performance';

test.use({ trace: PERFORMANCE_TRACE });

test('fontSize meets the 5000-element toggle budget', async ({
  page,
  browserName,
}) => {
  await loadContent(page, 'article');
  await page.evaluate(() => {
    const main = document.querySelector('main')!,
      fragment = document.createDocumentFragment();
    main.replaceChildren();
    for (let index = 0; index < 5000; index++) {
      const p = document.createElement('p');
      p.textContent = `Text ${index}`;
      fragment.append(p);
    }
    main.append(fragment);
  });
  const results = await page.evaluate(async () => {
    const rows = [];
    for (const value of [120, 140, 160, 180, 200, 100]) {
      const start = performance.now();
      window.contentInstance.setFeature('fontSize', value);
      const synchronous = performance.now() - start;
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
      rows.push({ value, synchronous, nextFrame: performance.now() - start });
    }
    return rows;
  });
  console.log('CONTENT_FONT_PERFORMANCE', browserName, JSON.stringify(results));
  for (const row of results) {
    expect(row.synchronous).toBeLessThan(100);
    expect(row.nextFrame).toBeLessThan(100);
  }
});

import { expect, test } from '@playwright/test';
import { loadContent } from './helpers/content';
import { measureTransitions, PERFORMANCE_TRACE } from './helpers/performance';

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
  const results = await page.evaluate(measureTransitions, {
    id: 'fontSize' as const,
    values: [120, 140, 160, 180, 200, 100],
  });
  console.log('CONTENT_FONT_PERFORMANCE', browserName, JSON.stringify(results));
  for (const row of results) {
    expect(row.synchronous).toBeLessThan(100);
    expect(row.nextFrame).toBeLessThan(100);
  }
});

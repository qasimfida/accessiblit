import { expect, test } from '@playwright/test';
import { loadQA, auditQA } from './helpers/qa';
test('keeps same-origin and opaque frame text independent without asset errors', async ({
  page,
}, info) => {
  const errors = await loadQA(page, 'iframes', 'standard');
  const text = page
    .frameLocator('iframe[title="Same-origin article"]')
    .locator('p');
  const before = await text.evaluate((e) => getComputedStyle(e).fontSize);
  expect(
    await page
      .frameLocator('iframe[sandbox]')
      .locator('body')
      .evaluate(() => globalThis.origin),
  ).toBe('null');
  await page.evaluate(() => window.qaInstance.setFeature('fontSize', 200));
  await expect(text).toHaveCSS('font-size', before);
  await auditQA(page);
  expect(errors).toEqual([]);
  console.log(
    'QA_BOUNDARY',
    info.project.name,
    JSON.stringify({ frameFont: before, opaqueOrigin: true, errors }),
  );
});

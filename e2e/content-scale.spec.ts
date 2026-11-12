import { expect, test } from '@playwright/test';
import { CONTENT_FIXTURES, loadContent } from './helpers/content';
for (const fixture of CONTENT_FIXTURES)
  test(`contentScale every level on ${fixture}`, async ({ page }) => {
    await loadContent(page, fixture);
    const font = await page
      .locator('[data-content-probe]')
      .evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
    for (let value = 100; value <= 200; value += 10) {
      await page.evaluate(
        (value) => window.contentInstance.setFeature('contentScale', value),
        value,
      );
      expect(
        await page
          .locator('html')
          .evaluate((e) =>
            parseFloat(getComputedStyle(e).getPropertyValue('zoom')),
          ),
      ).toBeCloseTo(value / 100, 3);
      expect(
        await page
          .locator('[data-content-probe]')
          .evaluate((e) => parseFloat(getComputedStyle(e).fontSize)),
      ).toBeCloseTo(font, 5);
    }
    await page.evaluate(() => window.contentInstance.reset());
  });
test('composes with owner zoom and restores it', async ({ page }) => {
  await loadContent(page, 'article');
  await page.addStyleTag({ content: 'html{zoom:1.25}' });
  await page.evaluate(() =>
    window.contentInstance.setFeature('contentScale', 160),
  );
  expect(
    await page
      .locator('html')
      .evaluate((e) =>
        parseFloat(getComputedStyle(e).getPropertyValue('zoom')),
      ),
  ).toBe(2);
  await page.evaluate(() => window.contentInstance.reset());
  expect(
    await page
      .locator('html')
      .evaluate((e) =>
        parseFloat(getComputedStyle(e).getPropertyValue('zoom')),
      ),
  ).toBe(1.25);
});
test('keeps fixed and sticky anchors while scrolling at maximum scale', async ({
  page,
}) => {
  await loadContent(page, 'fixed-header');
  await page.evaluate(() =>
    window.contentInstance.setFeature('contentScale', 200),
  );
  await page.evaluate(() => window.scrollTo(0, 600));
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  const header = (await page.locator('#fixed-header').boundingBox())!,
    sticky = (await page.locator('#sticky-note').boundingBox())!;
  expect(header.y).toBe(0);
  expect(sticky.y).toBeGreaterThanOrEqual(header.height);
  expect(header.width).toBe(page.viewportSize()!.width);
});

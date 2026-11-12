import { expect, test } from '@playwright/test';
import { CONTENT_FIXTURES, loadContent } from './helpers/content';
const protectedSelector =
  'nav,[role="navigation"],.cards,.grid,input,select,textarea,button,#control-wrapper';
for (const fixture of CONTENT_FIXTURES)
  test(`textAlign every level protects layout on ${fixture}`, async ({
    page,
  }) => {
    await loadContent(page, fixture);
    const probe = page.locator('[data-content-probe]');
    const before = await probe.evaluate((e) => getComputedStyle(e).textAlign);
    const protectedBefore = await page
      .locator(protectedSelector)
      .evaluateAll((nodes) => nodes.map((e) => getComputedStyle(e).textAlign));
    for (const value of ['off', 'left', 'center', 'right']) {
      await page.evaluate(
        (value) => window.contentInstance.setFeature('textAlign', value),
        value,
      );
      expect(await probe.evaluate((e) => getComputedStyle(e).textAlign)).toBe(
        value === 'off' ? before : value,
      );
      expect(
        await page
          .locator(protectedSelector)
          .evaluateAll((nodes) =>
            nodes.map((e) => getComputedStyle(e).textAlign),
          ),
      ).toEqual(protectedBefore);
    }
    await page.evaluate(() => window.contentInstance.reset());
  });

import { expect, test } from '@playwright/test';
import { CONTENT_FIXTURES, loadContent } from './helpers/content';
import type { FeatureId } from '../src/core/types';
const cases = [
  { id: 'lineHeight', property: 'line-height', levels: [0, 1.5, 1.75, 2] },
  {
    id: 'letterSpacing',
    property: 'letter-spacing',
    levels: [0, 0.12, 0.16, 0.2],
  },
  {
    id: 'wordSpacing',
    property: 'word-spacing',
    levels: [0, 0.16, 0.24, 0.32],
  },
] satisfies { id: FeatureId; property: string; levels: number[] }[];
for (const feature of cases)
  for (const fixture of CONTENT_FIXTURES)
    test(`${feature.id} every level on ${fixture}`, async ({ page }) => {
      await loadContent(page, fixture);
      const probe = page.locator('[data-content-probe]');
      const before = await probe.evaluate(
        (element, property) => ({
          raw: getComputedStyle(element).getPropertyValue(property),
          font: parseFloat(getComputedStyle(element).fontSize),
          margin: getComputedStyle(element).marginBlockEnd,
        }),
        feature.property,
      );
      for (const value of feature.levels) {
        await page.evaluate(
          ({ id, value }) => window.contentInstance.setFeature(id, value),
          { id: feature.id, value },
        );
        const actual = await probe.evaluate(
          (element, property) => ({
            raw: getComputedStyle(element).getPropertyValue(property),
            margin: getComputedStyle(element).marginBlockEnd,
            paragraph: element.tagName === 'P',
          }),
          feature.property,
        );
        if (value === 0) expect(actual.raw).toBe(before.raw);
        else expect(parseFloat(actual.raw)).toBeCloseTo(before.font * value, 1);
        if (feature.id === 'lineHeight' && actual.paragraph) {
          if (value === 0) expect(actual.margin).toBe(before.margin);
          else
            expect(parseFloat(actual.margin)).toBeCloseTo(before.font * 2, 1);
        }
      }
      await page.evaluate(() => window.contentInstance.reset());
    });

test('letter spacing wraps long tokens without changing page markup', async ({
  page,
}) => {
  await loadContent(page, 'flex');
  const paragraph = page.locator('#grid-layout p').first();
  await paragraph.evaluate((element) => {
    element.textContent = 'independent'.repeat(8);
  });
  const before = await paragraph.evaluate((element) => ({
    html: element.outerHTML,
    wrap: getComputedStyle(element).overflowWrap,
  }));
  await page.evaluate(() =>
    window.contentInstance.setFeature('letterSpacing', 0.2),
  );
  const adjusted = await paragraph.evaluate((element) => ({
    overflow: element.scrollWidth - element.clientWidth,
    wrap: getComputedStyle(element).overflowWrap,
  }));
  expect(adjusted.overflow).toBeLessThanOrEqual(1);
  expect(adjusted.wrap).toBe('anywhere');
  await page.evaluate(() => window.contentInstance.reset());
  expect(
    await paragraph.evaluate((element) => ({
      html: element.outerHTML,
      wrap: getComputedStyle(element).overflowWrap,
    })),
  ).toEqual(before);
});

import { expect, test } from '@playwright/test';
import { CONTENT_FIXTURES, loadContent } from './helpers/content';
const selector =
  'main h1,main h2,main p,main span,main strong,main input,main select,main textarea,main button,main label,main legend,main th,main td,main caption,nav a,#sticky-note';
for (const fixture of CONTENT_FIXTURES)
  test(`fontSize every level on ${fixture}`, async ({ page }) => {
    await loadContent(page, fixture);
    const baseline = await page.locator(selector).evaluateAll((nodes) =>
      nodes
        .filter(
          (node) =>
            node.matches('input,select,textarea') ||
            [...node.childNodes].some(
              (n) => n.nodeType === 3 && !!n.textContent?.trim(),
            ),
        )
        .map((node) => ({
          size: parseFloat(getComputedStyle(node).fontSize),
          inline: node.getAttribute('style'),
        })),
    );
    expect(baseline.length).toBeGreaterThan(0);
    for (let value = 80; value <= 200; value += 10) {
      await page.evaluate(
        (value) => window.contentInstance.setFeature('fontSize', value),
        value,
      );
      const actual = await page.locator(selector).evaluateAll((nodes) =>
        nodes
          .filter(
            (node) =>
              node.matches('input,select,textarea') ||
              [...node.childNodes].some(
                (n) => n.nodeType === 3 && !!n.textContent?.trim(),
              ),
          )
          .map((node) => ({
            size: parseFloat(getComputedStyle(node).fontSize),
            inline: node.getAttribute('style'),
          })),
      );
      expect(actual).toHaveLength(baseline.length);
      for (let index = 0; index < actual.length; index++) {
        expect(actual[index]!.size).toBeCloseTo(
          (baseline[index]!.size * value) / 100,
          1,
        );
        expect(actual[index]!.inline).toBe(baseline[index]!.inline);
      }
    }
    await page.evaluate(() => window.contentInstance.reset());
  });

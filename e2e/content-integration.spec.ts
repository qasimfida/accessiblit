import { mkdir } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { CONTENT_FIXTURES, loadContent } from './helpers/content';

for (const fixture of CONTENT_FIXTURES)
  test(`all content features combine and restore on ${fixture}`, async ({
    page,
    browserName,
  }) => {
    await loadContent(page, fixture);
    const baseline = await page.evaluate(() => {
      window.contentInstance.destroy();
      return document.documentElement.outerHTML;
    });
    const before = await page.evaluate(() => {
      window.contentInstance = window.contentInit({ persist: false });
      const host = document.querySelector('[data-accessiblit-host]')!;
      const button = host.shadowRoot!.querySelector('button')!;
      return {
        font: getComputedStyle(button).fontSize,
        width: button.getBoundingClientRect().width,
      };
    });
    await page.evaluate(() => {
      const instance = window.contentInstance;
      instance.setFeature('fontSize', 200);
      instance.setFeature('lineHeight', 2);
      instance.setFeature('letterSpacing', 0.2);
      instance.setFeature('wordSpacing', 0.32);
      instance.setFeature('textAlign', 'right');
      instance.setFeature('contentScale', 200);
      instance.setFeature('readableFont', 'dyslexia-friendly');
    });
    await page.waitForTimeout(100);
    const combined = await page.evaluate(() => {
      const host = document.querySelector('[data-accessiblit-host]')!;
      const button = host.shadowRoot!.querySelector('button')!;
      const clipped = [
        ...document.querySelectorAll(
          'main p,main h1,main h2,main td,main th,main label,main legend',
        ),
      ]
        .filter((e) => {
          const node = e as HTMLElement;
          return (
            node.clientWidth > 0 &&
            (node.scrollWidth > node.clientWidth + 1 ||
              node.scrollHeight > node.clientHeight + 1)
          );
        })
        .map((e) => e.outerHTML);
      return {
        font: getComputedStyle(button).fontSize,
        width: button.getBoundingClientRect().width,
        clipped,
      };
    });
    expect(combined.font).toBe(before.font);
    expect(combined.width).toBeCloseTo(before.width, 2);
    expect(combined.clipped).toEqual([]);
    if (process.env.ACCESSIBLIT_CONTENT_EVIDENCE) {
      const folder = new URL('../reports/assets/phase-3/', import.meta.url);
      await mkdir(folder, { recursive: true });
      await page.screenshot({
        path: new URL(`${browserName}-${fixture}-maximum.png`, folder).pathname,
        fullPage: true,
        caret: 'initial',
      });
    }
    await page.evaluate(() => window.contentInstance.reset());
    const reset = await page.evaluate(() => {
      const clone = document.documentElement.cloneNode(true) as Element;
      clone.querySelector('[data-accessiblit-host]')!.remove();
      return clone.outerHTML;
    });
    expect(reset).toBe(baseline);
    await page.evaluate(() => {
      window.contentInstance.setFeature('fontSize', 180);
      window.contentInstance.setFeature('textAlign', 'center');
      window.contentInstance.setFeature('readableFont', 'readable');
      window.contentInstance.destroy();
    });
    expect(await page.evaluate(() => document.documentElement.outerHTML)).toBe(
      baseline,
    );
  });

test('maximum content settings preserve accessible controls', async ({
  page,
}) => {
  await loadContent(page, 'article');
  await page.evaluate(() => {
    for (const [id, value] of Object.entries({
      fontSize: 200,
      lineHeight: 2,
      letterSpacing: 0.2,
      wordSpacing: 0.32,
      textAlign: 'right',
      contentScale: 200,
      readableFont: 'dyslexia-friendly',
    }))
      window.contentInstance.setFeature(id as 'fontSize', value);
  });
  for (const open of [false, true]) {
    if (open) await page.evaluate(() => window.contentInstance.open());
    const result = await new AxeBuilder({ page })
      .include('[data-accessiblit-host]')
      .analyze();
    expect(result.violations).toEqual([]);
  }
});

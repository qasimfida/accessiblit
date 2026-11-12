import { expect, test } from '@playwright/test';
import type { FeatureId } from '../src/core/types';
import { loadContent } from './helpers/content';
const ids: FeatureId[] = [
  'darkMode',
  'highContrast',
  'monochrome',
  'lowSaturation',
];
test('all sixteen combinations are order independent and preserve positioning', async ({
  page,
  browserName,
}) => {
  await loadContent(page, 'colour-lab');
  await page.evaluate(() => {
    const probe = document.createElement('div');
    probe.id = 'nested-fixed';
    probe.textContent = 'Fixed inside main';
    probe.style.cssText = 'position:fixed;inset:120px 8px auto auto';
    document.querySelector('main')!.append(probe);
  });
  for (let mask = 0; mask < 16; mask++) {
    const enabled = ids.filter((_, i) => mask & (1 << i));
    const rows = [];
    for (const order of [enabled, [...enabled].reverse()]) {
      await page.evaluate((order) => {
        window.contentInstance.reset();
        for (const id of order) window.contentInstance.setFeature(id, true);
      }, order);
      await page.waitForTimeout(50);
      await page.evaluate(() => window.scrollTo(0, 600));
      rows.push(
        await page.evaluate(() => {
          const style = (selector: string) => {
            const s = getComputedStyle(document.querySelector(selector)!);
            return {
              color: s.color,
              background: s.backgroundColor,
              filter: s.filter,
              image: s.backgroundImage,
              blend: s.backgroundBlendMode,
            };
          };
          return {
            copy: style('#copy'),
            link: style('#copy a'),
            image: style('#sample-image'),
            background: style('.background'),
            fixed: document.querySelector('#fixed')!.getBoundingClientRect()
              .top,
            nested: document
              .querySelector('#nested-fixed')!
              .getBoundingClientRect().top,
            sticky: document.querySelector('#sticky')!.getBoundingClientRect()
              .top,
          };
        }),
      );
    }
    expect(rows[1]).toEqual(rows[0]);
    expect(rows[0]!.fixed).toBe(0);
    expect(rows[0]!.nested).toBe(120);
    if (mask === 1) expect(rows[0]!.link.color).toBe('rgb(179, 219, 255)');
    if (mask === 2) expect(rows[0]!.link.color).toBe('rgb(255, 255, 0)');
    if (mask & 4) expect(rows[0]!.image.filter).toBe('saturate(0)');
    console.log('COLOUR_MATRIX', browserName, mask, JSON.stringify(rows[0]));
  }
});
test('forced colours suspend effects and display the system note', async ({
  page,
}) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await loadContent(page, 'article');
  const sample = () =>
    page.locator('[data-content-probe]').evaluate((e) => {
      const s = getComputedStyle(e);
      return [s.color, s.backgroundColor, s.filter];
    });
  const before = await sample();
  await page.evaluate((ids) => {
    for (const id of ids) window.contentInstance.setFeature(id, true);
    window.contentInstance.open();
  }, ids);
  await expect(page.locator('.accessiblit-forced-colours-note')).toBeVisible();
  expect(await sample()).toEqual(before);
  await page.emulateMedia({ forcedColors: 'none' });
  await expect(page.locator('.accessiblit-forced-colours-note')).toBeHidden();
  expect(await sample()).not.toEqual(before);
});
test('print restores owner paints with every colour option selected', async ({
  page,
}) => {
  await page.emulateMedia({ media: 'print' });
  await loadContent(page, 'colour-lab');
  const sample = () =>
    page.locator('#copy,.gradient,.background,img').evaluateAll((nodes) =>
      nodes.map((e) => {
        const s = getComputedStyle(e);
        return [s.color, s.backgroundColor, s.backgroundImage, s.filter];
      }),
    );
  const before = await sample();
  await page.evaluate((ids) => {
    for (const id of ids) window.contentInstance.setFeature(id, true);
  }, ids);
  expect(await sample()).toEqual(before);
  await page.emulateMedia({ media: 'screen' });
  expect(await sample()).not.toEqual(before);
  await page.emulateMedia({ media: 'print' });
  expect(await sample()).toEqual(before);
});

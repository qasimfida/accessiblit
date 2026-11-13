import { expect, test } from '@playwright/test';
import { loadContent } from './helpers/content';
for (const scale of [100, 200])
  test(
    'keeps keyboard focus below a fixed header at scale ' + scale,
    async ({ page, browserName }) => {
      await loadContent(page, 'fixed-header');
      await page.keyboard.press('Tab');
      await page.evaluate((scale) => {
        const button = document.createElement('button');
        button.id = 'header-focus-probe';
        button.textContent = 'Focus below header';
        const spacer = document.createElement('div');
        spacer.style.height = '1200px';
        document.querySelector('main')!.append(button, spacer);
        window.contentInstance.setFeature('contentScale', scale);
      }, scale);
      await page
        .locator('#header-focus-probe')
        .evaluate((e) => e.scrollIntoView({ block: 'start' }));
      await page.locator('#header-focus-probe').focus();
      const before = await page
        .locator('#header-focus-probe')
        .evaluate((e) => ({
          top: e.getBoundingClientRect().top,
          header: document.querySelector('nav')!.getBoundingClientRect().bottom,
        }));
      expect(before.top).toBeLessThan(before.header);
      await page.evaluate(() =>
        window.contentInstance.setFeature('focusHighlight', true),
      );
      await expect(page.locator('#header-focus-probe')).toHaveCSS(
        'outline-width',
        '3px',
      );
      const evidence = await page
        .locator('#header-focus-probe')
        .evaluate(async (e) => {
          await new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          );
          const s = getComputedStyle(e);
          return {
            top: e.getBoundingClientRect().top,
            header: document.querySelector('nav')!.getBoundingClientRect()
              .bottom,
            outline: s.outlineColor,
            shadow: s.boxShadow,
            padding: getComputedStyle(document.documentElement)
              .scrollPaddingTop,
          };
        });
      expect(evidence.top).toBeGreaterThanOrEqual(evidence.header + 7);
      expect(evidence.outline).toBe('rgb(0, 0, 0)');
      expect(evidence.shadow).toContain('rgb(255, 255, 255)');
      console.log(
        'NAVIGATION_FOCUS',
        browserName,
        scale,
        JSON.stringify({ before, after: evidence }),
      );
    },
  );
test('saturation never freezes a transient focus shadow into page paint', async ({
  page,
}) => {
  await loadContent(page, 'form');
  await page.evaluate(() => {
    window.contentInstance.setFeature('focusHighlight', true);
    window.contentInstance.setFeature('monochrome', true);
  });
  await page.keyboard.press('Tab');
  await page.locator('#name').focus();
  await page.evaluate(() => window.contentInstance.setFeature('fontSize', 120));
  await expect(page.locator('#name')).toHaveCSS('outline-width', '3px');
  await page.locator('#email').focus();
  await expect(page.locator('#name')).toHaveCSS('box-shadow', 'none');
});

test('does not scroll a visible fixed-header link', async ({ page }) => {
  await loadContent(page, 'fixed-header');
  await page.evaluate(() => {
    window.scrollTo(0, 600);
    window.contentInstance.setFeature('focusHighlight', true);
  });
  await page.waitForTimeout(50);
  const before = await page.evaluate(() => scrollY);
  await page
    .locator('nav a')
    .first()
    .evaluate((e) => (e as HTMLElement).focus({ preventScroll: true }));
  await page.waitForTimeout(50);
  expect(await page.evaluate(() => scrollY)).toBe(before);
});
test('exposes at least part of an oversized control below the header', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 180 });
  await loadContent(page, 'fixed-header');
  await page.keyboard.press('Tab');
  await page.evaluate(() => {
    (document.querySelector('nav') as HTMLElement).style.height = '104px';
    const button = document.createElement('button');
    button.id = 'large-focus';
    button.textContent = 'Large focused control';
    button.style.height = '96px';
    const spacer = document.createElement('div');
    spacer.style.height = '1200px';
    document.querySelector('main')!.append(button, spacer);
    button.scrollIntoView({ block: 'start' });
    button.focus();
  });
  const before = await page
    .locator('#large-focus')
    .evaluate((e) => e.getBoundingClientRect().bottom);
  expect(before).toBeLessThanOrEqual(104);
  await page.evaluate(() =>
    window.contentInstance.setFeature('focusHighlight', true),
  );
  await expect
    .poll(() =>
      page
        .locator('#large-focus')
        .evaluate((e) => e.getBoundingClientRect().top),
    )
    .toBeGreaterThanOrEqual(111);
  expect(
    await page
      .locator('#large-focus')
      .evaluate((e) => e.getBoundingClientRect().top),
  ).toBeLessThan(180);
});

import { expect, test } from '@playwright/test';
import { loadSite } from './helpers';

for (const direction of ['ltr', 'rtl'] as const)
  test(`options table scrolls with native keys in ${direction} and releases focus`, async ({
    page,
    browserName,
  }, info) => {
    await page.setViewportSize({ width: 320, height: 640 });
    const errors = await loadSite(
      page,
      'options/',
      direction === 'rtl' ? 'rtl' : 'light',
    );
    await page.bringToFront();
    const tab =
      browserName === 'webkit' && process.platform === 'darwin'
        ? 'Alt+Tab'
        : 'Tab';
    const region = page.getByRole('region', {
      name: 'Configuration options',
      exact: true,
    });
    for (let i = 0; i < 30; i++) {
      if (
        await region.evaluate((element) => document.activeElement === element)
      )
        break;
      await page.keyboard.press(tab);
    }
    await expect(region).toBeFocused();
    const initial = await region.evaluate((element) => element.scrollLeft);
    const forward = direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
    await page.keyboard.press(forward);
    await expect
      .poll(() =>
        region.evaluate(
          (element, start) => Math.abs(element.scrollLeft - start),
          initial,
        ),
      )
      .toBeGreaterThan(1);
    const moved = await region.evaluate((element) => element.scrollLeft);
    await page.keyboard.press(direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft');
    await expect
      .poll(() =>
        region.evaluate(
          (element, start) => Math.abs(element.scrollLeft - start),
          initial,
        ),
      )
      .toBeLessThan(1);
    const focus = await region.evaluate((element) => ({
      width: getComputedStyle(element).outlineWidth,
      style: getComputedStyle(element).outlineStyle,
    }));
    expect(parseFloat(focus.width)).toBeGreaterThanOrEqual(2);
    expect(focus.style).toBe('solid');
    await page.keyboard.press(tab);
    await expect(region).not.toBeFocused();
    expect(errors).toEqual([]);
    console.log(
      'SITE_TABLE_KEYBOARD',
      JSON.stringify({
        project: info.project.name,
        direction,
        initial,
        moved,
        focus,
        tabExit: true,
      }),
    );
  });

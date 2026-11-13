import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { loadSite } from './helpers';

async function tabTo(page: Page, target: Locator, tab: string) {
  for (let i = 0; i < 100; i++) {
    if (
      await target.evaluate(
        (element) =>
          (element.getRootNode() as Document | ShadowRoot).activeElement ===
          element,
      )
    )
      return;
    await page.keyboard.press(tab);
  }
  await expect(target).toBeFocused();
}

test('keyboard visits every content page and operates the real demo', async ({
  page,
  browserName,
}, info) => {
  const tab =
    browserName === 'webkit' && process.platform === 'darwin'
      ? 'Alt+Tab'
      : 'Tab';
  const errors = await loadSite(page, '');
  await page.bringToFront();
  const path: string[] = [];
  await page.keyboard.press(tab);
  const skip = page.getByRole('link', {
    name: 'Skip to main content',
    exact: true,
  });
  await expect(skip).toBeFocused();
  expect((await skip.boundingBox())!.y).toBeGreaterThanOrEqual(0);
  path.push('Skip to main content');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
  path.push('Main');
  const demo = page.getByRole('button', {
    name: 'Open live demo options',
    exact: true,
  });
  await tabTo(page, demo, tab);
  await page.keyboard.press('Space');
  const close = page.getByRole('button', { name: 'Close', exact: true });
  await expect(close).toBeFocused();
  path.push('Open live demo options', 'Close');
  await tabTo(
    page,
    page.getByRole('button', { name: 'Increase Font size', exact: true }),
    tab,
  );
  await page.keyboard.press('Enter');
  await expect(page.getByRole('status')).toHaveText('Font size 110 percent');
  path.push('Increase Font size');
  await tabTo(
    page,
    page.getByRole('button', { name: 'Reset all', exact: true }),
    tab,
  );
  await page.keyboard.press('Space');
  await expect(page.getByRole('status')).toHaveText('All options reset.');
  path.push('Reset all');
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('button', {
      name: 'Open accessibility options',
      exact: true,
    }),
  ).toBeFocused();
  path.push('Launcher focus restored', 'Shift+Tab back to the header');
  for (const [label, route] of [
    ['Install', 'install/'],
    ['Options', 'options/'],
    ['FAQ and privacy', 'faq/'],
    ['Home', ''],
  ] as const) {
    await page.bringToFront();
    const link = page
      .getByRole('navigation', { name: 'Main navigation', exact: true })
      .getByRole('link', { name: label, exact: true });
    // Firefox preserves the skip fragment as its forward-wrap starting point.
    const navigationKey =
      label === 'Install'
        ? tab === 'Alt+Tab'
          ? 'Alt+Shift+Tab'
          : 'Shift+Tab'
        : tab;
    await tabTo(page, link, navigationKey);
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(new RegExp(`/accessiblit/${route}$`));
    path.push(label);
    await expect(page.locator('main h1')).toBeVisible();
  }
  expect(errors).toEqual([]);
  console.log(
    'SITE_KEYBOARD',
    JSON.stringify({ project: info.project.name, tab, path, errors }),
  );
});

import { expect, test } from '@playwright/test';

test('uses opaque system colours for the forced-colour launcher', async ({
  page,
}) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto('/panel.html');
  const launcher = page.getByRole('button', {
    name: 'Open accessibility options',
  });
  await expect(launcher).toBeVisible();
  const colors = await launcher.evaluate((element) => {
    const style = getComputedStyle(element);
    return { foreground: style.color, background: style.backgroundColor };
  });
  expect(colors.background).toMatch(/^rgb\(/);
  expect(colors.foreground).not.toBe(colors.background);
});

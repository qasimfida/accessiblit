import { expect, test } from '@playwright/test';
import { uiEvidence } from './helpers/ui-evidence';

test('keeps shortcut-driven focus visible after pointer input', async ({
  page,
}) => {
  await page.goto('/panel.html');
  await page.waitForFunction(() => !!window.panelInstance);
  await page.getByRole('button', { name: 'Host action', exact: true }).click();
  await page.keyboard.press('Alt+KeyA');
  const close = page.getByRole('button', { name: 'Close', exact: true });
  await expect(close).toBeFocused();
  const evidence = await uiEvidence(page);
  expect(evidence.focus!.style).toBe('solid');
  expect(evidence.focus!.width).toBeGreaterThanOrEqual(2);
  expect(evidence.focus!.ratio).toBeGreaterThanOrEqual(3);
  await close.click();
  const launcher = page.getByRole('button', {
    name: 'Open accessibility options',
  });
  await expect(launcher).toBeFocused();
  await expect(launcher).toHaveCSS('outline-style', 'solid');
});

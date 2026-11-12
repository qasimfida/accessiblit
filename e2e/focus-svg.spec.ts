import { expect, test } from '@playwright/test';

test('never covers a focused host SVG control', async ({ page }) => {
  await page.goto('/panel.html');
  await page.waitForFunction(() => !!window.panelInstance);
  await page.addStyleTag({
    content:
      '#host-graphic{position:fixed;inset-block-end:16px;inset-inline-end:16px;inline-size:48px;block-size:48px}',
  });
  await page.evaluate(() => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'host-graphic';
    svg.setAttribute('tabindex', '0');
    svg.setAttribute('role', 'button');
    svg.setAttribute('aria-label', 'Host graphic control');
    document.body.append(svg);
  });
  const graphic = page.getByRole('button', { name: 'Host graphic control' });
  await graphic.focus();
  await expect(graphic).toBeFocused();
  await expect(page.locator('.accessiblit-launcher')).toBeHidden();
  await page.keyboard.press('Alt+KeyA');
  await expect(
    page.getByRole('dialog', { name: 'Accessibility options' }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('button', { name: 'Open accessibility options' }),
  ).toBeFocused();
});

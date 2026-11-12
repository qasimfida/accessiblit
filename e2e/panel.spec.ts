import { expect, test } from '@playwright/test';
import type { createLifecycle } from '../src/core/lifecycle';
import type { AccessiblitInstance } from '../src/core/types';

declare global {
  interface Window {
    panelFixture: ReturnType<typeof createLifecycle>;
    panelInstance: AccessiblitInstance;
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto('/panel.html');
  await page.waitForFunction(() => !!window.panelInstance);
});

test('exposes the launcher relationship and opens/closes without a modal trap', async ({
  page,
}) => {
  const launcher = page.getByRole('button', {
    name: 'Open accessibility options',
    exact: true,
  });
  const panel = page.locator('[role=dialog]');
  expect(await launcher.getAttribute('aria-controls')).toBe(
    await panel.getAttribute('id'),
  );
  await expect(launcher).toHaveAttribute('aria-expanded', 'false');
  await expect(panel).toBeHidden();
  await expect(launcher.locator('svg')).toHaveAttribute('aria-hidden', 'true');
  const size = await launcher.boundingBox();
  expect(size!.width).toBeGreaterThanOrEqual(44);
  expect(size!.height).toBeGreaterThanOrEqual(44);
  await launcher.click();
  await expect(
    page.getByRole('dialog', { name: 'Accessibility options', exact: true }),
  ).toBeVisible();
  await expect(panel).toHaveAttribute('aria-modal', 'false');
  expect(await panel.ariaSnapshot()).not.toContain('banner');
  await expect(launcher).toHaveAttribute('aria-expanded', 'true');
  await expect(
    page.getByRole('button', { name: 'Close', exact: true }),
  ).toBeFocused();
  for (const name of [
    'Content',
    'Colour and contrast',
    'Navigation and orientation',
  ])
    await expect(
      panel.getByRole('heading', { name, exact: true }),
    ).toBeVisible();
  await panel.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(panel).toBeHidden();
  await expect(launcher).toBeFocused();
  await expect(launcher).toHaveAttribute('aria-expanded', 'false');
});

test('matches configurable physical shortcuts and always returns focus on Escape', async ({
  page,
}) => {
  const panel = page.locator('[role=dialog]');
  const launcher = page.getByRole('button', {
    name: 'Open accessibility options',
  });
  await page.keyboard.press('Alt+KeyA');
  await expect(panel).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
  await expect(launcher).toBeFocused();
  await page.evaluate(() =>
    document.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'q',
        code: 'KeyA',
        altKey: true,
        bubbles: true,
        cancelable: true,
      }),
    ),
  );
  await expect(panel).toBeVisible();
  await page.keyboard.press('Escape');
  await page.evaluate(() => {
    window.panelInstance = window.panelFixture.init({
      persist: false,
      shortcut: 'Control+Shift+Z',
    });
  });
  await page.keyboard.press('Alt+KeyA');
  await expect(panel).toBeHidden();
  await page.keyboard.press('Control+Shift+KeyZ');
  await expect(panel).toBeVisible();
  await page.keyboard.press('Escape');
  await page.evaluate(() => {
    window.panelInstance = window.panelFixture.init({
      persist: false,
      shortcut: false,
    });
  });
  await page.keyboard.press('Alt+KeyA');
  await expect(panel).toBeHidden();
  await page.evaluate(() => window.panelInstance.open());
  await expect(panel).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
});

test('walks the complete panel by keyboard, changes each control and resets without losing focus', async ({
  page,
  browserName,
}) => {
  const tab =
    browserName === 'webkit' && process.platform === 'darwin'
      ? 'Alt+Tab'
      : 'Tab';
  const trace: string[] = [];
  const status = page.getByRole('status');
  await page.keyboard.press('Alt+KeyA');
  const panel = page.getByRole('dialog', { name: 'Accessibility options' });
  const close = panel.getByRole('button', { name: 'Close', exact: true });
  await expect(close).toBeFocused();
  trace.push('Close');
  await page.keyboard.press(tab);
  await expect(
    panel.getByRole('button', { name: 'Decrease Font size', exact: true }),
  ).toBeFocused();
  trace.push('Decrease Font size');
  await page.keyboard.press(tab);
  const increase = panel.getByRole('button', {
    name: 'Increase Font size',
    exact: true,
  });
  await expect(increase).toBeFocused();
  trace.push('Increase Font size');
  await page.keyboard.press('Enter');
  await expect(status).toHaveText('Font size 110 percent');
  await page.keyboard.press('Enter');
  await expect(status).toHaveText('Font size 120 percent');
  await page.keyboard.press('ArrowUp');
  expect(
    await page.evaluate(() => window.panelInstance.getState().fontSize),
  ).toBe(120);
  await page.keyboard.press(tab);
  await expect(
    panel.getByRole('radio', { name: 'Off', exact: true }),
  ).toBeFocused();
  trace.push('Text alignment Off');
  await page.keyboard.press('ArrowDown');
  await expect(
    panel.getByRole('radio', { name: 'Left', exact: true }),
  ).toBeFocused();
  await expect(
    panel.getByRole('radio', { name: 'Left', exact: true }),
  ).toBeChecked();
  await expect(status).toHaveText('Text alignment Left');
  await page.keyboard.press('ArrowRight');
  await expect(
    panel.getByRole('radio', { name: 'Center', exact: true }),
  ).toBeChecked();
  await page.keyboard.press('ArrowLeft');
  await expect(
    panel.getByRole('radio', { name: 'Left', exact: true }),
  ).toBeChecked();
  await page.keyboard.press(tab);
  const dark = panel.getByRole('button', { name: 'Dark mode', exact: true });
  await expect(dark).toBeFocused();
  trace.push('Dark mode');
  await page.keyboard.press('Space');
  await expect(dark).toHaveAttribute('aria-pressed', 'true');
  await expect(status).toHaveText('Dark mode On');
  await page.keyboard.press(tab);
  const focus = panel.getByRole('button', {
    name: 'Focus highlight',
    exact: true,
  });
  await expect(focus).toBeFocused();
  trace.push('Focus highlight');
  await page.keyboard.press('Space');
  await expect(focus).toHaveAttribute('aria-pressed', 'true');
  await expect(status).toHaveText('Focus highlight On');
  await page.keyboard.press(tab);
  const reset = panel.getByRole('button', { name: 'Reset all', exact: true });
  await expect(reset).toBeFocused();
  trace.push('Reset all');
  await page.keyboard.press('Space');
  await expect(status).toHaveText('All options reset.');
  await expect(reset).toBeFocused();
  await expect(dark).toHaveAttribute('aria-pressed', 'false');
  await expect(focus).toHaveAttribute('aria-pressed', 'false');
  await expect(
    panel.getByRole('radio', { name: 'Off', exact: true }),
  ).toBeChecked();
  expect(
    await page.evaluate(() => window.panelInstance.getState().fontSize),
  ).toBe(100);
  let outside = false;
  for (let index = 0; index < 4; index++) {
    await page.keyboard.press(tab);
    outside = await page.evaluate(
      () =>
        !document.querySelector('[data-accessiblit-host]')!.shadowRoot!
          .activeElement &&
        document.activeElement !== document.body &&
        document.activeElement !== document.documentElement,
    );
    if (outside) break;
  }
  expect(outside).toBe(true);
  await expect(page.locator('[role=dialog]')).toBeHidden();
  trace.push('Outside widget: no focus trap');
  console.log('PANEL_KEYBOARD', browserName, JSON.stringify(trace));
  await page.keyboard.press('Alt+KeyA');
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('button', { name: 'Open accessibility options' }),
  ).toBeFocused();
});

test('never obscures a focused host control with the panel or launcher', async ({
  page,
}) => {
  await page.keyboard.press('Alt+KeyA');
  const target = page.locator('#host-bottom-right');
  await target.focus();
  await expect(target).toBeFocused();
  await expect(page.locator('[role=dialog]')).toBeHidden();
  await expect(page.locator('.accessiblit-launcher')).toBeHidden();
  await page.keyboard.press('Alt+KeyA');
  await expect(page.locator('[role=dialog]')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Close', exact: true }),
  ).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('.accessiblit-launcher')).toBeVisible();
});

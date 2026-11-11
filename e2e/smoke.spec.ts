import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('fixture is accessible and keyboard reachable', async ({
  page,
  browserName,
}) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Accessiblit fixture' }),
  ).toBeVisible();
  // macOS WebKit uses Option+Tab to include form controls in keyboard navigation.
  await page.keyboard.press(
    browserName === 'webkit' && process.platform === 'darwin'
      ? 'Alt+Tab'
      : 'Tab',
  );
  await expect(
    page.getByRole('button', { name: 'Fixture control' }),
  ).toBeFocused();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  const box = await page.getByRole('button').boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(44);
  expect(box?.height).toBeGreaterThanOrEqual(44);
  const colors = await page.getByRole('button').evaluate((button) => {
    const style = getComputedStyle(button);
    return {
      color: style.color,
      background: style.backgroundColor,
      outline: style.outlineWidth,
    };
  });
  expect(colors.color).toBe('rgb(17, 17, 17)');
  expect(colors.background).toBe('rgb(255, 255, 255)');
  expect(colors.outline).toBe('3px');
  console.log(
    JSON.stringify({
      browser: test.info().project.name,
      target: box,
      colors,
      axeViolations: 0,
    }),
  );
});

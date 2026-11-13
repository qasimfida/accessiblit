import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { loadContent } from './helpers/content';
test('walks each colour control with keyboard and records semantics', async ({
  page,
  browserName,
}) => {
  await loadContent(page, 'colour-lab');
  await page.keyboard.press('Alt+KeyA');
  const tree = await page
    .getByRole('dialog', { name: 'Accessibility options' })
    .ariaSnapshot();
  const toggled: string[] = [];
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
    const focused = await page.evaluate(() => {
      const root = document.querySelector(
        '[data-accessiblit-host]',
      )!.shadowRoot!;
      const e = root.activeElement;
      if (!e) return null;
      const id = e.getAttribute('aria-labelledby');
      return {
        name: id
          ? root.getElementById(id)?.textContent
          : e.getAttribute('aria-label'),
        pressed: e.getAttribute('aria-pressed'),
      };
    });
    if (!focused) break;
    if (
      focused.pressed === 'false' &&
      ['Dark mode', 'High contrast', 'Monochrome', 'Low saturation'].includes(
        focused.name ?? '',
      )
    ) {
      await page.keyboard.press('Space');
      toggled.push(focused.name!);
    }
  }
  expect(toggled).toEqual([
    'Dark mode',
    'High contrast',
    'Monochrome',
    'Low saturation',
  ]);
  await page.keyboard.press('Escape');
  await page.keyboard.press('Alt+KeyA');
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('button', { name: 'Open accessibility options' }),
  ).toBeFocused();
  console.log(
    'COLOUR_KEYBOARD',
    browserName,
    JSON.stringify({ toggled, tree }),
  );
});
for (const forced of [false, true])
  test(`full axe on the colour laboratory with forced colours ${forced}`, async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: forced ? 'active' : 'none' });
    await loadContent(page, 'colour-lab');
    await page.evaluate(() => {
      window.contentInstance.setFeature('darkMode', true);
      window.contentInstance.setFeature('highContrast', true);
    });
    for (const open of [false, true]) {
      if (open) await page.evaluate(() => window.contentInstance.open());
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    }
  });
test('reconciles dynamic owner paints and preserves authored media filters', async ({
  page,
}) => {
  await loadContent(page, 'colour-lab');
  await page.evaluate(() => {
    const image = document.querySelector('img')!;
    image.style.filter = 'brightness(0.8)';
    window.contentInstance.setFeature('monochrome', true);
    const p = document.createElement('p');
    p.id = 'dynamic-paint';
    p.textContent = 'Dynamic owner colour';
    p.style.color = 'rgb(255,0,0)';
    document.querySelector('main')!.append(p);
  });
  await expect(page.locator('#dynamic-paint')).toHaveCSS(
    'color',
    'rgb(54, 54, 54)',
  );
  await page.locator('#dynamic-paint').evaluate((e) => {
    (e as HTMLElement).style.color = 'rgb(0,0,255)';
  });
  await expect(page.locator('#dynamic-paint')).toHaveCSS(
    'color',
    'rgb(18, 18, 18)',
  );
  await expect(page.locator('img')).toHaveCSS(
    'filter',
    'brightness(0.8) saturate(0)',
  );
  await page.evaluate(() => window.contentInstance.reset());
  await expect(page.locator('img')).toHaveCSS('filter', 'brightness(0.8)');
});

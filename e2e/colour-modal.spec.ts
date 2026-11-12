import { mkdir } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { loadContent } from './helpers/content';
for (const mode of ['darkMode', 'highContrast', 'all'] as const)
  test(`native modal and sticky anchor under ${mode}`, async ({
    page,
    browserName,
  }) => {
    await loadContent(page, 'colour-lab');
    await page.evaluate(() => window.scrollTo(0, 600));
    const before = await page
      .locator('#sticky')
      .evaluate((e) => e.getBoundingClientRect().top);
    await page.evaluate((mode) => {
      for (const id of [
        'darkMode',
        'highContrast',
        'monochrome',
        'lowSaturation',
      ] as const)
        if (mode === 'all' || mode === id)
          window.contentInstance.setFeature(id, true);
    }, mode);
    await expect
      .poll(() =>
        page.locator('#sticky').evaluate((e) => e.getBoundingClientRect().top),
      )
      .toBe(before);
    await page.evaluate(() =>
      (document.querySelector('dialog') as HTMLDialogElement).showModal(),
    );
    const modal = page.getByRole('dialog', { name: 'Host modal' });
    await expect(modal).toBeVisible();
    await expect(modal).toHaveCSS('color', 'rgb(255, 255, 255)');
    await expect(modal).toHaveCSS(
      'background-color',
      mode === 'darkMode' ? 'rgb(18, 18, 18)' : 'rgb(0, 0, 0)',
    );
    await expect(
      page.getByRole('button', { name: 'Close host modal' }),
    ).toBeFocused();
    if (process.env.ACCESSIBLIT_COLOUR_EVIDENCE) {
      const folder = new URL('../reports/assets/phase-4/', import.meta.url);
      await mkdir(folder, { recursive: true });
      await page.screenshot({
        path: new URL(`${browserName}-modal-${mode}.png`, folder).pathname,
        caret: 'initial',
      });
    }
    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden();
  });

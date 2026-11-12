import { expect, test } from '@playwright/test';
import { uiEvidence } from './helpers/ui-evidence';
import { loadContent } from './helpers/content';
test('walks production content controls by keyboard and measures targets', async ({
  page,
  browserName,
}) => {
  await loadContent(page, 'article');
  await page.keyboard.press('Alt+KeyA');
  const dialog = page.getByRole('dialog', { name: 'Accessibility options' });
  await expect(dialog).toBeVisible();
  const tree = await dialog.ariaSnapshot();
  expect(tree).toContain('Font size');
  expect(tree).toContain('Readable font');
  const targets = await dialog.locator('button,input').evaluateAll((nodes) =>
    nodes.map((e) => {
      const box = e.getBoundingClientRect();
      return { width: box.width, height: box.height };
    }),
  );
  for (const box of targets) {
    expect(box.width).toBeGreaterThanOrEqual(24);
    expect(box.height).toBeGreaterThanOrEqual(24);
  }
  const names: string[] = [];
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
    names.push(
      await page.evaluate(() => {
        const active = document.querySelector('[data-accessiblit-host]')
          ?.shadowRoot?.activeElement;
        return (
          active?.getAttribute('aria-label') ??
          active?.textContent?.trim() ??
          'host page'
        );
      }),
    );
    if (names[names.length - 1] === 'host page') break;
  }
  expect(names).toContain('host page');
  await page.keyboard.press('Escape');
  await page.keyboard.press('Alt+KeyA');
  await expect(dialog).toBeVisible();
  const evidence = await uiEvidence(page);
  for (const entry of evidence.text)
    expect(entry.ratio).toBeGreaterThanOrEqual(4.5);
  console.log('CONTENT_UI_EVIDENCE', browserName, JSON.stringify(evidence));
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('button', { name: 'Open accessibility options' }),
  ).toBeFocused();
  console.log(
    'CONTENT_KEYBOARD',
    browserName,
    JSON.stringify({ names, targets, tree }),
  );
});

test('restores computed typography as well as exact markup', async ({
  page,
}) => {
  await loadContent(page, 'form');
  const snapshot = () =>
    page.locator('main,main *').evaluateAll((nodes) =>
      nodes.map((e) => {
        const s = getComputedStyle(e);
        return [
          s.fontSize,
          s.fontFamily,
          s.lineHeight,
          s.letterSpacing,
          s.wordSpacing,
          s.textAlign,
          s.getPropertyValue('zoom'),
        ];
      }),
    );
  const before = await snapshot();
  await page.evaluate(() => {
    const i = window.contentInstance;
    i.setFeature('fontSize', 200);
    i.setFeature('lineHeight', 2);
    i.setFeature('letterSpacing', 0.2);
    i.setFeature('wordSpacing', 0.32);
    i.setFeature('textAlign', 'right');
    i.setFeature('readableFont', 'readable');
    i.setFeature('contentScale', 200);
  });
  await page.waitForTimeout(50);
  await page.evaluate(() => window.contentInstance.reset());
  expect(await snapshot()).toEqual(before);
  await page.evaluate(() => {
    window.contentInstance.setFeature('fontSize', 180);
    window.contentInstance.destroy();
  });
  expect(await snapshot()).toEqual(before);
});

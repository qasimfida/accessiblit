import { expect, test } from '@playwright/test';
import { loadContent } from './helpers/content';
for (const fallback of [false, true])
  test(`reset independently restores paints and foreign sheets with fallback ${fallback}`, async ({
    page,
    browserName,
  }) => {
    if (fallback)
      await page.addInitScript(() =>
        Object.defineProperty(CSSStyleSheet.prototype, 'replaceSync', {
          configurable: true,
          value: undefined,
        }),
      );
    await loadContent(page, 'article');
    const result = await page.evaluate(async (fallback) => {
      window.contentInstance.destroy();
      if (!fallback) {
        const owner = new CSSStyleSheet();
        owner.replaceSync(':root{--owner-colour-test:1}');
        document.adoptedStyleSheets = [...document.adoptedStyleSheets, owner];
      }
      const sheets = [...document.adoptedStyleSheets],
        before = document.documentElement.outerHTML;
      const sample = () => {
        const s = getComputedStyle(
          document.querySelector('[data-content-probe]')!,
        );
        return [s.color, s.backgroundColor, s.filter, s.backgroundImage];
      };
      const originalPaint = sample();
      const sameSheets = () =>
        document.adoptedStyleSheets.length === sheets.length &&
        sheets.every(
          (sheet, index) => document.adoptedStyleSheets[index] === sheet,
        );
      const enable = () => {
        for (const id of [
          'darkMode',
          'highContrast',
          'monochrome',
          'lowSaturation',
        ] as const)
          window.contentInstance.setFeature(id, true);
      };
      window.contentInstance = window.contentInit({
        persist: false,
        nonce: 'owner-test',
      });
      enable();
      const pageSheetCount = fallback
        ? document.querySelectorAll('[data-accessiblit-style]').length
        : document.adoptedStyleSheets.length - sheets.length;
      window.contentInstance.reset();
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
      const clone = document.documentElement.cloneNode(true) as Element;
      clone.querySelector('[data-accessiblit-host]')!.remove();
      const reset = {
        markup: clone.outerHTML === before,
        paint: JSON.stringify(sample()) === JSON.stringify(originalPaint),
        sheets: sameSheets(),
      };
      enable();
      window.contentInstance.destroy();
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
      return {
        pageSheetCount,
        reset,
        destroy: {
          markup: document.documentElement.outerHTML === before,
          paint: JSON.stringify(sample()) === JSON.stringify(originalPaint),
          sheets: sameSheets(),
        },
      };
    }, fallback);
    expect(result.pageSheetCount).toBe(1);
    expect(result.reset).toEqual({ markup: true, paint: true, sheets: true });
    expect(result.destroy).toEqual({ markup: true, paint: true, sheets: true });
    console.log(
      'COLOUR_RESET',
      browserName,
      String(fallback),
      JSON.stringify(result),
    );
  });

import { expect, test } from '@playwright/test';
import { CONTENT_FIXTURES, loadContent } from './helpers/content';
for (const fixture of CONTENT_FIXTURES)
  test(`readableFont every level on ${fixture}`, async ({ page }) => {
    await loadContent(page, fixture);
    const probe = page.locator('[data-content-probe]'),
      before = await probe.evaluate((e) => getComputedStyle(e).fontFamily);
    const requests: string[] = [];
    page.on('request', (request) => requests.push(request.url()));
    for (const value of ['off', 'readable', 'dyslexia-friendly']) {
      await page.evaluate(
        (value) => window.contentInstance.setFeature('readableFont', value),
        value,
      );
      const font = await probe.evaluate((e) => getComputedStyle(e).fontFamily);
      if (value === 'off') expect(font).toBe(before);
      else
        expect(font).toContain(
          value === 'readable' ? 'system-ui' : 'ui-rounded',
        );
    }
    await page.evaluate(() => window.contentInstance.reset());
    expect(await probe.evaluate((e) => getComputedStyle(e).fontFamily)).toBe(
      before,
    );
    expect(requests).toEqual([]);
  });
test('uses an owner-loaded face without requesting the configured URL', async ({
  page,
}) => {
  await loadContent(page, 'article');
  await page.evaluate(async () => {
    const face = new FontFace(
      'accessiblitdyslexia',
      'local("Arial"), local("Liberation Sans"), local("DejaVu Sans")',
    );
    await face.load();
    document.fonts.add(face);
    window.contentInstance = window.contentInit({
      persist: false,
      dyslexiaFontUrl: 'https://owner.invalid/reader.woff2',
    });
  });
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.evaluate(() =>
    window.contentInstance.setFeature('readableFont', 'dyslexia-friendly'),
  );
  expect(
    await page
      .locator('[data-content-probe]')
      .evaluate((e) => getComputedStyle(e).fontFamily),
  ).toContain('AccessiblitDyslexia');
  expect(requests).toEqual([]);
});

test('does not load an unprepared owner variant', async ({ page }) => {
  await loadContent(page, 'article');
  await page.route('https://owner.invalid/**', (route) => route.abort());
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  const result = await page.evaluate(async () => {
    const regular = new FontFace(
      'AccessiblitDyslexia',
      'local("Arial"), local("Liberation Sans"), local("DejaVu Sans")',
      { weight: '400' },
    );
    await regular.load();
    document.fonts.add(regular);
    const bold = new FontFace(
      'accessiblitdyslexia',
      'url("https://owner.invalid/not-preloaded.woff2")',
      { weight: '700' },
    );
    document.fonts.add(bold);
    window.contentInstance = window.contentInit({
      persist: false,
      dyslexiaFontUrl: 'https://owner.invalid/not-preloaded.woff2',
    });
    window.contentInstance.setFeature('readableFont', 'dyslexia-friendly');
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
    return {
      family: getComputedStyle(document.querySelector('[data-content-probe]')!)
        .fontFamily,
      status: bold.status,
    };
  });
  expect(result.family).not.toContain('AccessiblitDyslexia');
  expect(result.family).toContain('ui-rounded');
  expect(result.status).toBe('unloaded');
  expect(requests).toEqual([]);
});

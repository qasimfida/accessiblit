import { expect, test } from '@playwright/test';
import { loadContent } from './helpers/content';
test('pauses CSS timelines and autoplay without restarting video on off', async ({
  page,
}) => {
  await loadContent(page, 'colour-lab');
  await page.addStyleTag({
    content:
      '@keyframes navigation-move{from{transform:translateX(0)}to{transform:translateX(60px)}} #motion-probe{width:40px;height:40px;background:black;animation:navigation-move 1s linear infinite;transition:color 2s} html{scroll-behavior:smooth}',
  });
  await page.evaluate(async () => {
    const probe = document.createElement('div');
    probe.id = 'motion-probe';
    document.querySelector('main')!.prepend(probe);
    const video = document.querySelector('video')!;
    video.autoplay = true;
    await video.play();
  });
  await expect(page.locator('#motion-probe')).toHaveCSS(
    'animation-play-state',
    'running',
  );
  await page.evaluate(() =>
    window.contentInstance.setFeature('stopAnimations', true),
  );
  await expect(page.locator('#motion-probe')).toHaveCSS(
    'animation-play-state',
    'paused',
  );
  await expect(page.locator('#motion-probe')).toHaveCSS(
    'transition-property',
    'none',
  );
  await expect(page.locator('html')).toHaveCSS('scroll-behavior', 'auto');
  await expect
    .poll(() =>
      page.locator('video').evaluate((e) => (e as HTMLVideoElement).paused),
    )
    .toBe(true);
  const paused = await page
    .locator('#motion-probe')
    .evaluate((e) => getComputedStyle(e).transform);
  await page.waitForTimeout(100);
  expect(
    await page
      .locator('#motion-probe')
      .evaluate((e) => getComputedStyle(e).transform),
  ).toBe(paused);
  await page.locator('video').evaluate(async (e: HTMLVideoElement) => {
    await e.play().catch(() => {});
  });
  await expect
    .poll(() =>
      page.locator('video').evaluate((e) => (e as HTMLVideoElement).paused),
    )
    .toBe(true);
  await page.evaluate(() =>
    window.contentInstance.setFeature('stopAnimations', false),
  );
  await expect(page.locator('#motion-probe')).toHaveCSS(
    'animation-play-state',
    'running',
  );
  await expect(page.locator('html')).toHaveCSS('scroll-behavior', 'smooth');
  expect(
    await page.locator('video').evaluate((e) => (e as HTMLVideoElement).paused),
  ).toBe(true);
});
test('uses two embedded cursor sizes and the native fallback', async ({
  page,
}) => {
  await loadContent(page, 'article');
  const requests: string[] = [];
  page.on('request', (r) => {
    if (r.url().startsWith('http')) requests.push(r.url());
  });
  for (const [value, size] of [
    [true, 32],
    [2, 48],
  ] as const) {
    await page.evaluate(
      (value) => window.contentInstance.setFeature('bigCursor', value),
      value,
    );
    const cursor = await page
      .locator('main')
      .evaluate((e) => getComputedStyle(e).cursor);
    expect(decodeURIComponent(cursor)).toContain('width="' + size + '"');
    expect(cursor).toMatch(/auto$/);
  }
  expect(requests).toEqual([]);
  await page.emulateMedia({ forcedColors: 'active' });
  await expect
    .poll(() =>
      page.locator('main').evaluate((e) => getComputedStyle(e).cursor),
    )
    .not.toContain('data:image');
});
for (const forced of [false, true])
  test(
    'reading surfaces respect reduced motion and forced colours ' + forced,
    async ({ page }) => {
      await page.emulateMedia({
        reducedMotion: 'reduce',
        forcedColors: forced ? 'active' : 'none',
      });
      await loadContent(page, 'article');
      await page.evaluate(() => {
        window.contentInstance.setFeature('readingGuide', true);
        window.contentInstance.setFeature('readingMask', true);
      });
      await page.mouse.move(100, 200);
      const mask = page.locator('[data-accessiblit-overlay="mask"]');
      await expect(mask).toBeVisible();
      await expect(mask).toHaveCSS('transition-property', 'none');
      await expect(mask).toHaveCSS('animation-name', 'none');
      if (forced) await expect(mask).toHaveCSS('box-shadow', 'none');
      else
        expect(
          await mask.evaluate((e) => getComputedStyle(e).boxShadow),
        ).toContain('0.04');
    },
  );

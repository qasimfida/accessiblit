import { expect, test } from '@playwright/test';
import { loadContent } from './helpers/content';
const exempt =
  'svg,svg *,img,video,canvas,iframe,[role="img"],[role="img"] *,[data-accessiblit-host]';
for (const mode of [
  'root-dark',
  'root-contrast',
  'body-dark',
  'palette-dark',
  'palette-contrast',
])
  test(`compares ${mode} with media and positioning`, async ({
    page,
    browserName,
  }) => {
    await loadContent(page, 'colour-lab');
    await page.locator('video').evaluate(async (e: HTMLVideoElement) => {
      await e.play();
      e.pause();
      e.currentTime = 0;
    });
    await page.waitForTimeout(100);
    const image = await page.locator('#sample-image').screenshot();
    const before = await page.evaluate(() => {
      const fixed = document.querySelector('#fixed')!;
      const nested = document.createElement('aside');
      nested.id = 'nested-fixed';
      nested.textContent = 'Nested fixed probe';
      nested.style.cssText =
        'position:fixed;right:8px;top:120px;background:white;color:black';
      document.querySelector('main')!.append(nested);
      return {
        fixed: fixed.getBoundingClientRect().top,
        nested: nested.getBoundingClientRect().top,
      };
    });
    const css = mode.startsWith('palette')
      ? `html,body,body *:not(:where(${exempt})){background:#${mode.endsWith('contrast') ? '000' : '121212'}!important;color:#fff!important;background-image:none!important;text-shadow:none!important;box-shadow:none!important;border-color:#fff!important} body a{color:#ffff00!important}`
      : `${mode.startsWith('body') ? 'body' : 'html'}{filter:invert(1) hue-rotate(180deg) ${mode.endsWith('contrast') ? 'contrast(1.5)' : ''}} img,video,canvas,svg,iframe{filter:invert(1) hue-rotate(180deg)}`;
    await page.addStyleTag({ content: css });
    const afterImage = await page.locator('#sample-image').screenshot();
    const pixels = await page.evaluate(
      async (sources) => {
        const rows = [];
        for (const source of sources) {
          const img = new Image();
          img.src = 'data:image/png;base64,' + source;
          await img.decode();
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0);
          rows.push(
            [20, 80, 140].map((x) => [...ctx.getImageData(x, 30, 1, 1).data]),
          );
        }
        return rows;
      },
      [image.toString('base64'), afterImage.toString('base64')],
    );
    const natural = JSON.stringify(pixels[0]) === JSON.stringify(pixels[1]);
    await page.evaluate(() => window.scrollTo(0, 600));
    const after = await page.evaluate(() => ({
      fixed: document.querySelector('#fixed')!.getBoundingClientRect().top,
      nested: document.querySelector('#nested-fixed')!.getBoundingClientRect()
        .top,
      sticky: document.querySelector('#sticky')!.getBoundingClientRect().top,
      rootFilter: getComputedStyle(document.documentElement).filter,
      bodyFilter: getComputedStyle(document.body).filter,
    }));
    await page.evaluate(() => window.contentInstance.open());
    const widget = await page
      .locator('[data-accessiblit-host]')
      .evaluate((e) => {
        const p = e.shadowRoot!.querySelector('[role=dialog]')!;
        return {
          width: p.getBoundingClientRect().width,
          color: getComputedStyle(p).color,
          background: getComputedStyle(p).backgroundColor,
        };
      });
    await page.evaluate(() => {
      window.contentInstance.close();
      (document.querySelector('dialog') as HTMLDialogElement).showModal();
    });
    expect(
      await page.locator('dialog').evaluate((e) => e.matches(':modal')),
    ).toBe(true);
    if (mode.startsWith('palette')) {
      expect(after.fixed).toBe(before.fixed);
      expect(after.nested).toBe(before.nested);
      expect(natural).toBe(true);
    }
    console.log(
      'COLOUR_PROTOTYPE',
      browserName,
      mode,
      JSON.stringify({ before, after, natural, widget }),
    );
  });
test('measures root-filter scrolling and long tasks on heavy content', async ({
  page,
  browserName,
}) => {
  await page.goto('/colour-lab.html?heavy');
  await page.waitForFunction(
    () => document.querySelectorAll('#heavy p').length === 2000,
  );
  const rows = await page.evaluate(async () => {
    const rows = [];
    for (const mode of ['none', 'invert(1) hue-rotate(180deg) contrast(1.5)']) {
      document.documentElement.style.filter = mode;
      const frames: number[] = [],
        longTasks: number[] = [];
      const supported =
        PerformanceObserver.supportedEntryTypes.includes('longtask');
      const observer = new PerformanceObserver((list) => {
        for (const e of list.getEntries()) longTasks.push(e.duration);
      });
      if (supported) observer.observe({ type: 'longtask' });
      let last = performance.now();
      for (let i = 0; i < 60; i++) {
        window.scrollTo(0, i * 100);
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => resolve()),
        );
        const now = performance.now();
        frames.push(now - last);
        last = now;
      }
      observer.disconnect();
      rows.push({ mode, frames, longTasks: supported ? longTasks : null });
    }
    return rows;
  });
  console.log('COLOUR_ROOT_PERFORMANCE', browserName, JSON.stringify(rows));
});

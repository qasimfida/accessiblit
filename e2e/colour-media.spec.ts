import { expect, test } from '@playwright/test';
import { loadContent } from './helpers/content';
test('palettes preserve decoded media paint and adjustments make no requests', async ({
  page,
  browserName,
}) => {
  await loadContent(page, 'colour-lab');
  await page.locator('video').evaluate(async (e: HTMLVideoElement) => {
    await e.play();
    e.pause();
  });
  await page.waitForTimeout(150);
  const selectors = [
    '#sample-image',
    '#sample-video',
    '#sample-canvas',
    '#sample-svg',
    '#sample-frame',
  ];
  const sample = async () => {
    const rows = [];
    for (const selector of selectors) {
      const buffer = await page
        .locator(selector)
        .screenshot({ caret: 'initial' });
      rows.push(
        await page.evaluate(async (source) => {
          const img = new Image();
          img.src = 'data:image/png;base64,' + source;
          await img.decode();
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0);
          return [20, 80, 140].map((x) => [
            ...ctx.getImageData(x, 30, 1, 1).data,
          ]);
        }, buffer.toString('base64')),
      );
    }
    return rows;
  };
  const before = await sample();
  const requests: string[] = [];
  page.on('request', (r) => requests.push(r.url()));
  for (const id of ['darkMode', 'highContrast'] as const) {
    await page.evaluate((id) => {
      window.contentInstance.reset();
      window.contentInstance.setFeature(id, true);
    }, id);
    expect(await sample()).toEqual(before);
  }
  await page.evaluate(() => {
    window.contentInstance.setFeature('monochrome', true);
    window.contentInstance.setFeature('lowSaturation', true);
  });
  const filters = await page
    .locator('html,body,main,#fixed,#sticky')
    .evaluateAll((nodes) => nodes.map((e) => getComputedStyle(e).filter));
  expect(filters).toEqual(['none', 'none', 'none', 'none', 'none']);
  await page.evaluate(() => window.contentInstance.reset());
  expect(requests).toEqual([]);
  console.log(
    'COLOUR_NATURAL_MEDIA',
    browserName,
    JSON.stringify({ selectors, samples: before, requests }),
  );
});

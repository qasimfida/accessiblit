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

test('preserves currentColor artwork inside links', async ({ page }) => {
  await loadContent(page, 'colour-lab');
  await page.evaluate(() => {
    const a = document.createElement('a');
    a.href = '#media';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'linked-artwork';
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Owner red square');
    svg.style.color = 'rgb(208, 48, 32)';
    const rect = document.createElementNS(svg.namespaceURI, 'rect');
    rect.setAttribute('fill', 'currentColor');
    rect.setAttribute('width', '40');
    rect.setAttribute('height', '40');
    svg.append(rect);
    a.append(svg);
    document.querySelector('main')!.append(a);
  });
  const before = await page
    .locator('#linked-artwork')
    .evaluate((e) => getComputedStyle(e).color);
  for (const id of ['darkMode', 'highContrast'] as const) {
    await page.evaluate(
      (id) => window.contentInstance.setFeature(id, true),
      id,
    );
    await expect(page.locator('#linked-artwork')).toHaveCSS('color', before);
  }
});

test('preserves fixed positioning inside object fallback', async ({ page }) => {
  await loadContent(page, 'colour-lab');
  await page.evaluate(() => {
    const object = document.createElement('object');
    object.id = 'fallback-media';
    object.style.cssText =
      'display:block;width:200px;height:90px;margin-top:20px';
    const fixed = document.createElement('aside');
    fixed.id = 'fallback-fixed';
    fixed.textContent = 'Fallback fixed';
    fixed.style.cssText = 'position:fixed;top:140px;left:20px';
    object.append(fixed);
    document.querySelector('main')!.append(object);
  });
  await expect(page.locator('#fallback-fixed')).toBeVisible();
  const before = await page
    .locator('#fallback-fixed')
    .evaluate((e) => e.getBoundingClientRect().toJSON());
  for (const id of ['monochrome', 'lowSaturation'] as const) {
    await page.evaluate((id) => {
      window.contentInstance.reset();
      window.contentInstance.setFeature(id, true);
    }, id);
    await expect(page.locator('#fallback-media')).toHaveCSS('filter', 'none');
    expect(
      await page
        .locator('#fallback-fixed')
        .evaluate((e) => e.getBoundingClientRect().toJSON()),
    ).toEqual(before);
  }
});

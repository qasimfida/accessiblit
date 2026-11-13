import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import './helpers/content';

const bundle = readFileSync(
  new URL('../dist/accessiblit.min.js', import.meta.url),
  'utf8',
);
const article = readFileSync(
  new URL('../fixtures/article.html', import.meta.url),
  'utf8',
).replace(
  '<script type="module" src="/content.mjs"></script>',
  '<script src="/content-bundle.js"></script><script>window.contentInit=Accessiblit.init;window.contentInstance=Accessiblit.init({storageKey:"phase3:paint"});</script>',
);
test('restores persisted content before the first rendered probe frame', async ({
  page,
  browserName,
}) => {
  await page.route('**/content-bundle.js', (route) =>
    route.fulfill({ contentType: 'application/javascript', body: bundle }),
  );
  await page.route('**/early-content', (route) =>
    route.fulfill({ contentType: 'text/html', body: article }),
  );
  await page.addInitScript(() => {
    const frames: { font: number; line: number; zoom: string }[] = [];
    Reflect.set(window, 'contentFrames', frames);
    const tick = () => {
      const probe = document.querySelector('[data-content-probe]');
      if (probe) {
        const style = getComputedStyle(probe);
        frames.push({
          font: parseFloat(style.fontSize),
          line: parseFloat(style.lineHeight),
          zoom: getComputedStyle(document.documentElement).getPropertyValue(
            'zoom',
          ),
        });
      }
      if (frames.length < 5) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await page.goto('/early-content');
  await page.evaluate(() => {
    window.contentInstance.setFeature('fontSize', 200);
    window.contentInstance.setFeature('lineHeight', 2);
    window.contentInstance.setFeature('contentScale', 150);
  });
  await page.reload();
  await page.waitForFunction(
    () => Reflect.get(window, 'contentFrames').length >= 5,
  );
  const frames = await page.evaluate(
    () =>
      Reflect.get(window, 'contentFrames') as {
        font: number;
        line: number;
        zoom: string;
      }[],
  );
  console.log('CONTENT_FIRST_PAINT', browserName, JSON.stringify(frames));
  for (const frame of frames) {
    expect(frame.font).toBeCloseTo(32, 1);
    expect(frame.line).toBeCloseTo(64, 1);
    expect(parseFloat(frame.zoom)).toBe(1.5);
  }
});

import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { ALL_FEATURES } from './helpers/all-features';
import './helpers/content';
const bundle = readFileSync(
  new URL('../dist/index.global.js', import.meta.url),
  'utf8',
);
const html = readFileSync(
  new URL('../fixtures/article.html', import.meta.url),
  'utf8',
).replace(
  '<script type="module" src="/content.mjs"></script>',
  '<script src="/navigation-runtime.js"></script><script>window.contentInit=Accessiblit.init;window.contentInstance=Accessiblit.init({persist:false});</script>',
);
async function load(page: Page) {
  await page.route('**/navigation-runtime.js', (route) =>
    route.fulfill({ contentType: 'application/javascript', body: bundle }),
  );
  await page.route('**/navigation-performance', (route) =>
    route.fulfill({ contentType: 'text/html', body: html }),
  );
  await page.goto('/navigation-performance');
  await page.waitForFunction(
    () => !!document.querySelector('[data-accessiblit-host]'),
  );
}
test('measures overlay task time during continuous pointer movement', async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName !== 'chromium',
    'Renderer CPU counters require Chromium CDP; functional overlay checks run in all engines.',
  );
  await load(page);
  await page.evaluate((state) => {
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < 2000; i++) {
      const p = document.createElement('p');
      p.textContent = 'Heavy reading paragraph ' + i;
      fragment.append(p);
    }
    document.querySelector('main')!.replaceChildren(fragment);
    for (const [id, value] of Object.entries(state))
      window.contentInstance.setFeature(id as keyof typeof state, value);
  }, ALL_FEATURES);
  const session = await page.context().newCDPSession(page);
  await session.send('Performance.enable', { timeDomain: 'threadTicks' });
  const metrics = async () => {
    const result = (await session.send('Performance.getMetrics')) as {
      metrics: { name: string; value: number }[];
    };
    return Object.fromEntries(
      result.metrics.map((row) => [row.name, row.value]),
    );
  };
  const rows = [];
  for (const enabled of [false, true, false]) {
    await page.evaluate((enabled) => {
      window.contentInstance.setFeature('readingGuide', enabled);
      window.contentInstance.setFeature('readingMask', enabled);
    }, enabled);
    await page.waitForTimeout(150);
    const before = await metrics();
    const input = await page.evaluate(async () => {
      let events = 0;
      const start = performance.now();
      const timer = setInterval(() => {
        document.body.dispatchEvent(
          new PointerEvent('pointermove', {
            bubbles: true,
            clientX: 100,
            clientY: 80 + ((events * 7) % (innerHeight - 160)),
          }),
        );
        events++;
      }, 1000 / 120);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      clearInterval(timer);
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
      return { events, wallMs: performance.now() - start };
    });
    const after = await metrics(),
      taskMs = (after.TaskDuration! - before.TaskDuration!) * 1000;
    rows.push({
      enabled,
      ...input,
      taskMs,
      mainThreadPercent: (taskMs / input.wallMs) * 100,
      scriptMs: (after.ScriptDuration! - before.ScriptDuration!) * 1000,
      layoutMs: (after.LayoutDuration! - before.LayoutDuration!) * 1000,
    });
  }
  await session.detach();
  expect(rows[1]!.events).toBeGreaterThan(100);
  expect(
    rows.every((row) => Number.isFinite(row.taskMs) && row.taskMs >= 0),
  ).toBe(true);
  console.log(
    'NAVIGATION_CPU',
    browserName,
    JSON.stringify({ nodes: 2000, timeDomain: 'threadTicks', rows }),
  );
});
test('measures retained heap after 200 cycles of each navigation feature', async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName !== 'chromium',
    'Precise post-GC JS heap requires Chromium CDP; listener/DOM cleanup runs in all engines.',
  );
  test.setTimeout(120000);
  await load(page);
  const session = await page.context().newCDPSession(page);
  const heap = async () => {
    await session.send('HeapProfiler.collectGarbage');
    return (
      (await session.send('Runtime.getHeapUsage')) as { usedSize: number }
    ).usedSize;
  };
  const rows = [];
  for (const id of [
    'readingGuide',
    'readingMask',
    'highlightLinks',
    'highlightHeadings',
    'bigCursor',
    'stopAnimations',
    'focusHighlight',
  ] as const) {
    await page.evaluate((id) => {
      window.contentInstance = window.contentInit({
        persist: false,
        features: [id],
      });
    }, id);
    const cycle = async (count: number) =>
      page.evaluate(
        async ({ id, count }) => {
          for (let i = 0; i < count; i++) {
            window.contentInstance.setFeature(
              id,
              id === 'bigCursor' ? 2 : true,
            );
            if (
              id === 'readingGuide' ||
              id === 'readingMask' ||
              id === 'focusHighlight'
            )
              await new Promise<void>((resolve) =>
                requestAnimationFrame(() => resolve()),
              );
            window.contentInstance.setFeature(id, false);
          }
          await new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          );
        },
        { id, count },
      );
    const cold = await heap();
    await cycle(200);
    const before = await heap();
    const domBefore = await session.send('Memory.getDOMCounters');
    const checkpoints = [];
    for (const cycles of [50, 100, 200]) {
      await cycle(cycles - (checkpoints[checkpoints.length - 1]?.cycles ?? 0));
      checkpoints.push({ cycles, usedSize: await heap() });
    }
    const residue = await page.evaluate(() => ({
      overlays: document
        .querySelector('[data-accessiblit-host]')!
        .shadowRoot!.querySelectorAll('[data-accessiblit-overlay]').length,
      classes: [...document.documentElement.classList].filter((c) =>
        c.startsWith('accessiblit-'),
      ),
    }));
    expect(residue).toEqual({ overlays: 0, classes: [] });
    rows.push({
      id,
      before,
      checkpoints,
      cold,
      warmupGrowth: before - cold,
      growth: checkpoints[2]!.usedSize - before,
      domBefore,
      domAfter: await session.send('Memory.getDOMCounters'),
      residue,
    });
  }
  await session.detach();
  console.log(
    'NAVIGATION_HEAP',
    browserName,
    JSON.stringify({ warmupCycles: 200, rows }),
  );
});

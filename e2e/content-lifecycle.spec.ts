import { expect, test } from '@playwright/test';
import { loadContent } from './helpers/content';
test('production init preserves layout and maximum settings preserve panel geometry', async ({
  page,
  browserName,
}) => {
  await loadContent(page, 'article');
  const result = await page.evaluate(async () => {
    window.contentInstance.destroy();
    const rects = () =>
      [...document.querySelectorAll('main,main h1,main p')].map((e) =>
        e.getBoundingClientRect().toJSON(),
      );
    const before = JSON.stringify(rects());
    const times: number[] = [];
    const supported =
      PerformanceObserver.supportedEntryTypes.includes('layout-shift');
    let cls = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries())
        cls += (entry as PerformanceEntry & { value: number }).value;
    });
    if (supported) observer.observe({ type: 'layout-shift' });
    let unchanged = true;
    for (let i = 0; i < 10; i++) {
      const start = performance.now();
      window.contentInstance = window.contentInit({ persist: false });
      times.push(performance.now() - start);
      window.contentInstance.open();
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
      unchanged &&= JSON.stringify(rects()) === before;
      window.contentInstance.destroy();
    }
    for (const entry of observer.takeRecords())
      cls += (entry as PerformanceEntry & { value: number }).value;
    observer.disconnect();
    window.contentInstance = window.contentInit({ persist: false });
    window.contentInstance.open();
    const root = document.querySelector('[data-accessiblit-host]')!.shadowRoot!;
    const panel = root.querySelector('[role=dialog]')!;
    const heading = panel.querySelector('h2')!;
    const geometry = () => ({
      width: panel.getBoundingClientRect().width,
      font: getComputedStyle(heading).fontSize,
      line: getComputedStyle(heading).lineHeight,
      family: getComputedStyle(heading).fontFamily,
      spacing: getComputedStyle(heading).letterSpacing,
    });
    const panelBefore = geometry();
    const instance = window.contentInstance;
    instance.setFeature('fontSize', 200);
    instance.setFeature('lineHeight', 2);
    instance.setFeature('letterSpacing', 0.2);
    instance.setFeature('wordSpacing', 0.32);
    instance.setFeature('textAlign', 'right');
    instance.setFeature('contentScale', 200);
    instance.setFeature('readableFont', 'readable');
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
    return {
      times,
      unchanged,
      cls: supported ? cls : null,
      panelBefore,
      panelAfter: geometry(),
    };
  });
  expect(Math.max(...result.times)).toBeLessThan(50);
  expect(result.unchanged).toBe(true);
  if (result.cls !== null) expect(result.cls).toBe(0);
  expect(result.panelAfter).toEqual(result.panelBefore);
  console.log('CONTENT_LIFECYCLE', browserName, JSON.stringify(result));
});

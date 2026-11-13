import { expect, test } from '@playwright/test';
import { loadContent } from './helpers/content';
for (const scale of [100, 200])
  test(
    'pointer, focus and click-through at content scale ' + scale,
    async ({ page }) => {
      await loadContent(page, 'article');
      await page.evaluate((scale) => {
        const button = document.createElement('button');
        button.id = 'overlay-click';
        button.textContent = 'Click through reading overlays';
        button.addEventListener(
          'click',
          () => (button.dataset.clicked = 'yes'),
        );
        document.querySelector('main')!.append(button);
        window.contentInstance.setFeature('contentScale', scale);
        window.contentInstance.setFeature('readingGuide', true);
        window.contentInstance.setFeature('readingMask', true);
      }, scale);
      await page.mouse.move(100, 200);
      const guide = page.locator('[data-accessiblit-overlay="guide"]'),
        mask = page.locator('[data-accessiblit-overlay="mask"]');
      await expect
        .poll(() =>
          guide.evaluate((e) => Math.round(e.getBoundingClientRect().top)),
        )
        .toBe(200);
      await expect(guide).toHaveCSS('pointer-events', 'none');
      await expect(mask).toHaveCSS('pointer-events', 'none');
      const bounds = await mask.evaluate((e) =>
        e.getBoundingClientRect().toJSON(),
      );
      expect(bounds.top + bounds.height / 2).toBeCloseTo(200, 0);
      await page.keyboard.press('Tab');
      await page.locator('nav a').first().focus();
      await expect
        .poll(() =>
          guide.evaluate((e) => Math.round(e.getBoundingClientRect().top)),
        )
        .toBe(
          await page
            .locator('nav a')
            .first()
            .evaluate((e) => Math.round(e.getBoundingClientRect().bottom + 4)),
        );
      await page.locator('#overlay-click').click();
      await expect(page.locator('#overlay-click')).toHaveAttribute(
        'data-clicked',
        'yes',
      );
      await page.evaluate(() => window.contentInstance.open());
      await expect(guide).toBeHidden();
      await expect(mask).toBeHidden();
    },
  );
test('off removes all overlay listeners and pending animation frames', async ({
  page,
  browserName,
}) => {
  await loadContent(page, 'article');
  const result = await page.evaluate(async () => {
    const add = EventTarget.prototype.addEventListener,
      remove = EventTarget.prototype.removeEventListener;
    const raf = window.requestAnimationFrame,
      cancel = window.cancelAnimationFrame;
    const entries: {
      target: EventTarget;
      type: string;
      listener: EventListenerOrEventListenerObject;
      capture: boolean;
    }[] = [];
    const frames = new Set<number>();
    let adds = 0,
      removes = 0;
    EventTarget.prototype.addEventListener = function (
      type,
      listener,
      options,
    ) {
      if (
        listener &&
        (this === document || this === window || this === window.visualViewport)
      ) {
        entries.push({
          target: this,
          type,
          listener,
          capture:
            typeof options === 'boolean'
              ? options
              : (options?.capture ?? false),
        });
        adds++;
      }
      return add.call(this, type, listener, options);
    };
    EventTarget.prototype.removeEventListener = function (
      type,
      listener,
      options,
    ) {
      const capture =
        typeof options === 'boolean' ? options : (options?.capture ?? false);
      const index = entries.findIndex(
        (e) =>
          e.target === this &&
          e.type === type &&
          e.listener === listener &&
          e.capture === capture,
      );
      if (index >= 0) {
        entries.splice(index, 1);
        removes++;
      }
      return remove.call(this, type, listener, options);
    };
    window.requestAnimationFrame = (callback) => {
      const id = raf.call(window, (time) => {
        frames.delete(id);
        callback(time);
      });
      frames.add(id);
      return id;
    };
    window.cancelAnimationFrame = (id) => {
      frames.delete(id);
      cancel.call(window, id);
    };
    try {
      window.contentInstance.setFeature('readingGuide', true);
      window.contentInstance.setFeature('readingMask', true);
      for (let i = 0; i < 100; i++)
        document.body.dispatchEvent(
          new PointerEvent('pointermove', { bubbles: true, clientY: 100 + i }),
        );
      const queued = frames.size;
      window.contentInstance.setFeature('readingGuide', false);
      window.contentInstance.setFeature('readingMask', false);
      const off = {
        listeners: entries.length,
        frames: frames.size,
        nodes: document
          .querySelector('[data-accessiblit-host]')!
          .shadowRoot!.querySelectorAll('[data-accessiblit-overlay]').length,
      };
      window.contentInstance.setFeature('readingGuide', true);
      window.contentInstance.setFeature('readingMask', true);
      window.contentInstance.destroy();
      return {
        queued,
        off,
        destroy: { listeners: entries.length, frames: frames.size },
        adds,
        removes,
      };
    } finally {
      EventTarget.prototype.addEventListener = add;
      EventTarget.prototype.removeEventListener = remove;
      window.requestAnimationFrame = raf;
      window.cancelAnimationFrame = cancel;
    }
  });
  expect(result.queued).toBe(2);
  expect(result.off).toEqual({ listeners: 0, frames: 0, nodes: 0 });
  expect(result.destroy).toEqual({ listeners: 0, frames: 0 });
  expect(result.removes).toBe(result.adds);
  console.log('NAVIGATION_CLEANUP', browserName, JSON.stringify(result));
});
test('touch points follow without intercepting taps and explain inactive cursors', async ({
  browser,
  browserName,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 700 },
    hasTouch: true,
    isMobile: browserName !== 'firefox',
  });
  try {
    const page = await context.newPage();
    await loadContent(page, 'article');
    await page.evaluate(() => {
      window.contentInstance.setFeature('readingGuide', true);
      window.contentInstance.setFeature('readingMask', true);
      window.contentInstance.setFeature('bigCursor', 2);
      const button = document.createElement('button');
      button.id = 'touch-click';
      button.textContent = 'Tap through';
      button.addEventListener('click', () => (button.dataset.clicked = 'yes'));
      document.querySelector('main')!.prepend(button);
    });
    await page.touchscreen.tap(150, 250);
    await expect
      .poll(() =>
        page
          .locator('[data-accessiblit-overlay="guide"]')
          .evaluate((e) => Math.round(e.getBoundingClientRect().top)),
      )
      .toBe(250);
    await page.locator('#touch-click').tap();
    await expect(page.locator('#touch-click')).toHaveAttribute(
      'data-clicked',
      'yes',
    );
    await page.evaluate(() => window.contentInstance.open());
    await expect(page.locator('.accessiblit-cursor-note')).toBeVisible();
    const pointer = await page.evaluate(() => ({
      fine: matchMedia('(any-pointer:fine)').matches,
      cursor: getComputedStyle(document.querySelector('main')!).cursor,
    }));
    expect(pointer.fine).toBe(false);
    expect(pointer.cursor).not.toContain('data:image');
    console.log('NAVIGATION_TOUCH', browserName, JSON.stringify(pointer));
  } finally {
    await context.close();
  }
});

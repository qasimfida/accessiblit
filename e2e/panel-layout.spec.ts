import { expect, test } from '@playwright/test';

for (const direction of ['ltr', 'rtl'])
  test(`honours every physical anchor, offset and z-index in ${direction}`, async ({
    page,
  }) => {
    await page.goto('/panel.html');
    await page.waitForFunction(() => !!window.panelInstance);
    for (const position of [
      'bottom-right',
      'bottom-left',
      'top-right',
      'top-left',
    ] as const) {
      await page.evaluate(
        ({ direction, position }) => {
          document.documentElement.dir = direction;
          window.panelInstance = window.panelFixture.init({
            persist: false,
            position,
            offset: { x: 24, y: 30 },
            zIndex: 4567,
          });
        },
        { direction, position },
      );
      const launcher = page.getByRole('button', {
        name: 'Open accessibility options',
      });
      await expect(launcher).toBeVisible();
      const viewport = page.viewportSize()!;
      const box = (await launcher.boundingBox())!;
      expect(box.x).toBe(
        position.endsWith('right') ? viewport.width - 24 - 48 : 24,
      );
      expect(box.y).toBe(
        position.startsWith('bottom') ? viewport.height - 30 - 48 : 30,
      );
      expect(await launcher.evaluate((e) => getComputedStyle(e).zIndex)).toBe(
        '4567',
      );
      await page.keyboard.press('Alt+KeyA');
      const panel = page.getByRole('dialog', { name: 'Accessibility options' });
      const bounds = (await panel.boundingBox())!;
      expect(bounds.x).toBeGreaterThanOrEqual(8);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width - 8);
      expect(bounds.y).toBeGreaterThanOrEqual(8);
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height - 8);
      expect(await panel.evaluate((e) => getComputedStyle(e).direction)).toBe(
        direction,
      );
      await page.keyboard.press('Escape');
    }
  });

test('isolates UI typography, painting and author zoom from root adjustments', async ({
  page,
}) => {
  await page.goto('/panel.html');
  await page.waitForFunction(() => !!window.panelInstance);
  await page.keyboard.press('Alt+KeyA');
  const launcher = page.getByRole('button', {
    name: 'Open accessibility options',
  });
  const panel = page.getByRole('dialog');
  const heading = panel.getByRole('heading', {
    name: 'Accessibility options',
    exact: true,
  });
  const before = {
    launcher: await launcher.boundingBox(),
    panel: await panel.boundingBox(),
    image: await heading.screenshot(),
  };
  await page.evaluate(() => {
    const sheet = document.createElement('style');
    sheet.textContent =
      'html body > :not([data-accessiblit-host]) { filter:invert(1) grayscale(1) }';
    document.head.append(sheet);
    document.documentElement.style.cssText =
      'font-size:200%;line-height:2;letter-spacing:.2em;word-spacing:.32em;zoom:2';
  });
  await expect.poll(() => launcher.boundingBox()).toEqual(before.launcher);
  expect(await panel.boundingBox()).toEqual(before.panel);
  expect(await heading.screenshot()).toEqual(before.image);
  expect(
    await heading.evaluate((e) => ({
      font: getComputedStyle(e).fontSize,
      spacing: getComputedStyle(e).letterSpacing,
      line: getComputedStyle(e).lineHeight,
    })),
  ).toEqual({ font: '20px', spacing: 'normal', line: '26px' });
});

for (const adjustment of ['default', 'spacing', 'text-size'] as const)
  test(`keeps every keyboard target visible at 320x256${adjustment === 'default' ? '' : ` with user ${adjustment}`}`, async ({
    page,
    browserName,
  }) => {
    await page.setViewportSize({ width: 320, height: 256 });
    await page.goto('/panel.html');
    await page.waitForFunction(() => !!window.panelInstance);
    if (adjustment !== 'default')
      await page
        .locator('[data-accessiblit-host]')
        .evaluate((host, adjustment) => {
          const style = document.createElement('style');
          style.textContent =
            adjustment === 'text-size'
              ? '.accessiblit-panel{font-size:32px!important}.accessiblit-panel h2{font-size:40px!important}.accessiblit-panel h3{font-size:32px!important}.accessiblit-panel h4{font-size:30px!important}.accessiblit-panel p,.accessiblit-panel .accessiblit-badge{font-size:28px!important}'
              : '.accessiblit-panel,.accessiblit-panel *{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}.accessiblit-panel p{margin-block-end:2em!important}';
          host.shadowRoot!.append(style);
        }, adjustment);
    await page.keyboard.press('Alt+KeyA');
    if (adjustment === 'text-size') {
      await expect(
        page.getByRole('button', { name: 'Close', exact: true }),
      ).toHaveCSS('font-size', '32px');
      await expect(
        page.getByRole('heading', {
          name: 'Accessibility options',
          exact: true,
        }),
      ).toHaveCSS('font-size', '40px');
    }
    const clipping = await page.getByRole('dialog').evaluate((panel) =>
      [...panel.querySelectorAll<HTMLElement>('p,h2,h3,h4,button,label')].map(
        (e) => ({
          text: e.textContent,
          x: e.scrollWidth - e.clientWidth,
          y: e.scrollHeight - e.clientHeight,
        }),
      ),
    );
    for (const item of clipping) {
      expect(item.x, item.text ?? '').toBeLessThanOrEqual(1);
      expect(item.y, item.text ?? '').toBeLessThanOrEqual(1);
    }
    const tab =
      browserName === 'webkit' && process.platform === 'darwin'
        ? 'Alt+Tab'
        : 'Tab';
    const names: string[] = [];
    for (let index = 0; index < 12; index++) {
      const current = await page
        .locator('[data-accessiblit-host]')
        .evaluate((host) => {
          const root = host.shadowRoot!;
          const panel = root.querySelector<HTMLElement>('[role=dialog]')!;
          const element = root.activeElement as HTMLElement | null;
          if (!element || !panel.contains(element)) return null;
          const bounds = element.getBoundingClientRect(),
            box = panel.getBoundingClientRect();
          return {
            name:
              element.getAttribute('aria-label') ??
              element.textContent ??
              element.tagName,
            top: bounds.top - box.top,
            bottom: box.bottom - bounds.bottom,
            left: bounds.left - box.left,
            right: box.right - bounds.right,
            overflow: panel.scrollWidth - panel.clientWidth,
          };
        });
      if (!current) break;
      expect(current.top).toBeGreaterThanOrEqual(6);
      expect(current.bottom).toBeGreaterThanOrEqual(6);
      expect(current.left).toBeGreaterThanOrEqual(6);
      expect(current.right).toBeGreaterThanOrEqual(6);
      expect(current.overflow).toBeLessThanOrEqual(1);
      names.push(current.name);
      await page.keyboard.press(tab);
    }
    expect(names).toHaveLength(7);
    expect(names[names.length - 1]).toBe('Reset all');
    for (let index = 0; index < 4; index++) {
      const outside = await page.evaluate(
        () =>
          !document.querySelector('[data-accessiblit-host]')!.shadowRoot!
            .activeElement &&
          document.activeElement !== document.body &&
          document.activeElement !== document.documentElement,
      );
      if (outside) break;
      await page.keyboard.press(tab);
    }
    await expect(page.getByRole('dialog')).toBeHidden();
  });

// A 320 CSS px viewport also models desktop reflow from 1280px at 400% browser zoom.
// This extra Chromium probe exercises the distinct visual-viewport pinch-zoom path.
test('fits the visual viewport at 400 percent pinch zoom', async ({
  browser,
  browserName,
  baseURL,
}) => {
  test.skip(
    browserName !== 'chromium',
    'CDP visual-viewport emulation is Chromium-only; all engines test 320px reflow above.',
  );
  const context = await browser.newContext({
    isMobile: true,
    viewport: { width: 1280, height: 1024 },
  });
  const page = await context.newPage();
  await page.goto(`${baseURL}/panel.html`);
  await page.waitForFunction(() => !!window.panelInstance);
  await page
    .locator('meta[name=viewport]')
    .evaluate((e) =>
      e.setAttribute(
        'content',
        'width=device-width,initial-scale=1,maximum-scale=10',
      ),
    );
  const session = await page.context().newCDPSession(page);
  await session.send('Emulation.setPageScaleFactor', { pageScaleFactor: 4 });
  await page.keyboard.press('Alt+KeyA');
  const geometry = await page.getByRole('dialog').evaluate((e) => ({
    box: e.getBoundingClientRect().toJSON(),
    width: visualViewport!.width,
    height: visualViewport!.height,
    scale: visualViewport!.scale,
  }));
  expect(geometry.scale).toBe(4);
  expect(geometry.width).toBe(320);
  expect(geometry.box.left).toBeGreaterThanOrEqual(0);
  expect(geometry.box.right).toBeLessThanOrEqual(geometry.width);
  expect(geometry.box.top).toBeGreaterThanOrEqual(0);
  expect(geometry.box.bottom).toBeLessThanOrEqual(geometry.height);
  await session.detach();
  await context.close();
});

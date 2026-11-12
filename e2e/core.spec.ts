import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { createLifecycle } from '../src/core/lifecycle';
import type { ChangeEvent } from '../src/core/types';

declare global {
  interface Window {
    coreFixture: ReturnType<typeof createLifecycle>;
  }
}

test('restores synchronously, announces in shadow DOM, and preserves host keyboard access', async ({
  page,
  browserName,
}) => {
  await page.goto('/core.html');
  await page.waitForFunction(() => !!window.coreFixture);
  await page.evaluate(() => {
    localStorage.setItem(
      'e2e:early',
      JSON.stringify({ version: 1, state: { fontSize: 160 } }),
    );
    const instance = window.coreFixture.init({ storageKey: 'e2e:early' });
    if (
      document.documentElement.style.getPropertyValue(
        '--accessiblit-test-size',
      ) !== '160'
    )
      throw new Error('Preferences applied late');
    Reflect.set(globalThis, 'instance', instance);
  });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
  await expect(page.getByRole('link', { name: 'Host link' })).toBeFocused();
  await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
  await expect(page.getByRole('button', { name: 'Host button' })).toBeFocused();
  await page.keyboard.press(
    browserName === 'webkit' ? 'Alt+Shift+Tab' : 'Shift+Tab',
  );
  await expect(page.getByRole('link', { name: 'Host link' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#end$/);
  const targets = await page.locator('.test-target').evaluateAll((elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        width: rect.width,
        height: rect.height,
        foreground: style.color,
        background: style.backgroundColor,
      };
    }),
  );
  for (const target of targets) {
    expect(target.width).toBeGreaterThanOrEqual(44);
    expect(target.height).toBeGreaterThanOrEqual(44);
    expect(target.foreground).toBe('rgb(17, 17, 17)');
    expect(target.background).toBe('rgb(255, 255, 255)');
  }
  console.log('HOST_TARGETS', JSON.stringify(targets));
  await page.evaluate(() => {
    const instance = Reflect.get(globalThis, 'instance') as ReturnType<
      Window['coreFixture']['init']
    >;
    instance.setFeature('darkMode', true);
    document.dispatchEvent(new Event('accessiblit-test-event'));
  });
  const status = page.locator('[data-accessiblit-host]').getByRole('status');
  await expect(status).toHaveText('Test event received');
  const hidden = await status.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      width: style.inlineSize,
      height: style.blockSize,
      clip: style.clipPath,
    };
  });
  expect(hidden).toEqual({ width: '1px', height: '1px', clip: 'inset(50%)' });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.evaluate(() => window.coreFixture.destroy());
  await expect(page.locator('[data-accessiblit-host]')).toHaveCount(0);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test('synchronizes two real tabs without write echoes or expanded hook payloads', async ({
  page,
  context,
}) => {
  const other = await context.newPage();
  for (const tab of [page, other]) {
    await tab.goto('/core.html');
    await tab.waitForFunction(() => !!window.coreFixture);
    await tab.evaluate(() => {
      const changes: ChangeEvent[] = [];
      const writes: string[] = [];
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        writes.push(key);
        original.call(this, key, value);
      };
      Reflect.set(globalThis, 'changes', changes);
      Reflect.set(globalThis, 'writes', writes);
      Reflect.set(
        globalThis,
        'instance',
        window.coreFixture.init({
          storageKey: 'e2e:sync',
          onChange: (event) => changes.push(event),
        }),
      );
    });
  }
  await page.evaluate(() =>
    (
      Reflect.get(globalThis, 'instance') as ReturnType<
        Window['coreFixture']['init']
      >
    ).setFeature('fontSize', 120),
  );
  await expect
    .poll(() =>
      other.evaluate(
        () =>
          (
            Reflect.get(globalThis, 'instance') as ReturnType<
              Window['coreFixture']['init']
            >
          ).getState().fontSize,
      ),
    )
    .toBe(120);
  for (const tab of [page, other])
    expect((await new AxeBuilder({ page: tab }).analyze()).violations).toEqual(
      [],
    );
  await other.evaluate(() =>
    (
      Reflect.get(globalThis, 'instance') as ReturnType<
        Window['coreFixture']['init']
      >
    ).reset(),
  );
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            Reflect.get(globalThis, 'instance') as ReturnType<
              Window['coreFixture']['init']
            >
          ).getState().fontSize,
      ),
    )
    .toBe(100);
  for (const tab of [page, other]) {
    expect(await tab.evaluate(() => Reflect.get(globalThis, 'writes'))).toEqual(
      ['e2e:sync'],
    );
    expect(
      await tab.evaluate(() => Reflect.get(globalThis, 'changes')),
    ).toEqual([
      { id: 'fontSize', value: 120 },
      { id: 'fontSize', value: 100 },
    ]);
    await tab.evaluate(() => window.coreFixture.destroy());
  }
  await other.close();
});

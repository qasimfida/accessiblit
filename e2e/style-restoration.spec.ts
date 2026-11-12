import { expect, test } from '@playwright/test';

test('restores root serialization after repeated CSSOM changes and frame boundaries', async ({
  page,
}) => {
  await page.goto('/panel.html');
  await page.waitForFunction(() => !!window.panelInstance);
  const restored = await page.evaluate(async () => {
    window.panelInstance.destroy();
    const before = document.documentElement.outerHTML;
    const frame = () =>
      new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    for (let index = 0; index < 10; index++) {
      const instance = window.panelFixture.init({ persist: false });
      instance.open();
      await frame();
      instance.close();
      await frame();
      instance.setFeature('fontSize', 120);
      instance.reset();
      instance.destroy();
      await frame();
      if (document.documentElement.outerHTML !== before) return false;
    }
    return true;
  });
  expect(restored).toBe(true);
});

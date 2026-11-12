import { expect, test } from '@playwright/test';
import { loadContent } from './helpers/content';
test('highlights links and heading levels without editing page markup', async ({
  page,
}) => {
  await loadContent(page, 'article');
  await page.evaluate(() => {
    const link = document.createElement('span');
    link.setAttribute('role', 'link');
    link.tabIndex = 0;
    link.id = 'custom-link';
    link.textContent = 'Custom link';
    const heading = document.createElement('div');
    heading.id = 'custom-heading';
    heading.setAttribute('role', 'heading');
    heading.setAttribute('aria-level', '3');
    heading.textContent = 'Custom heading';
    document.querySelector('main')!.append(link, heading);
  });
  const before = await page.locator('main').evaluate((e) => e.outerHTML);
  await page.evaluate(() => {
    window.contentInstance.setFeature('highlightLinks', true);
    window.contentInstance.setFeature('highlightHeadings', true);
  });
  for (const selector of ['main a', '#custom-link']) {
    await expect(page.locator(selector)).toHaveCSS('outline-width', '2px');
    await expect(page.locator(selector)).toHaveCSS(
      'text-decoration-line',
      'underline',
    );
  }
  const badges = await page
    .locator('main h1,main h2,#custom-heading')
    .evaluateAll((nodes) =>
      nodes.map((e) => getComputedStyle(e, '::after').content),
    );
  expect(badges[0]).toContain('H1');
  expect(badges[1]).toContain('H2');
  expect(badges[badges.length - 1]).toMatch(/3|attr\(aria-level\)/);
  expect(await page.locator('main').evaluate((e) => e.outerHTML)).toBe(before);
  await expect(
    page.getByRole('heading', {
      name: 'Making room for every reader',
      exact: true,
    }),
  ).toBeVisible();
});

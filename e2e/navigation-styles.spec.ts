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

test('decorates graphical links and overrides their authored cursor', async ({
  page,
}) => {
  await loadContent(page, 'article');
  await page.evaluate(() => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '200');
    svg.setAttribute('height', '40');
    const link = document.createElementNS(svg.namespaceURI, 'a');
    link.id = 'graphical-link';
    link.setAttribute('href', '#');
    (link as SVGAElement).style.cursor = 'crosshair';
    const text = document.createElementNS(svg.namespaceURI, 'text');
    text.setAttribute('x', '4');
    text.setAttribute('y', '24');
    text.textContent = 'Graphical link';
    link.append(text);
    svg.append(link);
    document.querySelector('main')!.append(svg);
    window.contentInstance.setFeature('highlightLinks', true);
    window.contentInstance.setFeature('bigCursor', 2);
  });
  await expect(page.locator('#graphical-link')).toHaveCSS(
    'outline-width',
    '2px',
  );
  await expect(page.locator('#graphical-link')).toHaveCSS(
    'text-decoration-line',
    'underline',
  );
  expect(
    decodeURIComponent(
      await page
        .locator('#graphical-link')
        .evaluate((e) => getComputedStyle(e).cursor),
    ),
  ).toContain('width="48"');
});

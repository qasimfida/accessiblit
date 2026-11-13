import { expect, test } from '@playwright/test';
import { loadSite, SITE_PAGES } from './helpers';

test('all site requests stay first-party, including live widget interactions', async ({
  page,
  context,
  baseURL,
}, info) => {
  const urls: string[] = [];
  context.on('request', (request) => urls.push(request.url()));
  for (const path of SITE_PAGES) {
    const errors = await loadSite(page, path);
    await page.waitForLoadState('networkidle');
    const initial = urls.length;
    await page
      .getByRole('button', { name: 'Open accessibility options', exact: true })
      .click();
    await page
      .getByRole('radio', { name: 'Dyslexia-friendly', exact: true })
      .check();
    await page.getByRole('button', { name: 'Dark mode', exact: true }).click();
    await page.getByRole('button', { name: 'Reset all', exact: true }).click();
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    expect(urls.length).toBe(initial);
    expect(errors).toEqual([]);
  }
  const origin = new URL(baseURL!).origin;
  const thirdParty = urls.filter(
    (url) => /^https?:/.test(url) && new URL(url).origin !== origin,
  );
  expect(thirdParty).toEqual([]);
  expect(await context.cookies()).toEqual([]);
  const keys = await page.evaluate(() => {
    try {
      return Object.keys(localStorage);
    } catch {
      return null;
    }
  });
  expect(keys).toEqual(['accessiblit:v1']);
  console.log(
    'SITE_REQUESTS',
    JSON.stringify({ project: info.project.name, urls, thirdParty }),
  );
});

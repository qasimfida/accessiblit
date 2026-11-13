import { expect, test } from '@playwright/test';
import { loadSite, SITE_PAGES } from './helpers';

test('every internal destination, fragment and local asset resolves', async ({
  page,
  request,
  baseURL,
}) => {
  const origin = new URL(baseURL!).origin;
  const links = new Set<string>();
  for (const path of SITE_PAGES) {
    const errors = await loadSite(page, path);
    const hrefs = await page
      .locator('a[href],script[src],link[rel="stylesheet"],link[rel="icon"]')
      .evaluateAll((elements) =>
        elements.map((e) => e.getAttribute('href') ?? e.getAttribute('src')!),
      );
    for (const href of hrefs) {
      const url = new URL(href, page.url());
      if (url.origin === origin) links.add(url.href);
    }
    expect(errors).toEqual([]);
  }
  const cache = new Map<string, string>();
  for (const href of links) {
    const url = new URL(href),
      key = url.origin + url.pathname;
    if (!cache.has(key)) {
      const response = await request.get(key);
      expect(response.status(), key).toBe(200);
      cache.set(key, await response.text());
    }
    if (url.hash) {
      expect(
        await page.evaluate(
          ({ html, id }) =>
            !!new DOMParser()
              .parseFromString(html, 'text/html')
              .getElementById(id),
          { html: cache.get(key)!, id: decodeURIComponent(url.hash.slice(1)) },
        ),
        href,
      ).toBe(true);
    }
  }
  console.log(
    'SITE_LINKS',
    JSON.stringify({
      checked: links.size,
      destinations: cache.size,
      broken: 0,
    }),
  );
});

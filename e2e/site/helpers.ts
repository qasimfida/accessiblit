import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/** Every authored page is audited, including the deliberately non-indexable error page. */
export const SITE_PAGES = [
  '',
  'install/',
  'options/',
  'faq/',
  '404.html',
] as const;

/** Independent media and viewport dimensions keep the evidence explicit rather than implied. */
export const SITE_PROFILES = [
  'light',
  'dark',
  'forced',
  'reduced',
  'rtl',
  'small',
  'spacing',
] as const;

/** Exercise the built page on its project base and retain host/runtime errors. */
export async function loadSite(
  page: Page,
  path: string,
  profile: (typeof SITE_PROFILES)[number] = 'light',
) {
  await page.emulateMedia({
    colorScheme: profile === 'dark' ? 'dark' : 'light',
    forcedColors: profile === 'forced' ? 'active' : 'none',
    reducedMotion: profile === 'reduced' ? 'reduce' : 'no-preference',
  });
  if (profile === 'small')
    await page.setViewportSize({ width: 320, height: 256 });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  expect((await page.goto(path || './'))?.status()).toBe(200);
  if (profile === 'rtl')
    await page.evaluate(() => {
      document.documentElement.dir = 'rtl';
    });
  if (profile === 'spacing')
    await page.addStyleTag({
      content:
        '* { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; } p { margin-block-end: 2em !important; }',
    });
  await expect(
    page.getByRole('button', {
      name: 'Open accessibility options',
      exact: true,
    }),
  ).toBeVisible();
  return errors;
}

/** Resolve rendered solid backgrounds for the authored site instead of assuming token contrast. */
export async function siteMetrics(page: Page) {
  return page.evaluate(() => {
    const rgb = (value: string) => {
      const numbers = value.match(/[\d.]+/g)?.map(Number) ?? [];
      return {
        r: numbers[0] ?? 0,
        g: numbers[1] ?? 0,
        b: numbers[2] ?? 0,
        a: numbers[3] ?? 1,
      };
    };
    const light = (c: ReturnType<typeof rgb>) =>
      [c.r, c.g, c.b]
        .map((n) => n / 255)
        .map((n) => (n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4))
        .reduce((sum, n, i) => sum + n * [0.2126, 0.7152, 0.0722][i]!, 0);
    const ratio = (a: ReturnType<typeof rgb>, b: ReturnType<typeof rgb>) =>
      (Math.max(light(a), light(b)) + 0.05) /
      (Math.min(light(a), light(b)) + 0.05);
    const background = (element: Element): ReturnType<typeof rgb> => {
      const color = rgb(getComputedStyle(element).backgroundColor);
      if (color.a === 1) return color;
      return element.parentElement
        ? background(element.parentElement)
        : rgb('rgb(255,255,255)');
    };
    const values: number[] = [];
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walk.nextNode())) {
      const parent = node.parentElement;
      if (
        !parent ||
        !node.textContent?.trim() ||
        parent.closest('script,style,noscript,svg')
      )
        continue;
      const style = getComputedStyle(parent),
        rect = parent.getBoundingClientRect();
      if (style.visibility !== 'visible' || !rect.width || !rect.height)
        continue;
      values.push(ratio(rgb(style.color), background(parent)));
    }
    const targets = [
      ...document.querySelectorAll<HTMLElement>(
        'nav a, .button, button, .skip-link',
      ),
    ]
      .map((e) => e.getBoundingClientRect())
      .filter((r) => r.width && r.height);
    return {
      minimumTextContrast: Math.min(...values),
      minimumTarget: Math.min(
        ...targets.map((r) => Math.min(r.width, r.height)),
      ),
    };
  });
}

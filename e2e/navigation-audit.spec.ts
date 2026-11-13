import { mkdir } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { loadContent } from './helpers/content';
for (const profile of ['normal', 'reduced', 'forced'] as const)
  test(
    'records reading-surface paint and focus: ' + profile,
    async ({ page, browserName }) => {
      await page.setViewportSize({ width: 320, height: 256 });
      await page.emulateMedia({
        reducedMotion: profile === 'reduced' ? 'reduce' : 'no-preference',
        forcedColors: profile === 'forced' ? 'active' : 'none',
      });
      await loadContent(page, 'article');
      await page.evaluate(() => {
        for (const id of [
          'readingGuide',
          'readingMask',
          'highlightLinks',
          'highlightHeadings',
        ] as const)
          window.contentInstance.setFeature(id, true);
      });
      await page.mouse.move(100, 160);
      const guide = page.locator('[data-accessiblit-overlay="guide"]');
      await expect
        .poll(() =>
          guide.evaluate((e) => Math.round(e.getBoundingClientRect().top)),
        )
        .toBe(160);
      const evidence = await page
        .locator('[data-accessiblit-host]')
        .evaluate((host) =>
          [
            ...host.shadowRoot!.querySelectorAll('[data-accessiblit-overlay]'),
          ].map((e) => {
            const s = getComputedStyle(e);
            return {
              kind: e.getAttribute('data-accessiblit-overlay'),
              box: e.getBoundingClientRect().toJSON(),
              pointer: s.pointerEvents,
              shadow: s.boxShadow,
              transition: s.transitionProperty,
              animation: s.animationName,
              hiddenFromAT: e.getAttribute('aria-hidden'),
            };
          }),
        );
      expect(evidence).toHaveLength(2);
      expect(evidence.find((e) => e.kind === 'guide')!.box.height).toBeCloseTo(
        3,
        1,
      );
      for (const row of evidence) {
        expect(row.pointer).toBe('none');
        expect(row.hiddenFromAT).toBe('true');
      }
      if (process.env.ACCESSIBLIT_NAVIGATION_EVIDENCE) {
        const folder = new URL('../reports/assets/phase-5/', import.meta.url);
        await mkdir(folder, { recursive: true });
        await page.screenshot({
          path: new URL(`${browserName}-surfaces-${profile}.png`, folder)
            .pathname,
          caret: 'initial',
        });
      }
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
      console.log(
        'NAVIGATION_SURFACES',
        browserName,
        profile,
        JSON.stringify(evidence),
      );
    },
  );

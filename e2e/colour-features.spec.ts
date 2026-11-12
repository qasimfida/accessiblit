import { mkdir } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { FeatureId } from '../src/core/types';
import { CONTENT_FIXTURES, loadContent } from './helpers/content';
import { uiEvidence } from './helpers/ui-evidence';
const modes: Record<string, FeatureId[]> = {
  dark: ['darkMode'],
  contrast: ['highContrast'],
  monochrome: ['monochrome'],
  low: ['lowSaturation'],
  'dark-mono': ['darkMode', 'monochrome'],
  'contrast-low': ['highContrast', 'lowSaturation'],
  all: ['darkMode', 'highContrast', 'monochrome', 'lowSaturation'],
};
for (const fixture of [...CONTENT_FIXTURES, 'colour-lab'])
  for (const [mode, ids] of Object.entries(modes))
    test(`${mode} on ${fixture}`, async ({ page, browserName }) => {
      await loadContent(page, fixture);
      if (fixture === 'colour-lab') {
        await page
          .locator('video')
          .evaluate(async (video: HTMLVideoElement) => {
            const frame = new Promise<void>((resolve) =>
              video.requestVideoFrameCallback(() => resolve()),
            );
            await video.play();
            await frame;
            video.pause();
          });
        await page.waitForTimeout(150);
      }
      const before = await page.evaluate(() => {
        window.contentInstance.destroy();
        return document.documentElement.outerHTML;
      });
      await page.evaluate((ids) => {
        window.contentInstance = window.contentInit({ persist: false });
        for (const id of ids) window.contentInstance.setFeature(id, true);
      }, ids);
      await page.waitForTimeout(50);
      const palette = ids.includes('darkMode') || ids.includes('highContrast');
      if (palette) {
        const violations = (
          await new AxeBuilder({ page }).withRules(['color-contrast']).analyze()
        ).violations;
        expect(violations).toEqual([]);
        const contrast = await page
          .locator(
            'main p,main h1,main h2,main label,main a,main td,main th,header a',
          )
          .evaluateAll((nodes) => {
            const lum = (value: string) => {
              const channels = value
                .match(/[\d.]+/g)!
                .slice(0, 3)
                .map(Number)
                .map((n) => {
                  const c = n / 255;
                  return c <= 0.04045
                    ? c / 12.92
                    : ((c + 0.055) / 1.055) ** 2.4;
                });
              return (
                channels[0]! * 0.2126 +
                channels[1]! * 0.7152 +
                channels[2]! * 0.0722
              );
            };
            return nodes
              .filter((e) => e.getBoundingClientRect().width > 0)
              .map((e) => {
                const s = getComputedStyle(e),
                  a = lum(s.color),
                  b = lum(s.backgroundColor);
                return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
              });
          });
        expect(Math.min(...contrast)).toBeGreaterThanOrEqual(7);
        console.log(
          'COLOUR_CONTRAST',
          browserName,
          fixture,
          mode,
          Math.min(...contrast),
        );
      }
      if (process.env.ACCESSIBLIT_COLOUR_EVIDENCE) {
        const folder = new URL('../reports/assets/phase-4/', import.meta.url);
        await mkdir(folder, { recursive: true });
        await page.screenshot({
          path: new URL(`${browserName}-${fixture}-${mode}.png`, folder)
            .pathname,
          fullPage: true,
          caret: 'initial',
        });
      }
      await page.evaluate(() => window.contentInstance.reset());
      await page.evaluate(() => window.contentInstance.destroy());
      expect(
        await page.evaluate(() => document.documentElement.outerHTML),
      ).toBe(before);
    });
for (const [mode, ids] of Object.entries(modes))
  test(`panel contrast and semantics under ${mode}`, async ({
    page,
    browserName,
  }) => {
    await loadContent(page, 'colour-lab');
    await page.evaluate((ids) => {
      for (const id of ids) window.contentInstance.setFeature(id, true);
      window.contentInstance.open();
    }, ids);
    const evidence = await uiEvidence(page);
    expect(
      Math.min(...evidence.text.map((t) => t.ratio)),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      Math.min(...evidence.boundaries.map((t) => t.ratio)),
    ).toBeGreaterThanOrEqual(3);
    expect(evidence.focus?.ratio).toBeGreaterThanOrEqual(3);
    expect(
      (
        await new AxeBuilder({ page })
          .include('[data-accessiblit-host]')
          .analyze()
      ).violations,
    ).toEqual([]);
    console.log('COLOUR_PANEL', browserName, mode, JSON.stringify(evidence));
  });

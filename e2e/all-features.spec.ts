import { mkdir } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { ALL_FEATURES } from './helpers/all-features';
import { loadContent } from './helpers/content';
import { uiEvidence } from './helpers/ui-evidence';
import { DEFAULT_STATE } from '../src/core/schema';
for (const profile of ['light', 'dark', 'small-reduced', 'forced'] as const)
  test(
    'all eighteen features leave the panel usable: ' + profile,
    async ({ page, browserName }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => {
        if (m.type() === 'error') errors.push(m.text());
      });
      if (profile === 'small-reduced' || profile === 'forced')
        await page.setViewportSize({ width: 320, height: 256 });
      await page.emulateMedia({
        colorScheme: profile === 'dark' ? 'dark' : 'light',
        reducedMotion: profile === 'small-reduced' ? 'reduce' : 'no-preference',
        forcedColors: profile === 'forced' ? 'active' : 'none',
      });
      await loadContent(page, 'article');
      await page.evaluate((state) => {
        for (const [id, value] of Object.entries(state))
          window.contentInstance.setFeature(id as keyof typeof state, value);
      }, ALL_FEATURES);
      expect(
        await page.evaluate(() => window.contentInstance.getState()),
      ).toEqual(ALL_FEATURES);
      await page.evaluate(() => window.contentInstance.open());
      const dialog = page.getByRole('dialog', {
        name: 'Accessibility options',
      });
      await expect(dialog).toBeVisible();
      await expect(
        page.locator('[data-accessiblit-overlay="mask"]'),
      ).toBeHidden();
      await expect(
        page.locator('[data-accessiblit-overlay="guide"]'),
      ).toBeHidden();
      await expect(dialog.locator('.accessiblit-feature')).toHaveCount(18);
      const evidence = await uiEvidence(page);
      expect(evidence.panel.left).toBeGreaterThanOrEqual(0);
      expect(evidence.panel.right).toBeLessThanOrEqual(
        await page.evaluate(() => innerWidth),
      );
      expect(evidence.panel.scrollWidth).toBeLessThanOrEqual(
        evidence.panel.clientWidth + 1,
      );
      expect(
        Math.min(...evidence.targets.map((t) => Math.min(t.width, t.height))),
      ).toBeGreaterThanOrEqual(24);
      expect(
        Math.min(...evidence.text.map((t) => t.ratio)),
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        Math.min(...evidence.boundaries.map((t) => t.ratio)),
      ).toBeGreaterThanOrEqual(3);
      const names: string[] = [];
      for (let i = 0; i < 40; i++) {
        await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
        const focused = await page.evaluate(() => {
          const root = document.querySelector(
              '[data-accessiblit-host]',
            )!.shadowRoot!,
            e = root.activeElement;
          const label =
            e?.getAttribute('aria-labelledby') ??
            e?.closest('[role=radiogroup]')?.getAttribute('aria-labelledby');
          return e
            ? label
              ? root.getElementById(label)?.textContent
              : (e.getAttribute('aria-label') ??
                e.closest('label')?.textContent ??
                e.textContent ??
                e.tagName)
            : null;
        });
        if (!focused) break;
        names.push(focused);
      }
      expect(names).toContain('Reading guide');
      expect(names).toContain('Reading mask');
      expect(names).toContain('Focus highlight');
      expect(names).toContain('Reset all');
      await page.keyboard.press('Escape');
      await page.keyboard.press('Alt+KeyA');
      await expect(dialog).toBeVisible();
      await dialog
        .getByRole('button', { name: 'Stop animations', exact: true })
        .focus();
      await page.keyboard.press('Space');
      expect(
        (await page.evaluate(() => window.contentInstance.getState()))
          .stopAnimations,
      ).toBe(false);
      await page.keyboard.press('Space');
      expect(
        (await page.evaluate(() => window.contentInstance.getState()))
          .stopAnimations,
      ).toBe(true);
      if (process.env.ACCESSIBLIT_NAVIGATION_EVIDENCE) {
        const folder = new URL('../reports/assets/phase-5/', import.meta.url);
        await mkdir(folder, { recursive: true });
        await page.screenshot({
          path: new URL(`${browserName}-all-${profile}.png`, folder).pathname,
          caret: 'initial',
        });
      }
      console.log(
        'NAVIGATION_ALL_UI',
        browserName,
        profile,
        JSON.stringify({ names, evidence }),
      );
      await dialog
        .getByRole('button', { name: 'Reset all', exact: true })
        .click();
      expect(
        await page.evaluate(() => window.contentInstance.getState()),
      ).toEqual(DEFAULT_STATE);
      await page.keyboard.press('Escape');
      await expect(
        page.getByRole('button', { name: 'Open accessibility options' }),
      ).toBeFocused();
      expect(errors).toEqual([]);
    },
  );
for (const forced of [false, true])
  test(
    'all eighteen features have zero widget axe violations, forced ' + forced,
    async ({ page }) => {
      await page.emulateMedia({ forcedColors: forced ? 'active' : 'none' });
      await loadContent(page, 'article');
      await page.evaluate((state) => {
        for (const [id, value] of Object.entries(state))
          window.contentInstance.setFeature(id as keyof typeof state, value);
      }, ALL_FEATURES);
      for (const open of [false, true]) {
        if (open) await page.evaluate(() => window.contentInstance.open());
        expect(
          (
            await new AxeBuilder({ page })
              .include('[data-accessiblit-host]')
              .analyze()
          ).violations,
        ).toEqual([]);
      }
    },
  );

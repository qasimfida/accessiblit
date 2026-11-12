import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { uiEvidence } from './helpers/ui-evidence';
import type { AccessiblitInstance } from '../src/core/types';

declare global {
  interface Window {
    panelInstance: AccessiblitInstance;
  }
}

for (const small of [false, true])
  for (const scheme of ['light', 'dark'] as const)
    for (const forced of ['none', 'active'] as const)
      for (const motion of ['no-preference', 'reduce'] as const) {
        const name = `${small ? '320x256' : 'desktop'} ${scheme} forced=${forced} motion=${motion}`;
        test(name, async ({ page }) => {
          await page.setViewportSize(
            small ? { width: 320, height: 256 } : { width: 1280, height: 900 },
          );
          await page.emulateMedia({
            colorScheme: scheme,
            forcedColors: forced,
            reducedMotion: motion,
          });
          await page.goto('/panel.html');
          await page.waitForFunction(() => !!window.panelInstance);
          await expect(
            page.getByRole('button', { name: 'Open accessibility options' }),
          ).toBeVisible();
          expect((await new AxeBuilder({ page }).analyze()).violations).toEqual(
            [],
          );
          await page.keyboard.press('Alt+KeyA');
          await expect(
            page.getByRole('dialog', { name: 'Accessibility options' }),
          ).toBeVisible();
          expect((await new AxeBuilder({ page }).analyze()).violations).toEqual(
            [],
          );
          const evidence = await uiEvidence(page);
          for (const target of evidence.targets) {
            expect(target.width).toBeGreaterThanOrEqual(24);
            expect(target.height).toBeGreaterThanOrEqual(24);
          }
          for (const text of evidence.text)
            expect(
              text.ratio,
              `${text.text}: ${text.foreground}`,
            ).toBeGreaterThanOrEqual(4.5);
          expect(evidence.focus!.width).toBeGreaterThanOrEqual(2);
          expect(evidence.focus!.style).toBe('solid');
          expect(evidence.focus!.ratio).toBeGreaterThanOrEqual(3);
          expect(evidence.iconRatio).toBeGreaterThanOrEqual(3);
          for (const boundary of evidence.boundaries)
            expect(boundary.ratio, boundary.name).toBeGreaterThanOrEqual(3);
          expect(evidence.panel.left).toBeGreaterThanOrEqual(0);
          expect(evidence.panel.right).toBeLessThanOrEqual(small ? 320 : 1280);
          expect(evidence.panel.top).toBeGreaterThanOrEqual(0);
          expect(evidence.panel.bottom).toBeLessThanOrEqual(small ? 256 : 900);
          expect(
            evidence.panel.scrollWidth - evidence.panel.clientWidth,
          ).toBeLessThanOrEqual(1);
          expect(evidence.documentOverflow).toBeLessThanOrEqual(1);
          if (small)
            expect(evidence.panel.scrollHeight).toBeGreaterThan(
              evidence.panel.clientHeight,
            );
          console.log(
            'PANEL_A11Y',
            test.info().project.name,
            name,
            JSON.stringify({
              minimumTarget: Math.min(
                ...evidence.targets.flatMap((t) => [t.width, t.height]),
              ),
              minimumTextContrast: Math.min(
                ...evidence.text.map((t) => t.ratio),
              ),
              focus: evidence.focus,
              iconRatio: evidence.iconRatio,
              minimumBoundaryContrast: Math.min(
                ...evidence.boundaries.map((b) => b.ratio),
              ),
              panel: evidence.panel,
            }),
          );
          await page.keyboard.press('Escape');
          await expect(
            page.getByRole('button', { name: 'Open accessibility options' }),
          ).toBeFocused();
        });
      }

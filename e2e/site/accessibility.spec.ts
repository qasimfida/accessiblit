import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { loadSite, siteMetrics, SITE_PAGES, SITE_PROFILES } from './helpers';
import { uiEvidence } from '../helpers/ui-evidence';

for (const path of SITE_PAGES)
  for (const profile of SITE_PROFILES)
    test(`accessible page ${path || 'home'} in ${profile}`, async ({
      page,
    }, info) => {
      const errors = await loadSite(page, path, profile);
      await expect(page.locator('main h1')).toHaveCount(1);
      await expect(page.getByRole('main')).toHaveCount(1);
      await expect(
        page.getByRole('navigation', { name: 'Main navigation', exact: true }),
      ).toHaveCount(1);
      expect(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth <=
            document.documentElement.clientWidth + 1,
        ),
      ).toBe(true);
      const site = await siteMetrics(page);
      expect(site.minimumTextContrast).toBeGreaterThanOrEqual(4.5);
      expect(site.minimumTarget).toBeGreaterThanOrEqual(24);
      const closed = await new AxeBuilder({ page }).analyze();
      expect(closed.violations).toEqual([]);
      await page
        .getByRole('button', {
          name: 'Open accessibility options',
          exact: true,
        })
        .click();
      await expect(
        page.getByRole('dialog', { name: 'Accessibility options' }),
      ).toBeVisible();
      const open = await new AxeBuilder({ page }).analyze();
      expect(open.violations).toEqual([]);
      const widget = await uiEvidence(page);
      expect(
        Math.min(...widget.text.map((t) => t.ratio)),
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        Math.min(...widget.targets.map((t) => Math.min(t.width, t.height))),
      ).toBeGreaterThanOrEqual(24);
      const bounds = await page.getByRole('dialog').evaluate((element) => ({
        width: element.clientWidth,
        scroll: element.scrollWidth,
      }));
      expect(bounds.scroll).toBeLessThanOrEqual(bounds.width + 1);
      expect(errors).toEqual([]);
      console.log(
        'SITE_AXE',
        JSON.stringify({
          project: info.project.name,
          path,
          profile,
          site,
          widget: {
            minimumTextContrast: Math.min(...widget.text.map((t) => t.ratio)),
            minimumTarget: Math.min(
              ...widget.targets.map((t) => Math.min(t.width, t.height)),
            ),
          },
          closed: closed.violations.length,
          open: open.violations.length,
          incomplete: {
            closed: closed.incomplete.map((r) => r.id),
            open: open.incomplete.map((r) => r.id),
          },
        }),
      );
    });

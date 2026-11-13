import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { QA_HOSTS, QA_PROFILES, loadQA, auditQA } from './helpers/qa';
import { ALL_FEATURES } from './helpers/all-features';
test.slow(
  ({ browserName }) => browserName === 'firefox',
  'Firefox performs two full axe traversals on hostile hosts; explicit performance budgets remain unchanged.',
);
for (const host of QA_HOSTS)
  for (const profile of QA_PROFILES)
    test(`maximum features on ${host} in ${profile}`, async ({
      page,
    }, info) => {
      const errors = await loadQA(page, host, profile);
      if (host === 'heavy')
        expect(await page.locator('p').count()).toBeGreaterThan(5000);
      await page.evaluate((state) => {
        for (const [id, value] of Object.entries(state))
          window.qaInstance.setFeature(id as keyof typeof state, value);
      }, ALL_FEATURES);
      expect(await page.evaluate(() => window.qaInstance.getState())).toEqual(
        ALL_FEATURES,
      );
      const evidence = await auditQA(page);
      if (host === 'csp-nonce')
        expect(
          await page
            .locator('[data-accessiblit-host]')
            .evaluate((h) =>
              [...h.shadowRoot!.querySelectorAll('style')].every(
                (s) => s.nonce === 'qa-owner',
              ),
            ),
        ).toBe(true);
      await page.keyboard.press('Escape');
      await expect(
        page.getByRole('button', { name: 'Open accessibility options' }),
      ).toBeFocused();
      expect(errors).toEqual([]);
      if (process.env.ACCESSIBLIT_QA_EVIDENCE && profile === 'standard') {
        const folder = new URL('../reports/assets/phase-7/', import.meta.url);
        await mkdir(folder, { recursive: true });
        await page.screenshot({
          path: new URL(`${info.project.name}-${host}.png`, folder).pathname,
        });
      }
      console.log(
        'QA_HOST',
        info.project.name,
        host,
        profile,
        JSON.stringify(evidence),
      );
    });

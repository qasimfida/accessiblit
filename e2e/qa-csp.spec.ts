import { expect, test } from '@playwright/test';
import { ALL_FEATURES } from './helpers/all-features';
import { loadQA, auditQA } from './helpers/qa';
for (const host of ['csp', 'csp-nonce'])
  test(`strict ${host} applies page and widget styles`, async ({
    page,
  }, info) => {
    const errors = await loadQA(page, host, 'standard');
    await page.evaluate((state) => {
      for (const [id, value] of Object.entries(state))
        window.qaInstance.setFeature(id as keyof typeof state, value);
    }, ALL_FEATURES);
    await expect(page.locator('main > p')).toHaveCSS('font-size', '32px');
    expect(errors).toEqual([]);
    const evidence = await auditQA(page);
    expect(errors).toEqual([]);
    console.log('QA_CSP', info.project.name, host, JSON.stringify(evidence));
  });

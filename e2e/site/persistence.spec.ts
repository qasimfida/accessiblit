import { expect, test } from '@playwright/test';
import { loadSite } from './helpers';
import { sampleContentFrames } from './frame-probe';

test('head bootstrap restores preferences before the first sampled content frame', async ({
  page,
}, info) => {
  await loadSite(page, '');
  const probe = page.locator('.demo-copy p').first();
  const baseline = await probe.evaluate((element) =>
    parseFloat(getComputedStyle(element).fontSize),
  );
  await page
    .getByRole('button', { name: 'Open live demo options', exact: true })
    .click();
  const increase = page.getByRole('button', {
    name: 'Increase Font size',
    exact: true,
  });
  await increase.click();
  await increase.click();
  await expect(page.getByRole('status')).toHaveText('Font size 120 percent');
  await page.addInitScript(sampleContentFrames);
  await page.reload();
  await page.waitForFunction(
    () => Reflect.get(window, 'siteFirstFrames').length >= 5,
  );
  const frames = await page.evaluate(
    () => Reflect.get(window, 'siteFirstFrames') as number[],
  );
  for (const value of frames) expect(value).toBeCloseTo(baseline * 1.2, 1);
  console.log(
    'SITE_FIRST_FRAME',
    JSON.stringify({
      project: info.project.name,
      baseline,
      expected: baseline * 1.2,
      frames,
      emptyFrames: await page.evaluate(
        () => Reflect.get(window, 'siteEmptyFrames') as number,
      ),
    }),
  );
});

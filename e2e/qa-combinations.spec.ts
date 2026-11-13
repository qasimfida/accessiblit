import { expect, test } from '@playwright/test';
import { DEFAULT_STATE, FEATURE_IDS } from '../src/core/schema';
import { pairwiseStates } from './helpers/pairwise';
import { ALL_FEATURES } from './helpers/all-features';
import { loadQA, auditQA, QA_HOSTS, QA_PROFILES } from './helpers/qa';
const cases = [
  ...FEATURE_IDS.map((id, index) => ({
    name: `single maximum ${id}`,
    state: { ...DEFAULT_STATE, [id]: ALL_FEATURES[id] },
    host: 'plain',
    profile: QA_PROFILES[index % QA_PROFILES.length]!,
  })),
  ...pairwiseStates().map((state, index) => ({
    name: `binary pairwise ${index}`,
    state,
    host: QA_HOSTS[index % QA_HOSTS.length]!,
    profile: QA_PROFILES[index % QA_PROFILES.length]!,
  })),
];
for (const entry of cases)
  test(entry.name, async ({ page }, info) => {
    const errors = await loadQA(page, entry.host, entry.profile);
    await page.evaluate((state) => {
      for (const [id, value] of Object.entries(state))
        window.qaInstance.setFeature(id as keyof typeof state, value);
    }, entry.state);
    expect(await page.evaluate(() => window.qaInstance.getState())).toEqual(
      entry.state,
    );
    const evidence = await auditQA(page);
    await page.keyboard.press('Escape');
    await expect(
      page.getByRole('button', { name: 'Open accessibility options' }),
    ).toBeFocused();
    expect(errors).toEqual([]);
    console.log(
      'QA_COMBINATION',
      info.project.name,
      entry.name,
      entry.host,
      entry.profile,
      JSON.stringify(evidence),
    );
  });

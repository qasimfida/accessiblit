import { expect, it } from 'vitest';
import { pairwiseStates } from '../../e2e/helpers/pairwise';
import {
  DEFAULT_STATE,
  FEATURE_IDS,
  isFeatureValue,
} from '../../src/core/schema';
it('covers all four off/maximum assignments for every one of the 153 feature pairs', () => {
  const rows = pairwiseStates();
  expect(rows).toHaveLength(32);
  for (const row of rows)
    for (const id of FEATURE_IDS)
      expect(isFeatureValue(id, row[id])).toBe(true);
  let pairs = 0;
  for (let i = 0; i < FEATURE_IDS.length; i++)
    for (let j = i + 1; j < FEATURE_IDS.length; j++) {
      const a = FEATURE_IDS[i]!,
        b = FEATURE_IDS[j]!;
      const seen = new Set(
        rows.map(
          (row) =>
            `${Number(!Object.is(row[a], DEFAULT_STATE[a]))}${Number(!Object.is(row[b], DEFAULT_STATE[b]))}`,
        ),
      );
      expect([...seen].sort()).toEqual(['00', '01', '10', '11']);
      pairs++;
    }
  expect(pairs).toBe(153);
});

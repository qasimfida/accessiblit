import { expect, it } from 'vitest';
import { createFeatures } from '../../src/features/index';
import { resolveOptions } from '../../src/core/options';
import { FEATURE_IDS } from '../../src/core/schema';
it('exposes all eighteen metadata records in catalogue order', () => {
  const features = createFeatures(resolveOptions());
  expect(features.map((f) => f.id)).toEqual(FEATURE_IDS);
  expect(new Set(features.map((f) => f.id)).size).toBe(18);
  for (const f of features) {
    expect(f.label.length).toBeGreaterThan(0);
    expect(f.description.length).toBeGreaterThan(0);
  }
});

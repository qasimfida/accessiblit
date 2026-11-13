import { DEFAULT_STATE, FEATURE_IDS } from '../../src/core/schema';
import type { FeatureId } from '../../src/core/types';
import { ALL_FEATURES } from './all-features';
/** Distinct nonzero linear forms over five seed bits cover every binary feature pair in 32 rows. */
export function pairwiseStates(): Record<FeatureId, unknown>[] {
  const bits = Math.ceil(Math.log2(FEATURE_IDS.length + 1));
  return Array.from({ length: 2 ** bits }, (_, row) => {
    const state: Record<FeatureId, unknown> = { ...DEFAULT_STATE };
    FEATURE_IDS.forEach((id, index) => {
      let input = row & (index + 1),
        parity = 0;
      while (input) {
        parity ^= input & 1;
        input >>>= 1;
      }
      state[id] = parity ? ALL_FEATURES[id] : DEFAULT_STATE[id];
    });
    return state;
  });
}

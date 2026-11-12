import { expect, it } from 'vitest';
import { contentScale } from '../../src/features/content-scale';
import { featureEngine } from '../helpers/feature-engine';
it('releases every scale level and leaves the original page intact', () => {
  const before = document.documentElement.outerHTML,
    engine = featureEngine(contentScale);
  try {
    for (let value = 110; value <= 200; value += 10) {
      engine.set(value);
      expect(
        document.documentElement.style.getPropertyValue(
          '--accessiblit-content-scale',
        ),
      ).toBe(String(value / 100));
      engine.set(100);
      expect(document.documentElement.outerHTML).toBe(before);
    }
  } finally {
    engine.destroy();
  }
});

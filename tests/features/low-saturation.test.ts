import { expect, it } from 'vitest';
import { lowSaturation } from '../../src/features/low-saturation';
import { featureEngine } from '../helpers/feature-engine';
it('registers reduced chroma with full teardown', () => {
  const before = document.documentElement.outerHTML,
    engine = featureEngine(lowSaturation);
  engine.set(false);
  expect(document.documentElement.outerHTML).toBe(before);
  engine.set(true);
  expect(
    document.documentElement.style.getPropertyValue(
      '--accessiblit-low-saturation-chroma',
    ),
  ).toBe('0.35');
  engine.destroy();
  expect(document.documentElement.outerHTML).toBe(before);
});

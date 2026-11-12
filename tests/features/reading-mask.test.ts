import { expect, it } from 'vitest';
import { readingMask } from '../../src/features/reading-mask';
import { featureEngine } from '../helpers/feature-engine';
it('owns the mask state and its bounded opacity while waiting for the host', () => {
  const before = document.documentElement.outerHTML,
    engine = featureEngine(readingMask);
  engine.set(false);
  engine.set(true);
  expect(
    document.documentElement.style.getPropertyValue(
      '--accessiblit-reading-mask-opacity',
    ),
  ).toBe('0.04');
  engine.set(false);
  expect(document.documentElement.outerHTML).toBe(before);
  engine.destroy();
});

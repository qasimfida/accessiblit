import { expect, it } from 'vitest';
import { monochrome } from '../../src/features/monochrome';
import { featureEngine } from '../helpers/feature-engine';
it('registers a reversible monochrome toggle', () => {
  const before = document.documentElement.outerHTML,
    engine = featureEngine(monochrome);
  engine.set(false);
  expect(document.documentElement.outerHTML).toBe(before);
  engine.set(true);
  expect(
    document.documentElement.style.getPropertyValue(
      '--accessiblit-monochrome-chroma',
    ),
  ).toBe('0');
  engine.set(false);
  expect(document.documentElement.outerHTML).toBe(before);
  engine.destroy();
});

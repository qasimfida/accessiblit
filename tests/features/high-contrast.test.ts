import { expect, it } from 'vitest';
import { highContrast } from '../../src/features/high-contrast';
import { featureEngine } from '../helpers/feature-engine';
it('keeps high-contrast resources scoped through disable and destroy', () => {
  const before = document.documentElement.outerHTML;
  const engine = featureEngine(highContrast);
  engine.set(false);
  expect(document.documentElement.outerHTML).toBe(before);
  engine.set(true);
  expect(
    document.documentElement.style.getPropertyValue(
      '--accessiblit-contrast-bg',
    ),
  ).toBe('#000');
  expect(
    document.documentElement.classList.contains('accessiblit-high-contrast'),
  ).toBe(true);
  engine.set(false);
  expect(document.documentElement.outerHTML).toBe(before);
  engine.set(true);
  engine.destroy();
  expect(document.documentElement.outerHTML).toBe(before);
});

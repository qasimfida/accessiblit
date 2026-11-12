import { expect, it } from 'vitest';
import { darkMode } from '../../src/features/dark-mode';
import { featureEngine } from '../helpers/feature-engine';
it('owns its palette variables and restores raw root attributes', () => {
  const before = document.documentElement.outerHTML;
  const engine = featureEngine(darkMode);
  engine.set(false);
  expect(document.documentElement.outerHTML).toBe(before);
  engine.set(true);
  expect(
    document.documentElement.classList.contains('accessiblit-dark-mode'),
  ).toBe(true);
  expect(
    document.documentElement.style.getPropertyValue('--accessiblit-dark-bg'),
  ).toBe('#121212');
  engine.set(false);
  expect(document.documentElement.outerHTML).toBe(before);
  engine.set(true);
  engine.destroy();
  expect(document.documentElement.outerHTML).toBe(before);
});

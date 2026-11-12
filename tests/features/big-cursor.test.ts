import { expect, it } from 'vitest';
import { bigCursor } from '../../src/features/big-cursor';
import { featureEngine } from '../helpers/feature-engine';
it('supports both cursor sizes and restores root metadata', () => {
  const before = document.documentElement.outerHTML,
    engine = featureEngine(bigCursor);
  engine.set(false);
  expect(document.documentElement.outerHTML).toBe(before);
  for (const value of [true, 2]) {
    engine.set(value);
    expect(
      document.documentElement.classList.contains('accessiblit-big-cursor'),
    ).toBe(true);
    engine.set(false);
    expect(document.documentElement.outerHTML).toBe(before);
  }
  engine.destroy();
});

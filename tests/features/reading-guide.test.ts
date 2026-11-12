import { expect, it } from 'vitest';
import { readingGuide } from '../../src/features/reading-guide';
import { featureEngine } from '../helpers/feature-engine';
it('owns the guide state while waiting for its host', () => {
  const before = document.documentElement.outerHTML,
    engine = featureEngine(readingGuide);
  engine.set(false);
  engine.set(true);
  expect(
    document.documentElement.classList.contains('accessiblit-reading-guide'),
  ).toBe(true);
  engine.set(false);
  expect(document.documentElement.outerHTML).toBe(before);
  engine.destroy();
});

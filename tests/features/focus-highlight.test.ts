import { expect, it, vi } from 'vitest';
import { focusHighlight } from '../../src/features/focus-highlight';
import { featureEngine } from '../helpers/feature-engine';
it('owns focus styles, padding and a cancellable geometry frame', () => {
  const raf = vi.fn(() => 7),
    cancel = vi.fn();
  vi.stubGlobal('requestAnimationFrame', raf);
  vi.stubGlobal('cancelAnimationFrame', cancel);
  const before = document.documentElement.outerHTML,
    engine = featureEngine(focusHighlight);
  engine.set(false);
  engine.set(true);
  expect(
    document.documentElement.classList.contains('accessiblit-focus-highlight'),
  ).toBe(true);
  expect(raf).toHaveBeenCalledTimes(1);
  engine.set(false);
  expect(cancel).toHaveBeenCalledWith(7);
  expect(document.documentElement.outerHTML).toBe(before);
  engine.destroy();
  vi.unstubAllGlobals();
});

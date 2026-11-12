import { afterEach, expect, it } from 'vitest';
import { featureEngine } from '../helpers/feature-engine';
import { lineHeight } from '../../src/features/line-height';
import { letterSpacing } from '../../src/features/letter-spacing';
const cleanups: (() => void)[] = [];
afterEach(() => {
  cleanups.forEach((fn) => fn());
  cleanups.length = 0;
  document.body.replaceChildren();
});
for (const item of [
  {
    feature: lineHeight,
    variable: '--accessiblit-line-height',
    levels: [0, 1.5, 1.75, 2],
    unit: '',
  },
  {
    feature: letterSpacing,
    variable: '--accessiblit-letter-spacing',
    levels: [0, 0.12, 0.16, 0.2],
    unit: 'em',
  },
])
  it(`${item.feature.id} releases every level without page residue`, () => {
    const p = document.createElement('p');
    p.textContent = 'Text';
    p.style.fontSize = '16px';
    document.body.append(p);
    const before = document.documentElement.outerHTML,
      engine = featureEngine(item.feature);
    cleanups.push(engine.destroy);
    for (const value of item.levels.slice(1)) {
      engine.set(value);
      expect(
        document.documentElement.style.getPropertyValue(item.variable),
      ).toBe(String(value) + item.unit);
      engine.set(0);
      expect(document.documentElement.outerHTML).toBe(before);
    }
  });

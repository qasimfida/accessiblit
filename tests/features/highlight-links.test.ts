import { expect, it } from 'vitest';
import { highlightLinks } from '../../src/features/highlight-links';
import { featureEngine } from '../helpers/feature-engine';
it('owns a reversible link class without changing page links', () => {
  const a = document.createElement('a');
  a.href = '#';
  a.textContent = 'Link';
  document.body.append(a);
  const before = document.documentElement.outerHTML,
    engine = featureEngine(highlightLinks);
  engine.set(false);
  expect(document.documentElement.outerHTML).toBe(before);
  engine.set(true);
  expect(
    document.documentElement.classList.contains('accessiblit-highlight-links'),
  ).toBe(true);
  expect(a.outerHTML).toBe('<a href="#">Link</a>');
  engine.set(false);
  expect(document.documentElement.outerHTML).toBe(before);
  engine.destroy();
  a.remove();
});

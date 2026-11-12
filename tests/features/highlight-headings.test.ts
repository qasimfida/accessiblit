import { expect, it } from 'vitest';
import { highlightHeadings } from '../../src/features/highlight-headings';
import { featureEngine } from '../helpers/feature-engine';
it('adds no DOM to headings and restores root metadata', () => {
  const heading = document.createElement('h2');
  heading.textContent = 'Owner heading';
  document.body.append(heading);
  const before = document.documentElement.outerHTML,
    engine = featureEngine(highlightHeadings);
  engine.set(false);
  engine.set(true);
  expect(heading.outerHTML).toBe('<h2>Owner heading</h2>');
  expect(
    document.documentElement.classList.contains(
      'accessiblit-highlight-headings',
    ),
  ).toBe(true);
  engine.destroy();
  expect(document.documentElement.outerHTML).toBe(before);
  heading.remove();
});

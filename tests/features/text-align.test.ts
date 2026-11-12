import { afterEach, expect, it } from 'vitest';
import { textAlign } from '../../src/features/text-align';
import { featureEngine } from '../helpers/feature-engine';
const cleanups: (() => void)[] = [];
afterEach(() => {
  cleanups.forEach((fn) => fn());
  cleanups.length = 0;
  document.body.replaceChildren();
});
it('aligns text inside layouts but protects containers, navigation and control ancestors', () => {
  const flex = document.createElement('div');
  flex.style.display = 'flex';
  const copy = document.createElement('p');
  copy.textContent = 'Copy';
  flex.append(copy);
  const gridBlock = document.createElement('p');
  gridBlock.style.display = 'grid';
  gridBlock.textContent = 'Grid';
  const wrapper = document.createElement('p');
  wrapper.append(document.createElement('input'));
  const nav = document.createElement('nav');
  const navCopy = document.createElement('p');
  navCopy.textContent = 'Navigation';
  nav.append(navCopy);
  const quote = document.createElement('blockquote');
  quote.append(flex);
  document.body.append(quote, gridBlock, wrapper, nav);
  const before = document.documentElement.outerHTML,
    engine = featureEngine(textAlign);
  cleanups.push(engine.destroy);
  for (const value of ['left', 'center', 'right']) {
    engine.set(value);
    expect(copy.hasAttribute('data-accessiblit-align')).toBe(true);
    for (const node of [flex, gridBlock, wrapper, navCopy, quote])
      expect(node.hasAttribute('data-accessiblit-align')).toBe(false);
    engine.set('off');
    expect(document.documentElement.outerHTML).toBe(before);
  }
});
it('reclassifies a block when owner layout changes and releases detached markers', async () => {
  const p = document.createElement('p');
  p.textContent = 'Copy';
  document.body.append(p);
  const engine = featureEngine(textAlign);
  cleanups.push(engine.destroy);
  engine.set('right');
  expect(p.hasAttribute('data-accessiblit-align')).toBe(true);
  p.style.display = 'flex';
  await Promise.resolve();
  await Promise.resolve();
  expect(p.hasAttribute('data-accessiblit-align')).toBe(false);
  p.style.display = 'block';
  await Promise.resolve();
  await Promise.resolve();
  expect(p.hasAttribute('data-accessiblit-align')).toBe(true);
  p.remove();
  await Promise.resolve();
  await Promise.resolve();
  expect(p.hasAttribute('data-accessiblit-align')).toBe(false);
});

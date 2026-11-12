import { afterEach, expect, it, vi } from 'vitest';
import { fontSize } from '../../src/features/font-size';
import { featureEngine } from '../helpers/feature-engine';
const cleanups: (() => void)[] = [];
afterEach(() => {
  cleanups.forEach((fn) => fn());
  cleanups.length = 0;
  document.body.replaceChildren();
  vi.restoreAllMocks();
});
it('owns grouped baselines and restores exact attributes and page styles at default', () => {
  const p = document.createElement('p');
  p.textContent = 'Text';
  p.style.fontSize = '13px';
  p.setAttribute('data-accessiblit-font-size', 'owner');
  document.body.append(p);
  const before = document.documentElement.outerHTML;
  const engine = featureEngine(fontSize);
  cleanups.push(engine.destroy);
  engine.set(200);
  expect(p.getAttribute('data-accessiblit-font-size')).not.toBe('owner');
  expect(p.style.fontSize).toBe('13px');
  expect(
    document.documentElement.style.getPropertyValue('--accessiblit-font-scale'),
  ).toBe('2');
  engine.set(80);
  expect(
    document.documentElement.style.getPropertyValue('--accessiblit-font-scale'),
  ).toBe('0.8');
  engine.set(100);
  expect(document.documentElement.outerHTML).toBe(before);
});
it('reconciles inserted, restyled, hidden and removed text without retaining markers', async () => {
  const engine = featureEngine(fontSize);
  cleanups.push(engine.destroy);
  engine.set(200);
  const p = document.createElement('p');
  p.textContent = 'New';
  p.style.fontSize = '18px';
  document.body.append(p);
  await Promise.resolve();
  await Promise.resolve();
  expect(p.hasAttribute('data-accessiblit-font-size')).toBe(true);
  p.style.fontSize = '21px';
  await Promise.resolve();
  await Promise.resolve();
  expect(
    document.querySelector('[data-accessiblit-style]')?.textContent,
  ).toContain('21px');
  p.hidden = true;
  await Promise.resolve();
  await Promise.resolve();
  expect(p.hasAttribute('data-accessiblit-font-size')).toBe(false);
  p.hidden = false;
  await Promise.resolve();
  await Promise.resolve();
  expect(p.hasAttribute('data-accessiblit-font-size')).toBe(true);
  p.remove();
  await Promise.resolve();
  await Promise.resolve();
  expect(p.hasAttribute('data-accessiblit-font-size')).toBe(false);
});
it('rolls back partial acquisition if installing a rule fails', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const p = document.createElement('p');
  p.textContent = 'Text';
  p.style.fontSize = '16px';
  document.body.append(p);
  const before = document.documentElement.outerHTML;
  const engine = featureEngine(fontSize);
  cleanups.push(engine.destroy);
  vi.spyOn(document.head, 'appendChild').mockImplementation(() => {
    throw new Error('host');
  });
  expect(() => engine.set(200)).not.toThrow();
  expect(document.documentElement.outerHTML).toBe(before);
  expect(warn).toHaveBeenCalledTimes(1);
});

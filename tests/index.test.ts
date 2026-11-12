import { afterEach, expect, it, vi } from 'vitest';
import { destroy, init } from '../src/index';
afterEach(() => {
  destroy();
  vi.unstubAllGlobals();
});
it('initializes one invisible host and replaces an earlier instance', () => {
  destroy();
  const a = init({ persist: false });
  a.open();
  a.close();
  a.toggle();
  expect(a.getState().fontSize).toBe(100);
  a.setFeature('fontSize', 120);
  expect(a.getState().fontSize).toBe(120);
  a.reset();
  expect(a.getState().fontSize).toBe(100);
  const b = init({ persist: false });
  a.destroy();
  expect(document.querySelectorAll('[data-accessiblit-host]')).toHaveLength(1);
  b.destroy();
  expect(document.querySelector('[data-accessiblit-host]')).toBeNull();
});
it('is inert when document is unavailable', () => {
  vi.stubGlobal('document', undefined);
  const a = init();
  a.open();
  a.close();
  a.toggle();
  a.setFeature('fontSize', 150);
  a.reset();
  a.destroy();
  expect(a.getState().fontSize).toBe(100);
});

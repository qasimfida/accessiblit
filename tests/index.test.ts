import { afterEach, expect, it, vi } from 'vitest';
import { destroy, init } from '../src/index';
afterEach(() => {
  destroy();
  vi.unstubAllGlobals();
});
it('initializes one accessible UI and replaces an earlier instance', () => {
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

it('connects public lifecycle methods to the non-modal panel', () => {
  const instance = init({ persist: false });
  const root = document.querySelector('[data-accessiblit-host]')!.shadowRoot!;
  const launcher = root.querySelector('[aria-controls]')!;
  const panel = root.querySelector('[role=dialog]') as HTMLElement;
  expect(panel.hidden).toBe(true);
  instance.open();
  expect(panel.hidden).toBe(false);
  expect(launcher.getAttribute('aria-expanded')).toBe('true');
  instance.close();
  expect(panel.hidden).toBe(true);
  instance.toggle();
  expect(panel.hidden).toBe(false);
  instance.destroy();
  instance.open();
  instance.close();
  instance.toggle();
  expect(document.querySelector('[data-accessiblit-host]')).toBeNull();
});
it('queues an open request before body is ready and allows cancelling it', () => {
  const body = document.body;
  body.remove();
  const instance = init({ persist: false });
  instance.open();
  instance.close();
  instance.toggle();
  document.documentElement.append(body);
  document.dispatchEvent(new Event('DOMContentLoaded'));
  const panel = document
    .querySelector('[data-accessiblit-host]')!
    .shadowRoot!.querySelector('[role=dialog]') as HTMLElement;
  expect(panel.hidden).toBe(false);
  instance.destroy();
});

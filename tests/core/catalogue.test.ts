import { afterEach, expect, it, vi } from 'vitest';
import { createLifecycle } from '../../src/core/lifecycle';
import type { AccessiblitOptions } from '../../src/core/types';
import { testFeatures } from '../helpers/features';
const cleanups: (() => void)[] = [];
afterEach(() => {
  cleanups.forEach((fn) => fn());
  cleanups.length = 0;
  vi.restoreAllMocks();
});
it('constructs a fresh catalogue from validated options for every init', () => {
  const provider = vi.fn((options: AccessiblitOptions) =>
    options.persist ? [] : testFeatures(),
  );
  const engine = createLifecycle(provider);
  cleanups.push(engine.destroy);
  engine.init({
    persist: false,
    dyslexiaFontUrl: 'https://owner.example/font.woff2',
  });
  expect(provider.mock.calls[0]?.[0]).toMatchObject({
    persist: false,
    dyslexiaFontUrl: 'https://owner.example/font.woff2',
  });
  engine.init({ persist: false });
  expect(provider).toHaveBeenCalledTimes(2);
  expect(document.querySelectorAll('[data-accessiblit-host]')).toHaveLength(1);
});
it('contains a failing provider and restores acquired resources', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const engine = createLifecycle(() => {
    throw new Error('catalogue');
  });
  cleanups.push(engine.destroy);
  expect(() => engine.init({ persist: false })).not.toThrow();
  expect(document.querySelector('[data-accessiblit-host]')).toBeNull();
  expect(warn).toHaveBeenCalledTimes(1);
});

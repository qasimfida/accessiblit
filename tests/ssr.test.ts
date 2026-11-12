// @vitest-environment node
import { expect, it } from 'vitest';
import { destroy, init } from '../src/index';

it('imports and initializes without browser globals in Node', () => {
  expect(typeof window).toBe('undefined');
  const instance = init();
  expect(Object.keys(instance.getState())).toHaveLength(18);
  expect(() => instance.destroy()).not.toThrow();
  expect(() => destroy()).not.toThrow();
});

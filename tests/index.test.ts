import { expect, test } from 'vitest';
import { init, destroy } from '../src/index';
test('exposes explicit bootstrap stubs', () => {
  expect(() => init()).toThrow('not implemented');
  expect(() => destroy()).toThrow('not implemented');
});

// @vitest-environment node
import { expect, it, vi } from 'vitest';
import { createScope } from '../../src/core/scope';

it('releases resources once in reverse order and contains cleanup failures', () => {
  const error = vi.fn();
  const scope = createScope(error);
  const calls: number[] = [];
  const release = scope.add(() => {
    calls.push(1);
  });
  scope.add(() => {
    calls.push(2);
    throw new Error('cleanup');
  });
  scope.dispose();
  scope.dispose();
  release();
  scope.add(() => {
    calls.push(3);
  });
  expect(calls).toEqual([2, 1, 3]);
  expect(error).toHaveBeenCalledTimes(1);
});
it('tracks exact listeners and snapshots capture options', () => {
  const scope = createScope(vi.fn());
  const target = new EventTarget();
  const listener = vi.fn();
  const remove = vi.spyOn(target, 'removeEventListener');
  const options = { capture: false };
  const release = scope.listen(target, 'test', listener, options);
  options.capture = true;
  target.dispatchEvent(new Event('test'));
  release();
  scope.dispose();
  target.dispatchEvent(new Event('test'));
  expect(listener).toHaveBeenCalledTimes(1);
  expect(remove).toHaveBeenCalledWith('test', listener, false);
  scope.listen(target, 'test', listener);
  target.dispatchEvent(new Event('test'));
  expect(listener).toHaveBeenCalledTimes(1);
});

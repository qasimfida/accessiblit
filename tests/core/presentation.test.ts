import { expect, it, vi } from 'vitest';
import { createPresentation } from '../../src/core/presentation';
it('defers rendering, forwards nonce and cleans subscriptions once', () => {
  const bridge = createPresentation('owner'),
    cleanup = vi.fn(),
    render = vi.fn(() => cleanup);
  const release = bridge.subscribe(render);
  expect(render).not.toHaveBeenCalled();
  const root = document.createElement('div').attachShadow({ mode: 'open' });
  const detach = bridge.attach(root);
  expect(render).toHaveBeenCalledWith(root, 'owner');
  release();
  release();
  detach();
  bridge.destroy();
  expect(cleanup).toHaveBeenCalledTimes(1);
  bridge.subscribe(render);
  bridge.attach(root);
  expect(render).toHaveBeenCalledTimes(1);
});
it('isolates throwing surfaces and detaches only the current root', () => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  const bridge = createPresentation(),
    cleanup = vi.fn();
  bridge.subscribe(() => {
    throw Error('broken');
  });
  bridge.subscribe(() => cleanup);
  const first = document.createElement('div').attachShadow({ mode: 'open' });
  const second = document.createElement('div').attachShadow({ mode: 'open' });
  const detachFirst = bridge.attach(first);
  bridge.attach(second);
  detachFirst();
  expect(cleanup).toHaveBeenCalledTimes(1);
  bridge.destroy();
  expect(cleanup).toHaveBeenCalledTimes(2);
  vi.restoreAllMocks();
});

import { afterEach, expect, it, vi } from 'vitest';
import { createHost } from '../../src/core/host';
const releases: (() => void)[] = [];
afterEach(() => {
  releases.reverse().forEach((fn) => fn());
  releases.length = 0;
  vi.restoreAllMocks();
  document
    .querySelectorAll('[data-accessiblit-host]')
    .forEach((e) => e.remove());
});
function mount(
  callback: (root: ShadowRoot) => () => void = vi.fn(() => vi.fn()),
) {
  const release = createHost(document, callback);
  releases.push(release);
  return release;
}
it('appends one open-shadow host and replaces only a previously owned host', () => {
  const cleanup = vi.fn();
  const onMount = vi.fn((root) => {
    expect(root.mode).toBe('open');
    return cleanup;
  });
  const first = createHost(document, onMount);
  releases.push(first);
  expect(
    document.body.querySelectorAll('[data-accessiblit-host]'),
  ).toHaveLength(1);
  const second = mount();
  expect(cleanup).toHaveBeenCalledTimes(1);
  expect(
    document.body.querySelectorAll('[data-accessiblit-host]'),
  ).toHaveLength(1);
  first();
  second();
  second();
  expect(document.querySelector('[data-accessiblit-host]')).toBeNull();
});
it('waits for DOMContentLoaded and removes its exact listener', () => {
  const body = document.body;
  body.remove();
  const add = vi.spyOn(document, 'addEventListener');
  const remove = vi.spyOn(document, 'removeEventListener');
  const ready = vi.fn(() => vi.fn());
  const release = mount(ready);
  document.dispatchEvent(new Event('DOMContentLoaded'));
  expect(ready).not.toHaveBeenCalled();
  document.documentElement.appendChild(body);
  document.dispatchEvent(new Event('DOMContentLoaded'));
  document.dispatchEvent(new Event('DOMContentLoaded'));
  expect(ready).toHaveBeenCalledTimes(1);
  expect(remove).toHaveBeenCalledWith(
    'DOMContentLoaded',
    add.mock.calls[0]?.[1],
    false,
  );
  release();
});
it('cancels a pending mount on teardown', () => {
  const body = document.body;
  body.remove();
  const ready = vi.fn(() => vi.fn());
  const release = mount(ready);
  release();
  document.documentElement.appendChild(body);
  document.dispatchEvent(new Event('DOMContentLoaded'));
  expect(ready).not.toHaveBeenCalled();
});
it('preserves a foreign mount marker and contains mounting failures', () => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  const foreign = document.createElement('div');
  foreign.setAttribute('data-accessiblit-host', 'foreign');
  document.body.appendChild(foreign);
  mount()();
  expect(foreign.isConnected).toBe(true);
  foreign.remove();
  mount(() => {
    throw new Error('mount');
  });
  expect(document.querySelector('[data-accessiblit-host]')).toBeNull();
  vi.spyOn(HTMLElement.prototype, 'attachShadow').mockImplementation(() => {
    throw new Error('shadow');
  });
  mount();
  expect(document.querySelector('[data-accessiblit-host]')).toBeNull();
});

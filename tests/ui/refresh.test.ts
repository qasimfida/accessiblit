import { afterEach, expect, it, vi } from 'vitest';
import { init, destroy } from '../../src/index';

afterEach(() => {
  destroy();
  vi.restoreAllMocks();
});

it('coalesces setting changes and root mutations without synchronous layout reads', async () => {
  const callbacks = new Map<number, FrameRequestCallback>();
  let next = 0;
  const request = vi
    .spyOn(window, 'requestAnimationFrame')
    .mockImplementation((callback) => {
      callbacks.set(++next, callback);
      return next;
    });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
    callbacks.delete(id);
  });
  const geometry = vi
    .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
    .mockReturnValue(new DOMRect(0, 0, 48, 48));
  const instance = init({ persist: false });
  geometry.mockClear();
  instance.setFeature('lineHeight', 2);
  instance.setFeature('wordSpacing', 0.32);
  expect(request).not.toHaveBeenCalled();
  await Promise.resolve();
  expect(geometry).not.toHaveBeenCalled();
  expect(request).toHaveBeenCalledTimes(1);
  expect(instance.getState().wordSpacing).toBe(0.32);
  for (const callback of callbacks.values()) callback(0);
  callbacks.clear();
  expect(geometry).not.toHaveBeenCalled();
});

it('cancels pending placement work on destroy', async () => {
  const request = vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(37);
  const cancel = vi.spyOn(window, 'cancelAnimationFrame');
  const instance = init({ persist: false });
  instance.setFeature('lineHeight', 2);
  await Promise.resolve();
  expect(request).toHaveBeenCalled();
  const geometry = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect');
  instance.destroy();
  expect(cancel).toHaveBeenCalledWith(37);
  expect(geometry).not.toHaveBeenCalled();
  expect(document.querySelector('[data-accessiblit-host]')).toBeNull();
});

it('tolerates a temporarily absent body during owner replacement', () => {
  const instance = init({ persist: false });
  const body = document.body;
  body.remove();
  try {
    expect(() => instance.open()).not.toThrow();
  } finally {
    document.documentElement.append(body);
  }
  instance.destroy();
  expect(document.querySelector('[data-accessiblit-host]')).toBeNull();
});

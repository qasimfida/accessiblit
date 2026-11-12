import { afterEach, expect, it, vi } from 'vitest';
import { createLayer } from '../../src/ui/layer';
afterEach(() => vi.restoreAllMocks());
it('uses the native non-modal top layer and releases it exactly once', () => {
  const element = document.createElement('button');
  const show = vi.fn(),
    hide = vi.fn();
  element.showPopover = show;
  element.hidePopover = hide;
  const layer = createLayer(element);
  expect(element.getAttribute('popover')).toBe('manual');
  expect(layer.native).toBe(true);
  layer.show();
  layer.show();
  expect(show).toHaveBeenCalledTimes(1);
  expect(element.hidden).toBe(false);
  layer.hide();
  layer.hide();
  expect(hide).toHaveBeenCalledTimes(1);
  layer.show();
  layer.destroy();
  layer.show();
  expect(show).toHaveBeenCalledTimes(2);
  expect(hide).toHaveBeenCalledTimes(2);
  expect(element.hidden).toBe(true);
  expect(element.hasAttribute('popover')).toBe(false);
});
it('falls back when native support is missing or a native method fails', () => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  const missing = document.createElement('button');
  Object.defineProperty(missing, 'showPopover', { value: undefined });
  const fixed = createLayer(missing);
  fixed.show();
  expect(fixed.native).toBe(false);
  fixed.destroy();
  const element = document.createElement('section');
  element.showPopover = () => {
    throw new Error('show');
  };
  element.hidePopover = vi.fn();
  const failed = createLayer(element);
  failed.show();
  expect(failed.native).toBe(false);
  expect(element.hidden).toBe(false);
  expect(element.hasAttribute('popover')).toBe(false);
  failed.destroy();
  const other = document.createElement('section');
  other.showPopover = vi.fn();
  other.hidePopover = () => {
    throw new Error('hide');
  };
  const hiding = createLayer(other);
  hiding.show();
  hiding.destroy();
  expect(other.hidden).toBe(true);
});

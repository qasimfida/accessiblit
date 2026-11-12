import { afterEach, expect, it, vi } from 'vitest';
import { createRegistry } from '../../src/core/registry';
import { createStyles } from '../../src/core/styles';
import { createPresentation } from '../../src/core/presentation';
import { applyReadingOverlay } from '../../src/features/reading-overlay';
afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it('coalesces input, removes listeners and cancels the pending frame on off', () => {
  const callbacks = new Map<number, FrameRequestCallback>();
  let next = 0;
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn((cb: FrameRequestCallback) => {
      callbacks.set(++next, cb);
      return next;
    }),
  );
  const cancel = vi.fn((id: number) => callbacks.delete(id));
  vi.stubGlobal('cancelAnimationFrame', cancel);
  const host = document.createElement('div');
  host.setAttribute('data-accessiblit-host', '');
  document.body.append(host);
  const root = host.attachShadow({ mode: 'open' }),
    bridge = createPresentation('owner'),
    styles = createStyles(document);
  bridge.attach(root);
  const registry = createRegistry(document, styles, () => {}, bridge.subscribe);
  registry.register({
    id: 'readingMask',
    group: 'navigation',
    label: 'Mask',
    description: 'Mask',
    control: { type: 'toggle' },
    apply: (value, api) =>
      value === true ? applyReadingOverlay(api, 'mask') : () => {},
  });
  const add = vi.spyOn(document, 'addEventListener'),
    remove = vi.spyOn(document, 'removeEventListener');
  registry.enable('readingMask', true);
  for (let i = 0; i < 20; i++)
    document.body.dispatchEvent(
      new MouseEvent('pointermove', { bubbles: true, clientY: 200 }),
    );
  expect(callbacks.size).toBe(1);
  const first = [...callbacks.values()][0]!;
  callbacks.clear();
  first(0);
  expect(root.querySelectorAll('[data-accessiblit-overlay]')).toHaveLength(1);
  expect(root.querySelector('style')?.nonce).toBe('owner');
  expect(root.querySelector('style')?.textContent).toContain(
    'var(--accessiblit-reading-mask-opacity)',
  );
  expect(
    document.documentElement.style.getPropertyValue(
      '--accessiblit-reading-mask-opacity',
    ),
  ).toBe('0.04');
  document.body.dispatchEvent(
    new MouseEvent('pointermove', { bubbles: true, clientY: 250 }),
  );
  registry.disable('readingMask');
  expect(cancel).toHaveBeenCalled();
  expect(root.querySelectorAll('[data-accessiblit-overlay]')).toHaveLength(0);
  for (const type of [
    'pointerdown',
    'pointermove',
    'touchstart',
    'touchmove',
    'focusin',
    'scroll',
  ]) {
    expect(add.mock.calls.filter((c) => c[0] === type)).toHaveLength(1);
    expect(remove.mock.calls.filter((c) => c[0] === type)).toHaveLength(1);
  }
  registry.destroy();
  styles.destroy();
  bridge.destroy();
});

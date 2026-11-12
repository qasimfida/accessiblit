import { afterEach, expect, it, vi } from 'vitest';
import { createUI } from '../../src/ui/controller';
import { createState } from '../../src/core/schema';
import { resolveOptions } from '../../src/core/options';
import { panelFeatures } from '../helpers/panel-features';
import type { FeatureId } from '../../src/core/types';
const releases: (() => void)[] = [];
afterEach(() => {
  releases.reverse().forEach((fn) => fn());
  releases.length = 0;
  vi.restoreAllMocks();
});
function setup(input: Parameters<typeof resolveOptions>[0] = {}) {
  const host = document.createElement('div');
  document.body.append(host);
  const root = host.attachShadow({ mode: 'open' });
  releases.push(() => host.remove());
  let state = createState();
  const reset = vi.fn(() => {
    state = createState();
    ui.update(state);
  });
  const ui = createUI(
    root,
    panelFeatures(),
    resolveOptions(input),
    {
      getState: () => ({ ...state }),
      setFeature: (id: FeatureId, value: unknown) => {
        state[id] = value;
        ui.update(state);
      },
      reset,
    },
    'test-ui',
  );
  releases.push(ui.destroy);
  return { ui, root, host, reset };
}
it('opens non-modally, toggles, resets and returns focus on Escape', () => {
  const { ui, root, reset } = setup();
  const launcher = root.querySelector('[aria-controls]') as HTMLButtonElement;
  const panel = root.querySelector('[role=dialog]') as HTMLElement;
  expect(panel.hidden).toBe(true);
  launcher.click();
  expect(ui.isOpen).toBe(true);
  expect(launcher.getAttribute('aria-expanded')).toBe('true');
  expect(root.activeElement?.textContent).toBe('Close');
  ui.open();
  root.querySelector<HTMLButtonElement>('.accessiblit-reset')!.click();
  expect(reset).toHaveBeenCalledTimes(1);
  document.dispatchEvent(
    new KeyboardEvent('keydown', {
      code: 'Escape',
      bubbles: true,
      cancelable: true,
    }),
  );
  expect(ui.isOpen).toBe(false);
  expect(root.activeElement).toBe(launcher);
  document.dispatchEvent(
    new KeyboardEvent('keydown', {
      code: 'KeyA',
      key: 'q',
      altKey: true,
      bubbles: true,
      cancelable: true,
    }),
  );
  expect(ui.isOpen).toBe(true);
  ui.toggle();
  expect(ui.isOpen).toBe(false);
  ui.open();
  root.querySelector<HTMLButtonElement>('.accessiblit-close')!.click();
  expect(ui.isOpen).toBe(false);
  ui.destroy();
  ui.destroy();
  ui.open();
  ui.close();
  ui.toggle();
  ui.update(createState());
  expect(root.querySelector('button')).toBeNull();
});
it('respects disabled shortcuts and closes without stealing outside focus', () => {
  const { ui, root } = setup({ shortcut: false });
  document.dispatchEvent(
    new KeyboardEvent('keydown', { code: 'KeyA', altKey: true, bubbles: true }),
  );
  expect(ui.isOpen).toBe(false);
  ui.open();
  const outside = document.createElement('button');
  outside.textContent = 'Host';
  document.body.append(outside);
  releases.push(() => outside.remove());
  outside.focus();
  expect(ui.isOpen).toBe(false);
  expect(document.activeElement).toBe(outside);
  outside.blur();
  expect(root.querySelector('[aria-controls]')?.hasAttribute('hidden')).toBe(
    false,
  );
});
it('hides the launcher when a host focus target overlaps it and restores it elsewhere', () => {
  const { ui, root } = setup();
  const outside = document.createElement('button');
  document.body.append(outside);
  releases.push(() => outside.remove());
  vi.spyOn(outside, 'getBoundingClientRect').mockReturnValue({
    left: window.innerWidth - 64,
    right: window.innerWidth - 16,
    top: window.innerHeight - 64,
    bottom: window.innerHeight - 16,
  } as DOMRect);
  outside.focus();
  const launcher = root.querySelector('[aria-controls]') as HTMLElement;
  expect(launcher.hidden).toBe(true);
  vi.spyOn(outside, 'getBoundingClientRect').mockReturnValue({
    left: 0,
    right: 20,
    top: 0,
    bottom: 20,
  } as DOMRect);
  window.dispatchEvent(new Event('resize'));
  expect(launcher.hidden).toBe(false);
  ui.open();
  expect(ui.isOpen).toBe(true);
});
it('owns all UI listeners and disconnects attribute observers on destroy', () => {
  const add = vi.spyOn(EventTarget.prototype, 'addEventListener');
  const remove = vi.spyOn(EventTarget.prototype, 'removeEventListener');
  const disconnect = vi.spyOn(MutationObserver.prototype, 'disconnect');
  const { ui, root } = setup();
  ui.open();
  ui.destroy();
  expect(disconnect).toHaveBeenCalledTimes(1);
  const types = ['click', 'change', 'keydown', 'focusin', 'focusout', 'scroll'];
  const calls = add.mock.calls
    .map((args, index) => ({ args, target: add.mock.contexts[index] }))
    .filter(({ args }) => types.includes(args[0]));
  for (const { args, target } of calls)
    expect(
      remove.mock.calls.some(
        (other, index) =>
          remove.mock.contexts[index] === target &&
          other[0] === args[0] &&
          other[1] === args[1],
      ),
    ).toBe(true);
  expect(calls.length).toBeGreaterThan(10);
  expect(root.childNodes).toHaveLength(0);
});
it('rolls back a failed UI mount', () => {
  const host = document.createElement('div');
  document.body.append(host);
  releases.push(() => host.remove());
  const root = host.attachShadow({ mode: 'open' });
  vi.spyOn(root, 'append').mockImplementationOnce(() => {
    throw new Error('append');
  });
  expect(() =>
    createUI(
      root,
      [],
      resolveOptions(),
      { getState: createState, setFeature: () => {}, reset: () => {} },
      'fail',
    ),
  ).toThrow('append');
  expect(root.childNodes).toHaveLength(0);
});

it('rejects a detached document without creating browser resources', () => {
  const doc = document.implementation.createHTMLDocument('detached');
  const root = doc.createElement('div').attachShadow({ mode: 'open' });
  expect(() =>
    createUI(
      root,
      [],
      resolveOptions(),
      { getState: createState, setFeature: () => {}, reset: () => {} },
      'detached',
    ),
  ).toThrow('UI needs a browser Window');
  expect(root.childNodes).toHaveLength(0);
});

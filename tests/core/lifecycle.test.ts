import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLifecycle } from '../../src/core/lifecycle';
import * as announcerModule from '../../src/core/announcer';
import { testFeatures } from '../helpers/features';
import type { Feature, FeatureId } from '../../src/core/types';
const engines: ReturnType<typeof createLifecycle>[] = [];
let sequence = 0;
const engine = (features = testFeatures()) => {
  const e = createLifecycle(features);
  engines.push(e);
  return e;
};
beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  engines.forEach((e) => e.destroy());
  engines.length = 0;
  vi.restoreAllMocks();
  vi.useRealTimers();
  document.documentElement.removeAttribute('style');
  document.documentElement.removeAttribute('class');
});
const attrs = () =>
  [...document.documentElement.attributes].map((a) => [a.name, a.value]);

describe('runtime lifecycle', () => {
  it('restores DOM, head, root attributes and every owned listener exactly', () => {
    vi.useFakeTimers();
    const schedule = vi.spyOn(globalThis, 'setTimeout');
    const cancel = vi.spyOn(globalThis, 'clearTimeout');
    const ownedTimers: ReturnType<typeof setTimeout>[] = [];
    const originalAnnouncer = announcerModule.createAnnouncer;
    vi.spyOn(announcerModule, 'createAnnouncer').mockImplementation(
      (...args) => {
        const announcer = originalAnnouncer(...args);
        return {
          ...announcer,
          announce(message) {
            const before = schedule.mock.results.length;
            announcer.announce(message);
            for (const result of schedule.mock.results.slice(before)) {
              if (result.type === 'return') ownedTimers.push(result.value);
            }
          },
        };
      },
    );
    document.documentElement.setAttribute('class', ' host  existing ');
    document.documentElement.setAttribute(
      'style',
      'color:red; --accessiblit-test-size:99 !important;',
    );
    const before = {
      head: document.head.outerHTML,
      body: document.body.outerHTML,
      attrs: attrs(),
    };
    const addDoc = vi.spyOn(document, 'addEventListener');
    const removeDoc = vi.spyOn(document, 'removeEventListener');
    const addWindow = vi.spyOn(window, 'addEventListener');
    const removeWindow = vi.spyOn(window, 'removeEventListener');
    const e = engine();
    const a = e.init({
      storageKey: `life:${++sequence}`,
      nonce: 'owner-nonce',
    });
    a.setFeature('fontSize', 130);
    a.setFeature('darkMode', true);
    document.dispatchEvent(new Event('accessiblit-test-event'));
    a.destroy();
    a.destroy();
    expect({
      head: document.head.outerHTML,
      body: document.body.outerHTML,
      attrs: attrs(),
    }).toEqual(before);
    // Assert owned handles, excluding platform jobs scheduled internally by jsdom.
    expect(ownedTimers).toHaveLength(2);
    for (const timer of ownedTimers) expect(cancel).toHaveBeenCalledWith(timer);
    let ownedCount = 0;
    for (const [add, remove] of [
      [addDoc, removeDoc],
      [addWindow, removeWindow],
    ]) {
      for (const args of add!.mock.calls) {
        if (!['storage', 'accessiblit-test-event'].includes(args[0])) continue;
        ownedCount++;
        expect(
          remove!.mock.calls.filter(
            (call) =>
              call[0] === args[0] && call[1] === args[1] && call[2] === false,
          ),
        ).toHaveLength(1);
      }
    }
    expect(ownedCount).toBe(2);
    const snapshot = a.getState();
    a.setFeature('fontSize', 150);
    a.reset();
    expect(a.getState()).toEqual(snapshot);
  });
  it('survives double init and StrictMode mount/teardown/mount without stale destruction', () => {
    const e = engine();
    const a = e.init({ persist: false });
    a.setFeature('darkMode', true);
    const b = e.init({ persist: false });
    a.destroy();
    expect(document.querySelectorAll('[data-accessiblit-host]')).toHaveLength(
      1,
    );
    expect(b.getState().darkMode).toBe(false);
    b.destroy();
    const c = e.init({ persist: false });
    c.setFeature('fontSize', 140);
    expect(
      document.documentElement.style.getPropertyValue(
        '--accessiblit-test-size',
      ),
    ).toBe('140');
    expect(document.querySelectorAll('[data-accessiblit-host]')).toHaveLength(
      1,
    );
    e.destroy();
    e.destroy();
  });
  it('applies restored settings before DOMContentLoaded and cancels deferred mounts', () => {
    vi.useFakeTimers();
    const storageKey = `early:${++sequence}`;
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({ version: 1, state: { fontSize: 160, darkMode: true } }),
    );
    const body = document.body;
    body.remove();
    const add = vi.spyOn(document, 'addEventListener');
    const remove = vi.spyOn(document, 'removeEventListener');
    const e = engine();
    const a = e.init({ storageKey });
    expect(
      document.documentElement.classList.contains('accessiblit-test-dark'),
    ).toBe(true);
    expect(
      document.documentElement.style.getPropertyValue(
        '--accessiblit-test-size',
      ),
    ).toBe('160');
    expect(document.querySelector('[data-accessiblit-host]')).toBeNull();
    document.documentElement.appendChild(body);
    document.dispatchEvent(new Event('DOMContentLoaded'));
    vi.runAllTimers();
    const host = document.querySelector('[data-accessiblit-host]')!;
    expect(host.shadowRoot?.querySelector('[role=status]')?.textContent).toBe(
      'Test dark mode enabled',
    );
    document.dispatchEvent(new Event('accessiblit-test-event'));
    vi.runAllTimers();
    expect(host.shadowRoot?.querySelector('[role=status]')?.textContent).toBe(
      'Test event received',
    );
    const waiting = add.mock.calls.find(
      (call) => call[0] === 'DOMContentLoaded',
    );
    expect(remove).toHaveBeenCalledWith(
      'DOMContentLoaded',
      waiting?.[1],
      false,
    );
    a.destroy();
    body.remove();
    const b = e.init({ persist: false });
    b.destroy();
    document.documentElement.appendChild(body);
    document.dispatchEvent(new Event('DOMContentLoaded'));
    expect(document.querySelector('[data-accessiblit-host]')).toBeNull();
  });
  it('honours allowlist/exclusions and sends only id/value to the hook', () => {
    const onChange = vi.fn();
    const a = engine().init({
      persist: false,
      features: ['fontSize', 'darkMode'],
      exclude: ['darkMode'],
      onChange,
    });
    expect(onChange).not.toHaveBeenCalled();
    a.setFeature('fontSize', 120);
    a.setFeature('darkMode', true);
    a.setFeature('unknown' as FeatureId, true);
    expect(a.getState().darkMode).toBe(false);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0]).toEqual([{ id: 'fontSize', value: 120 }]);
  });
  it('isolates throwing effects and rolls back a failed initialization', () => {
    const [font, dark] = testFeatures() as [Feature, Feature];
    font.apply = () => {
      throw new Error('feature');
    };
    const a = engine([font, dark]).init({ persist: false });
    a.setFeature('fontSize', 120);
    a.setFeature('darkMode', true);
    expect(
      document.documentElement.classList.contains('accessiblit-test-dark'),
    ).toBe(true);
    expect(console.warn).toHaveBeenCalledTimes(1);
    a.destroy();
    vi.spyOn(window, 'addEventListener').mockImplementation(() => {
      throw new Error('listener');
    });
    const b = engine().init();
    expect(b.getState().fontSize).toBe(100);
    expect(document.querySelector('[data-accessiblit-host]')).toBeNull();
    b.setFeature('fontSize', 140);
    b.reset();
    b.destroy();
  });
  it('continues safely when a host cannot attach a shadow tree', () => {
    vi.spyOn(HTMLElement.prototype, 'attachShadow').mockImplementation(() => {
      throw new Error('blocked');
    });
    const a = engine().init({ persist: false });
    a.setFeature('fontSize', 140);
    expect(a.getState().fontSize).toBe(140);
    a.destroy();
    expect(document.documentElement.hasAttribute('class')).toBe(false);
  });
  it('handles initialization reentered from a feature apply', () => {
    const [font] = testFeatures() as [Feature];
    let entered = false;
    const e = engine([font]);
    font.apply = () => {
      if (!entered) {
        entered = true;
        e.init({ persist: false });
      }
      return () => {};
    };
    const old = e.init({ persist: false });
    old.destroy();
    expect(document.querySelectorAll('[data-accessiblit-host]')).toHaveLength(
      1,
    );
    e.destroy();
  });
});

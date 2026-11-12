import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createStore } from '../../src/core/store';
import { createStorage } from '../../src/core/storage';
import type { ChangeEvent, FeatureId } from '../../src/core/types';
let sequence = 0;
const live: ReturnType<typeof createStore>[] = [];
function setup(persist = true, onChange?: (e: ChangeEvent) => void) {
  const storageKey = `store:${++sequence}`;
  const storage = createStorage(window, storageKey, persist);
  const store = createStore(window, storage, { storageKey, persist, onChange });
  live.push(store);
  return { store, storageKey };
}
beforeEach(() => vi.spyOn(console, 'warn').mockImplementation(() => {}));
afterEach(() => {
  live.forEach((s) => s.destroy());
  live.length = 0;
  vi.restoreAllMocks();
});

describe('store', () => {
  it('copies snapshots, skips unchanged settings, persists and resets atomically', () => {
    const change = vi.fn();
    const { store } = setup(true, change);
    const subscriber = vi.fn();
    const off = store.subscribe(subscriber);
    const set = vi.spyOn(Storage.prototype, 'setItem');
    const snapshot = store.getState();
    snapshot.fontSize = 190;
    expect(store.getState().fontSize).toBe(100);
    store.setFeature('fontSize', 100);
    expect(change).not.toHaveBeenCalled();
    store.setFeature('fontSize', 120);
    expect(subscriber).toHaveBeenCalledWith({ id: 'fontSize', value: 120 });
    expect(change.mock.calls[0]?.[0]).toEqual({ id: 'fontSize', value: 120 });
    store.setFeature('darkMode', true);
    store.reset();
    expect(set).toHaveBeenCalledTimes(3);
    expect(store.getState()).toMatchObject({ fontSize: 100, darkMode: false });
    off();
    store.setFeature('fontSize', 130);
    expect(subscriber).toHaveBeenCalledTimes(4);
    store.setFeature('__proto__' as FeatureId, true);
    store.setFeature('fontSize', 105);
    expect(store.getState().fontSize).toBe(130);
  });
  it('queues reentrant hooks, isolates failures and permits unsubscribe during notification', () => {
    const events: ChangeEvent[] = [];
    const hook = vi.fn((e) => {
      events.push(e);
      if (e.value === 120) store.setFeature('fontSize', 130);
      else throw new Error('hook');
    });
    const { store } = setup(false, hook);
    const off = store.subscribe(() => {
      off();
      offLater();
    });
    const later = vi.fn();
    const offLater = store.subscribe(later);
    store.subscribe(() => {
      throw new Error('subscriber');
    });
    const healthy = vi.fn();
    store.subscribe(healthy);
    store.setFeature('fontSize', 120);
    expect(events.map((e) => e.value)).toEqual([120, 130]);
    expect(later).not.toHaveBeenCalled();
    expect(healthy).toHaveBeenCalledTimes(2);
    store.setFeature('fontSize', 140);
    expect(console.warn).toHaveBeenCalledTimes(2);
  });
  it('syncs valid localStorage changes and clear events without echo writes', () => {
    const { store, storageKey } = setup();
    const set = vi.spyOn(Storage.prototype, 'setItem');
    const hook = vi.fn();
    store.subscribe(hook);
    const event = (
      key: string | null,
      newValue: string | null,
      storageArea: Storage | null = null,
    ) =>
      window.dispatchEvent(
        new StorageEvent('storage', { key, newValue, storageArea }),
      );
    const encoded = JSON.stringify({ version: 1, state: { fontSize: 160 } });
    event('different', encoded);
    event(storageKey, encoded, window.sessionStorage);
    event(storageKey, '{');
    expect(store.getState().fontSize).toBe(100);
    event(storageKey, encoded, window.localStorage);
    expect(store.getState().fontSize).toBe(160);
    event(storageKey, null);
    expect(store.getState().fontSize).toBe(100);
    event(storageKey, encoded);
    event(null, null);
    expect(store.getState().fontSize).toBe(100);
    expect(set).not.toHaveBeenCalled();
    expect(hook).toHaveBeenCalledTimes(4);
  });
  it('does not listen when persistence is disabled and becomes inert after destroy', () => {
    const add = vi.spyOn(window, 'addEventListener');
    const { store } = setup(false);
    expect(add).not.toHaveBeenCalled();
    const first = vi.fn(() => store.destroy());
    const skipped = vi.fn();
    store.subscribe(first);
    store.subscribe(skipped);
    store.setFeature('darkMode', true);
    expect(skipped).not.toHaveBeenCalled();
    const late = vi.fn();
    store.subscribe(late);
    store.setFeature('fontSize', 150);
    store.reset();
    store.destroy();
    expect(late).not.toHaveBeenCalled();
    expect(store.getState()).toMatchObject({ fontSize: 100, darkMode: true });
  });
  it('removes its exact storage listener on teardown', () => {
    const add = vi.spyOn(window, 'addEventListener');
    const remove = vi.spyOn(window, 'removeEventListener');
    const { store, storageKey } = setup();
    store.destroy();
    store.destroy();
    expect(add).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledWith(
      'storage',
      add.mock.calls[0]?.[1],
      false,
    );
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: storageKey,
        newValue: JSON.stringify({ version: 1, state: { darkMode: true } }),
      }),
    );
    expect(store.getState().darkMode).toBe(false);
  });
});

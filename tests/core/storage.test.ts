import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createState } from '../../src/core/schema';
import {
  createStorage,
  decodeState,
  MAX_STORAGE_CHARS,
} from '../../src/core/storage';
let key = 0;
beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());
const storage = () => createStorage(window, `test:${++key}`, true);
const encode = (state: unknown, version = 1) =>
  JSON.stringify({ version, state });

describe('storage schema', () => {
  it('accepts versioned partial settings and clears with null', () => {
    expect(
      decodeState(encode({ fontSize: 120, darkMode: true })),
    ).toMatchObject({ fontSize: 120, darkMode: true });
    expect(decodeState(null)).toEqual(createState());
  });
  it.each([
    '{',
    'null',
    '[]',
    '1',
    '{}',
    encode({}, 0),
    encode({}, 2),
    encode([]),
    encode({ fontSize: 121 }),
    encode({ darkMode: {} }),
    encode({ unknown: true }),
    '{"version":1,"state":{"__proto__":{"polluted":true}}}',
    '{"version":1,"state":{"constructor":true}}',
    '{"version":1,"state":{"prototype":true}}',
    '{"version":1,"state":{},"extra":true}',
  ])('rejects invalid data %s', (raw) => {
    expect(decodeState(raw)).toBeUndefined();
    expect(Object.prototype).not.toHaveProperty('polluted');
  });
  it('bounds data before JSON parsing', () => {
    expect(decodeState(' '.repeat(MAX_STORAGE_CHARS + 1))).toBeUndefined();
  });
});
describe('storage adapter', () => {
  it('only reads/writes its single key', () => {
    const get = vi.spyOn(Storage.prototype, 'getItem');
    const set = vi.spyOn(Storage.prototype, 'setItem');
    const adapter = storage();
    expect(adapter.read()).toEqual(createState());
    adapter.write(createState({ fontSize: 120 }));
    expect(adapter.read().fontSize).toBe(120);
    expect(set).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledTimes(2);
    expect(
      get.mock.calls.every(([used]) => used === set.mock.calls[0]?.[0]),
    ).toBe(true);
    expect(set.mock.calls[0]?.[1].length).toBeLessThan(MAX_STORAGE_CHARS);
    expect(adapter.matches(window.localStorage)).toBe(true);
    expect(adapter.matches(window.sessionStorage)).toBe(false);
    expect(adapter.matches(null)).toBe(true);
  });
  it('falls back on blocked getters and retains settings across reinitialization', () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new Error('blocked');
    });
    const name = `blocked:${++key}`;
    const adapter = createStorage(window, name, true);
    expect(adapter.read()).toEqual(createState());
    adapter.write(createState({ darkMode: true }));
    expect(adapter.read().darkMode).toBe(true);
    expect(createStorage(window, name, true).read().darkMode).toBe(true);
    expect(adapter.matches({} as Storage)).toBe(false);
  });
  it('handles getItem and quota errors and keeps the latest in memory', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('read');
    });
    const a = storage();
    expect(a.read()).toEqual(createState());
    a.write(createState({ fontSize: 130 }));
    expect(a.read().fontSize).toBe(130);
    vi.restoreAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError');
    });
    const b = storage();
    b.write(createState({ fontSize: 140 }));
    expect(b.read().fontSize).toBe(140);
  });
  it('does not touch persistent storage when disabled', () => {
    const get = vi.spyOn(window, 'localStorage', 'get');
    const a = createStorage(window, 'private', false);
    a.read();
    a.write(createState({ darkMode: true }));
    expect(a.read().darkMode).toBe(true);
    expect(get).not.toHaveBeenCalled();
    expect(createStorage(window, 'private', false).read().darkMode).toBe(false);
  });
  it('ignores bad disk data and accepts only valid external events', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('{');
    const a = storage();
    expect(a.read()).toEqual(createState());
    expect(a.accept('{')).toBeUndefined();
    expect(a.accept(encode({ fontSize: 150 }))?.fontSize).toBe(150);
    expect(a.accept(null)).toEqual(createState());
  });
});

it('rejects oversized disk data and keeps a clean bounded fallback when storage later blocks', () => {
  const get = vi
    .spyOn(Storage.prototype, 'getItem')
    .mockReturnValue('x'.repeat(MAX_STORAGE_CHARS + 1));
  const adapter = storage();
  expect(adapter.read()).toEqual(createState());
  get.mockImplementation(() => {
    throw new Error('blocked');
  });
  expect(adapter.read()).toEqual(createState());
  adapter.write(createState({ fontSize: 170 }));
  expect(adapter.read().fontSize).toBe(170);
});

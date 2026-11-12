// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveOptions } from '../../src/core/options';
import { createReporter } from '../../src/core/diagnostics';

afterEach(() => vi.restoreAllMocks());
describe('options', () => {
  it('resolves independent defaults and copies user collections', () => {
    const a = resolveOptions();
    const b = resolveOptions();
    expect(a).toMatchObject({
      position: 'bottom-right',
      storageKey: 'accessiblit:v1',
      persist: true,
      shortcut: 'Alt+A',
      zIndex: 2147483000,
    });
    expect(a.features).toHaveLength(18);
    expect(a.features).not.toBe(b.features);
    const features = ['fontSize', 'fontSize', 'darkMode'] as const;
    const callback = vi.fn();
    const result = resolveOptions({
      position: 'top-left',
      features: [...features],
      exclude: ['darkMode'],
      offset: { x: 0, y: 50 },
      shortcut: 'Control+Shift+Alt+X',
      nonce: 'owner-nonce',
      dyslexiaFontUrl: '/owner.woff2',
      onChange: callback,
      persist: false,
      zIndex: 0,
      storageKey: 'owner',
      messages: {
        close: 'Dismiss',
        featureLabels: { fontSize: 'Text size' },
        featureDescriptions: { fontSize: 'Scale text' },
      },
    });
    expect(result.features).toEqual(['fontSize']);
    expect(result.messages.close).toBe('Dismiss');
    expect(result.messages.featureLabels?.fontSize).toBe('Text size');
    expect(result.onChange).toBe(callback);
    expect(
      resolveOptions({ shortcut: false, exclude: undefined }).shortcut,
    ).toBe(false);
    expect(
      resolveOptions({ dyslexiaFontUrl: 'https://example.com/font.woff2' })
        .dyslexiaFontUrl,
    ).toBeDefined();
  });
  it.each([null, [], 1, 'bad', new Date()])(
    'defaults invalid option objects %s',
    (input) => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(resolveOptions(input).features).toHaveLength(18);
      expect(warn).toHaveBeenCalledTimes(1);
    },
  );
  it('rejects bad values and pollution without losing valid settings', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const invalid = {
      position: 'middle',
      features: ['unknown'],
      exclude: 1,
      storageKey: '',
      persist: 'yes',
      shortcut: 'A',
      zIndex: Infinity,
      offset: { x: -1, y: 'bad' },
      nonce: 4,
      dyslexiaFontUrl: 'javascript:alert(1)',
      onChange: 1,
      unknown: true,
    };
    expect(resolveOptions(invalid)).toEqual(resolveOptions());
    expect(warn).toHaveBeenCalledTimes(Object.keys(invalid).length);
    expect(
      resolveOptions(
        JSON.parse('{"__proto__":{"polluted":true},"persist":false}'),
      ).persist,
    ).toBe(false);
    expect(Object.prototype).not.toHaveProperty('polluted');
    for (const offset of [
      null,
      { x: 0, y: Infinity },
      { x: 10001, y: 0 },
      { x: 0, y: -1 },
      { x: 0, y: 10001 },
    ])
      expect(resolveOptions({ offset }).offset).toEqual({ x: 16, y: 16 });
    for (const zIndex of [-1, 1.5, 2147483648])
      expect(resolveOptions({ zIndex }).zIndex).toBe(2147483000);
    expect(resolveOptions({ nonce: ' '.repeat(300) }).nonce).toBeUndefined();
    expect(
      resolveOptions({ dyslexiaFontUrl: '/bad font' }).dyslexiaFontUrl,
    ).toBeUndefined();
  });
  it('validates partial messages deeply', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const defaults = resolveOptions().messages;
    expect(resolveOptions({ messages: [] }).messages).toEqual(defaults);
    expect(
      resolveOptions({
        messages: {
          close: '',
          missing: 'x',
          featureLabels: 5,
          featureDescriptions: { fontSize: 0, unknown: 'x' },
        },
      }).messages,
    ).toEqual(defaults);
    expect(
      resolveOptions({ messages: { featureDescriptions: null } }).messages,
    ).toEqual(defaults);
  });
  it('contains hostile getters, proxies and broken console implementations', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {
      throw new Error('console');
    });
    expect(() =>
      resolveOptions({
        get persist() {
          throw new Error('getter');
        },
      }),
    ).not.toThrow();
    expect(() =>
      resolveOptions(
        new Proxy(
          {},
          {
            getPrototypeOf() {
              throw new Error('proxy');
            },
          },
        ),
      ),
    ).not.toThrow();
    const report = createReporter();
    report('once', 'Failure');
    report('once', 'Failure');
  });
});

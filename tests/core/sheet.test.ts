import { afterEach, expect, it, vi } from 'vitest';
import { createSheet } from '../../src/core/sheet';
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete (document as unknown as Record<string, unknown>).adoptedStyleSheets;
  document
    .querySelectorAll('[data-accessiblit-style]')
    .forEach((e) => e.remove());
});
it('uses one nonce-capable fallback style, updates it and removes it', () => {
  const sheet = createSheet(document, 'test-nonce');
  sheet.set('html {color: red}');
  sheet.set('html {color: blue}');
  const elements = document.head.querySelectorAll(
    'style[data-accessiblit-style]',
  );
  expect(elements).toHaveLength(1);
  expect(elements[0]?.getAttribute('nonce')).toBe('test-nonce');
  expect(elements[0]?.textContent).toContain('blue');
  sheet.clear();
  expect(document.querySelector('[data-accessiblit-style]')).toBeNull();
  sheet.set('html {color: green}');
  expect(document.querySelector('style')?.getAttribute('nonce')).toBe(
    'test-nonce',
  );
  sheet.destroy();
  sheet.destroy();
  sheet.set('ignored');
  expect(document.querySelector('[data-accessiblit-style]')).toBeNull();
});
it('supports shadow roots and detached documents without a Window', () => {
  const root = document.createElement('div').attachShadow({ mode: 'open' });
  const shadow = createSheet(root);
  shadow.set(':host{}');
  expect(root.querySelector('style')?.hasAttribute('nonce')).toBe(false);
  shadow.destroy();
  const doc = document.implementation.createHTMLDocument('detached');
  doc.head.remove();
  const detached = createSheet(doc);
  detached.set('html{}');
  expect(doc.documentElement.querySelector('style')).not.toBeNull();
  detached.destroy();
  createSheet(document).destroy();
});
function constructed() {
  const foreign = {} as CSSStyleSheet;
  class FakeSheet {
    replaceSync(css: string) {
      void css;
    }
  }
  vi.spyOn(FakeSheet.prototype, 'replaceSync');
  vi.stubGlobal('CSSStyleSheet', FakeSheet);
  Object.defineProperty(document, 'adoptedStyleSheets', {
    configurable: true,
    writable: true,
    value: [foreign],
  });
  return { foreign, FakeSheet };
}
it('adopts once and preserves sheets added by the host', () => {
  const { foreign, FakeSheet } = constructed();
  const sheet = createSheet(document);
  sheet.set('a{}');
  sheet.set('b{}');
  expect(document.adoptedStyleSheets).toHaveLength(2);
  const owned = document.adoptedStyleSheets[1] as unknown as InstanceType<
    typeof FakeSheet
  >;
  expect(owned).toBeInstanceOf(FakeSheet);
  expect(owned.replaceSync).toHaveBeenLastCalledWith('b{}');
  const later = {} as CSSStyleSheet;
  document.adoptedStyleSheets.push(later);
  sheet.clear();
  expect(document.adoptedStyleSheets).toEqual([foreign, later]);
  sheet.set('c{}');
  expect(document.adoptedStyleSheets).toHaveLength(3);
  sheet.destroy();
  expect(document.adoptedStyleSheets).toEqual([foreign, later]);
});
it('falls back if adoption or replacement fails', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const { foreign } = constructed();
  Object.defineProperty(document, 'adoptedStyleSheets', {
    configurable: true,
    get: () => [foreign],
    set: () => {
      throw new Error('blocked');
    },
  });
  const first = createSheet(document);
  first.set('a{}');
  expect(document.querySelector('style')).not.toBeNull();
  first.destroy();
  Object.defineProperty(document, 'adoptedStyleSheets', {
    configurable: true,
    writable: true,
    value: [],
  });
  const next = createSheet(document);
  next.set('a{}');
  const owned = document.adoptedStyleSheets[0]!;
  vi.spyOn(owned, 'replaceSync').mockImplementation(() => {
    throw new Error('replace');
  });
  next.set('b{}');
  expect(document.adoptedStyleSheets).toEqual([]);
  next.destroy();
  expect(warn).toHaveBeenCalled();
});
it('contains host failures during removal', () => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  constructed();
  const sheet = createSheet(document);
  sheet.set('a{}');
  Object.defineProperty(document, 'adoptedStyleSheets', {
    configurable: true,
    get: () => [],
    set: () => {
      throw new Error('host');
    },
  });
  expect(() => sheet.destroy()).not.toThrow();
});

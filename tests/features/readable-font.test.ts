import { afterEach, expect, it, vi } from 'vitest';
import { createReadableFont } from '../../src/features/readable-font';
import { featureEngine } from '../helpers/feature-engine';
const cleanups: (() => void)[] = [];
const originalFonts = Object.getOwnPropertyDescriptor(document, 'fonts');
afterEach(() => {
  cleanups.forEach((fn) => fn());
  cleanups.length = 0;
  document.body.replaceChildren();
  if (originalFonts) Object.defineProperty(document, 'fonts', originalFonts);
  else delete (document as unknown as Record<string, unknown>).fonts;
  vi.restoreAllMocks();
});
it('uses system stacks, excludes code and restores exact page markup', () => {
  const p = document.createElement('p');
  p.textContent = 'Copy';
  const code = document.createElement('code');
  code.textContent = 'code';
  p.append(code);
  document.body.append(p);
  const before = document.documentElement.outerHTML,
    engine = featureEngine(createReadableFont());
  cleanups.push(engine.destroy);
  for (const mode of ['readable', 'dyslexia-friendly']) {
    engine.set(mode);
    expect(p.hasAttribute('data-accessiblit-readable-font')).toBe(true);
    expect(code.hasAttribute('data-accessiblit-readable-font')).toBe(false);
    expect(
      document.documentElement.style.getPropertyValue(
        '--accessiblit-readable-family',
      ),
    ).toContain('system-ui');
    engine.set('off');
    expect(document.documentElement.outerHTML).toBe(before);
  }
});
it('waits for all owner faces to be loaded without calling a loader', () => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  const faces = [
    { family: '"AccessiblitDyslexia"', status: 'loaded' },
    { family: 'accessiblitdyslexia', status: 'unloaded' },
  ];
  const fonts = Object.assign(new EventTarget(), {
    load: vi.fn(),
    [Symbol.iterator]: () => faces[Symbol.iterator](),
  });
  Object.defineProperty(document, 'fonts', {
    configurable: true,
    value: fonts,
  });
  const engine = featureEngine(
    createReadableFont('https://owner.example/font.woff2'),
  );
  cleanups.push(engine.destroy);
  engine.set('dyslexia-friendly');
  expect(
    document.documentElement.style.getPropertyValue(
      '--accessiblit-readable-family',
    ),
  ).not.toContain('AccessiblitDyslexia');
  faces[1]!.status = 'loaded';
  fonts.dispatchEvent(new Event('loadingdone'));
  expect(
    document.documentElement.style.getPropertyValue(
      '--accessiblit-readable-family',
    ),
  ).toContain('AccessiblitDyslexia');
  expect(fonts.load).not.toHaveBeenCalled();
  engine.set('off');
  fonts.dispatchEvent(new Event('loadingdone'));
  expect(document.documentElement.hasAttribute('style')).toBe(false);
});
it('falls back if font APIs are blocked', () => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  Object.defineProperty(document, 'fonts', {
    configurable: true,
    get() {
      throw new Error('blocked');
    },
  });
  const engine = featureEngine(
    createReadableFont('https://owner.example/font.woff2'),
  );
  cleanups.push(engine.destroy);
  expect(() => engine.set('dyslexia-friendly')).not.toThrow();
  expect(
    document.documentElement.style.getPropertyValue(
      '--accessiblit-readable-family',
    ),
  ).toContain('ui-rounded');
});

import { afterEach, expect, it, vi } from 'vitest';
import { createRegistry } from '../../src/core/registry';
import { createStyles } from '../../src/core/styles';
import { applySaturation } from '../../src/features/saturation';
import type { Feature } from '../../src/core/types';
afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});
it('restores paints, owner filters, detached markers and all root metadata', async () => {
  const p = document.createElement('p');
  p.textContent = 'Coloured text';
  p.style.color = 'rgb(255, 0, 0)';
  const img = document.createElement('img');
  img.style.filter = 'brightness(0.8)';
  document.body.append(p, img);
  const before = document.documentElement.outerHTML;
  const styles = createStyles(document),
    registry = createRegistry(document, styles, () => {});
  const feature: Feature = {
    id: 'monochrome',
    group: 'colour',
    label: 'Test',
    description: 'Test',
    control: { type: 'toggle' },
    apply: (_v, api) => applySaturation(api, 'monochrome'),
  };
  registry.register(feature);
  registry.enable('monochrome', true);
  expect(p.hasAttribute('data-accessiblit-monochrome-paint')).toBe(true);
  expect(img.style.filter).toBe('brightness(0.8)');
  p.remove();
  await Promise.resolve();
  await Promise.resolve();
  expect(p.hasAttribute('data-accessiblit-monochrome-paint')).toBe(false);
  document.body.prepend(p);
  await Promise.resolve();
  await Promise.resolve();
  registry.destroy();
  styles.destroy();
  expect(document.documentElement.outerHTML).toBe(before);
});

it('removes resize, stylesheet and system-colour listeners exactly once', () => {
  const forced = new EventTarget();
  vi.stubGlobal('matchMedia', () => forced);
  const winAdd = vi.spyOn(window, 'addEventListener'),
    winRemove = vi.spyOn(window, 'removeEventListener');
  const docAdd = vi.spyOn(document, 'addEventListener'),
    docRemove = vi.spyOn(document, 'removeEventListener');
  const forcedAdd = vi.spyOn(forced, 'addEventListener'),
    forcedRemove = vi.spyOn(forced, 'removeEventListener');
  const styles = createStyles(document),
    registry = createRegistry(document, styles, () => {});
  registry.register({
    id: 'lowSaturation',
    group: 'colour',
    label: 'Low',
    description: 'Low',
    control: { type: 'toggle' },
    apply: (_value, api) => applySaturation(api, 'low-saturation'),
  });
  registry.enable('lowSaturation', true);
  forced.dispatchEvent(new Event('change'));
  registry.destroy();
  styles.destroy();
  registry.destroy();
  for (const [add, remove, type] of [
    [winAdd, winRemove, 'resize'],
    [docAdd, docRemove, 'load'],
    [forcedAdd, forcedRemove, 'change'],
  ] as const) {
    expect(add.mock.calls.filter((args) => args[0] === type)).toHaveLength(1);
    expect(remove.mock.calls.filter((args) => args[0] === type)).toHaveLength(
      1,
    );
  }
  vi.unstubAllGlobals();
});
it('does not re-emit a URL-bearing owner filter', () => {
  const image = document.createElement('img');
  image.style.filter = 'url("#owner-filter")';
  document.body.append(image);
  const styles = createStyles(document),
    registry = createRegistry(document, styles, () => {});
  registry.register({
    id: 'monochrome',
    group: 'colour',
    label: 'Mono',
    description: 'Mono',
    control: { type: 'toggle' },
    apply: (_value, api) => applySaturation(api, 'monochrome'),
  });
  registry.enable('monochrome', true);
  expect(image.hasAttribute('data-accessiblit-monochrome-paint')).toBe(false);
  registry.destroy();
  styles.destroy();
});

it('does not filter layout fallback while supporting video source metadata', () => {
  const object = document.createElement('object');
  object.append(document.createElement('aside'));
  const video = document.createElement('video');
  video.append(document.createElement('source'));
  document.body.append(object, video);
  const styles = createStyles(document),
    registry = createRegistry(document, styles, () => {});
  registry.register({
    id: 'monochrome',
    group: 'colour',
    label: 'Mono',
    description: 'Mono',
    control: { type: 'toggle' },
    apply: (_value, api) => applySaturation(api, 'monochrome'),
  });
  registry.enable('monochrome', true);
  expect(object.hasAttribute('data-accessiblit-monochrome-paint')).toBe(false);
  expect(video.hasAttribute('data-accessiblit-monochrome-paint')).toBe(true);
  registry.destroy();
  styles.destroy();
});

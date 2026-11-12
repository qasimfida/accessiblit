import { afterEach, expect, it } from 'vitest';
import { createRegistry } from '../../src/core/registry';
import { createStyles } from '../../src/core/styles';
import { applySaturation } from '../../src/features/saturation';
import type { Feature } from '../../src/core/types';
afterEach(() => document.body.replaceChildren());
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

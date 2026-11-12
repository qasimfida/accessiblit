import { expect, it } from 'vitest';
import { createSurfaceRule } from '../../src/core/surface-styles';
it('shares one nonce-capable sheet and releases owners independently', () => {
  const root = document.createElement('div').attachShadow({ mode: 'open' });
  const a = createSurfaceRule(root, 'owner'),
    b = createSurfaceRule(root, 'owner');
  a.set('.a{display:block}');
  b.set('.b{display:none}');
  expect(root.querySelectorAll('style')).toHaveLength(1);
  expect(root.querySelector('style')?.nonce).toBe('owner');
  a.destroy();
  a.destroy();
  expect(root.querySelector('style')?.textContent).not.toContain('.a');
  b.destroy();
  expect(root.childNodes).toHaveLength(0);
  b.set('.late{}');
  expect(root.childNodes).toHaveLength(0);
});

import { afterEach, expect, it, vi } from 'vitest';
import { createLifecycle } from '../../src/core/lifecycle';

afterEach(() => vi.restoreAllMocks());
it('protects a focused host SVG as well as HTML controls', () => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('tabindex', '0');
  document.body.append(svg);
  vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue({
    left: window.innerWidth - 64,
    right: window.innerWidth - 16,
    top: window.innerHeight - 64,
    bottom: window.innerHeight - 16,
  } as DOMRect);
  const instance = createLifecycle().init({ persist: false });
  try {
    svg.focus();
    expect(document.activeElement).toBe(svg);
    const root = document.querySelector('[data-accessiblit-host]')!.shadowRoot!;
    expect(root.querySelector('[aria-controls]')?.hasAttribute('hidden')).toBe(
      true,
    );
    instance.open();
    expect(root.querySelector('[aria-controls]')?.hasAttribute('hidden')).toBe(
      false,
    );
  } finally {
    instance.destroy();
    svg.remove();
  }
});

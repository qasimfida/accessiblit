import { expect, it, vi } from 'vitest';
import { createLauncher } from '../../src/ui/launcher';
import { resolveOptions } from '../../src/core/options';
it('exposes a native named button, decorative SVG and accurate panel relationship', () => {
  const toggle = vi.fn();
  const launcher = createLauncher(
    document,
    resolveOptions().messages,
    'panel-id',
    toggle,
  );
  document.body.append(launcher.element);
  expect(launcher.element.tagName).toBe('BUTTON');
  expect(launcher.element.type).toBe('button');
  expect(launcher.element.getAttribute('aria-label')).toBe(
    'Open accessibility options',
  );
  expect(launcher.element.getAttribute('aria-controls')).toBe('panel-id');
  expect(launcher.element.getAttribute('aria-expanded')).toBe('false');
  expect(
    launcher.element.querySelector('svg')?.getAttribute('aria-hidden'),
  ).toBe('true');
  expect(launcher.element.querySelector('svg')?.getAttribute('focusable')).toBe(
    'false',
  );
  expect(launcher.element.querySelector('svg')?.namespaceURI).toBe(
    'http://www.w3.org/2000/svg',
  );
  launcher.element.click();
  expect(toggle).toHaveBeenCalledTimes(1);
  launcher.update(true);
  expect(launcher.element.getAttribute('aria-expanded')).toBe('true');
  launcher.update(false);
  launcher.destroy();
  launcher.element.click();
  launcher.update(true);
  expect(toggle).toHaveBeenCalledTimes(1);
  expect(launcher.element.isConnected).toBe(false);
  expect(launcher.element.getAttribute('aria-expanded')).toBe('false');
});

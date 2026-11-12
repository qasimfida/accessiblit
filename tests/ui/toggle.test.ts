import { expect, it, vi } from 'vitest';
import { createToggle } from '../../src/ui/toggle';
import { resolveOptions } from '../../src/core/options';
import { testFeatures } from '../helpers/features';
import type { Feature } from '../../src/core/types';

it('keeps its visible label stable, updates pressed state and releases clicks on destroy', () => {
  const feature = testFeatures()[1] as Feature;
  let value = false;
  const setValue = vi.fn((next) => {
    value = next;
    control.update(next);
  });
  const control = createToggle({
    document,
    feature,
    messages: resolveOptions().messages,
    prefix: 'toggle',
    getValue: () => value,
    setValue,
  });
  document.body.append(control.element);
  const button = control.element.querySelector('button')!;
  expect(button.type).toBe('button');
  expect(button.getAttribute('aria-pressed')).toBe('false');
  expect(button.textContent).toBe('Test dark modeOff');
  expect(button.getAttribute('aria-labelledby')).toBe(
    control.element.querySelector('h4')?.id,
  );
  expect(button.getAttribute('aria-describedby')).toBe(
    control.element.querySelector('p')?.id,
  );
  button.click();
  expect(setValue).toHaveBeenCalledWith(true);
  expect(button.getAttribute('aria-pressed')).toBe('true');
  expect(button.textContent).toBe('Test dark modeOn');
  button.click();
  expect(button.getAttribute('aria-pressed')).toBe('false');
  control.update(true);
  control.destroy();
  control.destroy();
  button.click();
  control.update(false);
  expect(setValue).toHaveBeenCalledTimes(2);
  expect(button.getAttribute('aria-pressed')).toBe('true');
  expect(control.element.isConnected).toBe(false);
});

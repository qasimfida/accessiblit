import { expect, it, vi } from 'vitest';
import { createRadios } from '../../src/ui/radios';
import { resolveOptions } from '../../src/core/options';
import { testFeatures } from '../helpers/features';
import type { Feature } from '../../src/core/types';
const feature = {
  ...testFeatures()[0],
  id: 'textAlign',
  label: 'Text alignment',
  control: {
    type: 'select',
    values: ['off', 'left', 'center', 'right'],
    labels: ['Off', 'Left', 'Center', 'Right'],
  },
} as Feature;
it('names a native group and keeps the original option value type in changes', () => {
  let value: unknown = 'off';
  const setValue = vi.fn((next) => {
    value = next;
    control.update(next);
  });
  const control = createRadios({
    document,
    feature,
    messages: resolveOptions().messages,
    prefix: 'radio',
    getValue: () => value,
    setValue,
  });
  document.body.append(control.element);
  const group = control.element.querySelector('[role=radiogroup]')!;
  expect(group.getAttribute('aria-labelledby')).toBe(
    control.element.querySelector('h4')?.id,
  );
  expect(group.getAttribute('aria-describedby')).toBe(
    control.element.querySelector('p')?.id,
  );
  const inputs = [...control.element.querySelectorAll('input')];
  expect(inputs[0]?.checked).toBe(true);
  expect(inputs.map((e) => e.parentElement?.textContent)).toEqual([
    'Off',
    'Left',
    'Center',
    'Right',
  ]);
  inputs[1]!.click();
  expect(value).toBe('left');
  expect(inputs[1]?.checked).toBe(true);
  expect(inputs[0]?.checked).toBe(false);
  inputs[0]!.dispatchEvent(new Event('change'));
  expect(setValue).toHaveBeenCalledTimes(1);
  control.update('right');
  expect(inputs[3]?.checked).toBe(true);
  control.destroy();
  inputs[2]!.click();
  control.update('off');
  expect(setValue).toHaveBeenCalledTimes(1);
  expect(control.element.isConnected).toBe(false);
  const numeric = {
    ...feature,
    id: 'lineHeight',
    control: { type: 'select', values: [0, 1.5] },
  } as Feature;
  const set = vi.fn();
  const numbers = createRadios({
    document,
    feature: numeric,
    messages: resolveOptions().messages,
    prefix: 'number',
    getValue: () => 0,
    setValue: set,
  });
  document.body.append(numbers.element);
  numbers.element.querySelectorAll('input')[1]!.click();
  expect(set).toHaveBeenCalledWith(1.5);
  numbers.destroy();
});
it('rejects empty, duplicate or unusable option lists', () => {
  const base = {
    document,
    feature,
    messages: resolveOptions().messages,
    prefix: 'bad',
    getValue: () => 0,
    setValue: () => {},
  };
  for (const control of [
    { type: 'toggle' },
    { type: 'select', values: [] },
    { type: 'select', values: [0, 0] },
    { type: 'select', values: [Infinity] },
    { type: 'select', values: null },
  ])
    expect(() =>
      createRadios({ ...base, feature: { ...feature, control } as Feature }),
    ).toThrow('Invalid option metadata');
});

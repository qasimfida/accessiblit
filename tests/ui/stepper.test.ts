import { expect, it, vi } from 'vitest';
import { createStepper } from '../../src/ui/stepper';
import { resolveOptions } from '../../src/core/options';
import { testFeatures } from '../helpers/features';
import type { Feature } from '../../src/core/types';
const feature = {
  ...testFeatures()[0],
  control: { type: 'range', min: 80, max: 200, step: 10, unit: 'percent' },
} as Feature;
it('exposes visible values, clamps steps and preserves nodes/focus at limits', () => {
  let current: unknown = 100;
  const setValue = vi.fn((next) => {
    current = next;
    control.update(next);
  });
  const control = createStepper({
    document,
    feature,
    messages: resolveOptions().messages,
    prefix: 'step',
    getValue: () => current,
    setValue,
  });
  document.body.append(control.element);
  const [minus, plus] = [...control.element.querySelectorAll('button')];
  expect(minus?.getAttribute('aria-label')).toBe('Decrease Test font size');
  expect(plus?.getAttribute('aria-label')).toBe('Increase Test font size');
  expect(control.element.querySelector('.accessiblit-value')?.textContent).toBe(
    '100 percent',
  );
  plus!.focus();
  plus!.click();
  expect(current).toBe(110);
  expect(document.activeElement).toBe(plus);
  minus!.click();
  expect(current).toBe(100);
  current = 200;
  control.update(current);
  plus!.click();
  expect(plus?.getAttribute('aria-disabled')).toBe('true');
  expect(plus?.disabled).toBe(false);
  expect(current).toBe(200);
  current = 80;
  control.update(current);
  minus!.click();
  expect(minus?.getAttribute('aria-disabled')).toBe('true');
  expect(current).toBe(80);
  current = 'bad';
  control.update(current);
  expect(control.element.querySelector('.accessiblit-value')?.textContent).toBe(
    '80 percent',
  );
  plus!.click();
  expect(current).toBe(90);
  const count = setValue.mock.calls.length;
  control.destroy();
  plus!.click();
  control.update(200);
  expect(setValue).toHaveBeenCalledTimes(count);
  expect(control.element.isConnected).toBe(false);
});
it('rejects unusable range metadata instead of creating an unbounded control', () => {
  const context = {
    document,
    feature,
    messages: resolveOptions().messages,
    prefix: 'bad',
    getValue: () => 100,
    setValue: () => {},
  };
  for (const control of [
    { type: 'toggle' },
    { type: 'range', min: 1, max: 0, step: 1 },
    { type: 'range', min: 0, max: 1, step: 0 },
    { type: 'range', min: 0, max: Infinity, step: 1 },
  ])
    expect(() =>
      createStepper({
        ...context,
        feature: { ...feature, control } as Feature,
      }),
    ).toThrow('Invalid range metadata');
});

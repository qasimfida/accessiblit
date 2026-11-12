import { expect, it } from 'vitest';
import { resolveOptions } from '../../src/core/options';
import {
  changeText,
  controlShell,
  featureText,
  makeButton,
  valueText,
} from '../../src/ui/presentation';
import { testFeatures } from '../helpers/features';
import type { Feature } from '../../src/core/types';

it('uses feature metadata and explicit translation overrides for all value kinds', () => {
  const [font, dark] = testFeatures() as [Feature, Feature];
  const messages = resolveOptions().messages;
  expect(featureText(font, messages)).toEqual({
    label: 'Test font size',
    description: 'Test scale',
  });
  expect(valueText(font, 120, messages)).toBe('120');
  const percent = {
    ...font,
    control: { type: 'range', min: 80, max: 200, step: 10, unit: 'percent' },
  } as Feature;
  expect(changeText(percent, 120, messages)).toBe('Test font size 120 percent');
  expect(valueText(dark, true, messages)).toBe('On');
  expect(valueText(dark, false, messages)).toBe('Off');
  const radio = {
    ...font,
    control: {
      type: 'select',
      values: [0, 1.5],
      labels: ['Off', 'Comfortable'],
    },
  } as Feature;
  expect(valueText(radio, 0, messages)).toBe('Off');
  expect(valueText(radio, 1.5, messages)).toBe('Comfortable');
  expect(valueText(radio, 2, messages)).toBe('2');
  const translated = resolveOptions({
    messages: {
      featureLabels: { fontSize: 'Text size' },
      featureDescriptions: { fontSize: 'Scale text' },
    },
  }).messages;
  expect(featureText(font, translated)).toEqual({
    label: 'Text size',
    description: 'Scale text',
  });
});
it('creates labelled descriptions and safely renders markup as plain text', () => {
  const [font] = testFeatures() as [Feature];
  const shell = controlShell({
    document,
    feature: font,
    messages: resolveOptions().messages,
    prefix: 'test',
    getValue: () => 100,
    setValue: () => {},
  });
  document.body.append(shell.element);
  expect(shell.element.querySelector('h4')?.id).toBe(shell.labelId);
  expect(shell.element.querySelector('p')?.id).toBe(shell.descriptionId);
  const button = makeButton(document, '<img src=x>');
  expect(button.type).toBe('button');
  expect(button.querySelector('img')).toBeNull();
  expect(button.textContent).toBe('<img src=x>');
  shell.scope.dispose();
  expect(shell.element.isConnected).toBe(false);
});

import type { Feature } from '../core/types';
import { cssEffect } from './effect';
import { paletteRules } from './colour-rules';
/** A higher-priority palette avoids activation-order-dependent contrast or media inversion. */
export const highContrast: Feature = {
  id: 'highContrast',
  group: 'colour',
  label: 'High contrast',
  description: 'Use black surfaces, white text and yellow links.',
  control: { type: 'toggle' },
  apply(value, api) {
    return value === true
      ? cssEffect(
          api,
          'accessiblit-high-contrast',
          {
            '--accessiblit-contrast-ink': '#fff',
            '--accessiblit-contrast-bg': '#000',
            '--accessiblit-contrast-link': '#ffff00',
          },
          paletteRules('contrast'),
        )
      : () => {};
  },
};

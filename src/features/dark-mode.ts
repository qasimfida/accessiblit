import type { Feature } from '../core/types';
import { cssEffect } from './effect';
import { paletteRules } from './colour-rules';
/** An opaque palette makes HTML text predictable without filtering media or layout ancestors. */
export const darkMode: Feature = {
  id: 'darkMode',
  group: 'colour',
  label: 'Dark mode',
  description: 'Use dark surfaces and light text; preserve media colours.',
  control: { type: 'toggle' },
  apply(value, api) {
    return value === true
      ? cssEffect(
          api,
          'accessiblit-dark-mode',
          {
            '--accessiblit-dark-ink': '#fff',
            '--accessiblit-dark-bg': '#121212',
            '--accessiblit-dark-link': '#b3dbff',
          },
          paletteRules('dark'),
        )
      : () => {};
  },
};

import type { Feature } from '../core/types';
import { isFeatureValue } from '../core/schema';
import { ROOT_SELECTOR, CONTENT_SELECTOR } from './dom';
import { cssEffect } from './effect';
/** Relative units keep the selected spacing proportional to each text element's own font. */
export const wordSpacing: Feature = {
  id: 'wordSpacing',
  group: 'content',
  label: 'Word spacing',
  description: 'Add space between words.',
  control: {
    type: 'select',
    values: [0, 0.16, 0.24, 0.32],
    labels: ['Off', '0.16em', '0.24em', '0.32em'],
  },
  apply(value, api) {
    if (
      typeof value !== 'number' ||
      !isFeatureValue('wordSpacing', value) ||
      value === 0
    )
      return () => {};
    return cssEffect(
      api,
      'accessiblit-word-spacing',
      { '--accessiblit-word-spacing': String(value) + 'em' },
      `${ROOT_SELECTOR}.accessiblit-word-spacing ${CONTENT_SELECTOR}{word-spacing:var(--accessiblit-word-spacing)!important}`,
    );
  },
};

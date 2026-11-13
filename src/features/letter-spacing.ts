import type { Feature } from '../core/types';
import { isFeatureValue } from '../core/schema';
import { ROOT_SELECTOR, CONTENT_SELECTOR, TEXT_BLOCKS } from './dom';
import { cssEffect } from './effect';
/** Relative units keep the selected spacing proportional to each text element's own font. */
export const letterSpacing: Feature = {
  id: 'letterSpacing',
  group: 'content',
  label: 'Letter spacing',
  description: 'Add space between letters.',
  control: {
    type: 'select',
    values: [0, 0.12, 0.16, 0.2],
    labels: ['Off', '0.12em', '0.16em', '0.2em'],
  },
  apply(value, api) {
    if (
      typeof value !== 'number' ||
      !isFeatureValue('letterSpacing', value) ||
      value === 0
    )
      return () => {};
    // Expanded tokens need emergency wrapping inside semantic text blocks.
    return cssEffect(
      api,
      'accessiblit-letter-spacing',
      { '--accessiblit-letter-spacing': String(value) + 'em' },
      `${ROOT_SELECTOR}.accessiblit-letter-spacing ${CONTENT_SELECTOR}{letter-spacing:var(--accessiblit-letter-spacing)!important}
${ROOT_SELECTOR}.accessiblit-letter-spacing ${CONTENT_SELECTOR}:is(${TEXT_BLOCKS}){overflow-wrap:anywhere!important}`,
    );
  },
};

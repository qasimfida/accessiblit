import type { Feature } from '../core/types';
import { isFeatureValue } from '../core/schema';
import { ROOT_SELECTOR, CONTENT_SELECTOR } from './dom';
import { cssEffect } from './effect';
/** Relative units keep the selected spacing proportional to each text element's own font. */
export const lineHeight: Feature = {
  id: 'lineHeight',
  group: 'content',
  label: 'Line height',
  description: 'Set line spacing and paragraph gaps.',
  control: {
    type: 'select',
    values: [0, 1.5, 1.75, 2],
    labels: ['Off', '1.5', '1.75', '2'],
  },
  apply(value, api) {
    if (
      typeof value !== 'number' ||
      !isFeatureValue('lineHeight', value) ||
      value === 0
    )
      return () => {};
    return cssEffect(
      api,
      'accessiblit-line-height',
      { '--accessiblit-line-height': String(value) + '' },
      `${ROOT_SELECTOR}.accessiblit-line-height ${CONTENT_SELECTOR}{line-height:var(--accessiblit-line-height)!important}
${ROOT_SELECTOR}.accessiblit-line-height ${CONTENT_SELECTOR}:where(p){margin-block-end:2em!important}`,
    );
  },
};

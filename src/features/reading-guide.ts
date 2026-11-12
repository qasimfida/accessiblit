import type { Feature } from '../core/types';
import { applyReadingOverlay } from './reading-overlay';
/** A private, click-through reading surface follows pointer, touch and keyboard focus. */
export const readingGuide: Feature = {
  id: 'readingGuide',
  group: 'navigation',
  label: 'Reading guide',
  description: 'Follow the mouse, touch point or keyboard focus.',
  control: { type: 'toggle' },
  apply: (value, api) =>
    value === true ? applyReadingOverlay(api, 'guide') : () => {},
};

import type { Feature } from '../core/types';
import { applyReadingOverlay } from './reading-overlay';
/** A low-luminance-change strip preserves page interaction and operating-system colours. */
export const readingMask: Feature = {
  id: 'readingMask',
  group: 'navigation',
  label: 'Reading mask',
  description: 'Gently dim outside the pointer or keyboard-focus strip.',
  control: { type: 'toggle' },
  apply: (value, api) =>
    value === true ? applyReadingOverlay(api, 'mask') : () => {},
};

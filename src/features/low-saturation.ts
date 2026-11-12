import type { Feature } from '../core/types';
import { applySaturation } from './saturation';
/** Reduced saturation yields to monochrome and preserves the selected palette's lightness. */
export const lowSaturation: Feature = {
  id: 'lowSaturation',
  group: 'colour',
  label: 'Low saturation',
  description: 'Reduce colour intensity; monochrome takes priority.',
  control: { type: 'toggle' },
  apply: (value, api) =>
    value === true ? applySaturation(api, 'low-saturation') : () => {},
};

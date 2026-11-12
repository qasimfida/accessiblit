import type { Feature } from '../core/types';
import { applySaturation } from './saturation';
/** One saturation owner takes priority over reduced saturation without multiplying filters. */
export const monochrome: Feature = {
  id: 'monochrome',
  group: 'colour',
  label: 'Monochrome',
  description: 'Remove colour from text, backgrounds and supported media.',
  control: { type: 'toggle' },
  apply: (value, api) =>
    value === true ? applySaturation(api, 'monochrome') : () => {},
};

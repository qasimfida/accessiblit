import type { Feature } from '../core/types';
import { isFeatureValue } from '../core/schema';
import { ROOT_SELECTOR } from './dom';
import { cssEffect } from './effect';
/** CSS zoom preserves fixed/sticky viewport anchors and composes with the owner's existing zoom. */
export const contentScale: Feature = {
  id: 'contentScale',
  group: 'content',
  label: 'Content scale',
  description: 'Scale the whole page layout.',
  control: { type: 'range', min: 100, max: 200, step: 10, unit: 'percent' },
  apply(value, api) {
    if (
      typeof value !== 'number' ||
      !isFeatureValue('contentScale', value) ||
      value === 100
    )
      return () => {};
    const raw =
      api.document.defaultView
        ?.getComputedStyle(api.document.documentElement)
        .getPropertyValue('zoom') ?? '1';
    const parsed = parseFloat(raw) / (raw.endsWith('%') ? 100 : 1),
      baseline = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
    return cssEffect(
      api,
      'accessiblit-content-scale',
      { '--accessiblit-content-scale': String((baseline * value) / 100) },
      `${ROOT_SELECTOR}.accessiblit-content-scale{zoom:var(--accessiblit-content-scale)!important}`,
    );
  },
};

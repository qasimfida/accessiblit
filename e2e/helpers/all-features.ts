import type { FeatureId } from '../../src/core/types';
/** Maximum settings exercise interactions rather than treating toggles as independent demonstrations. */
export const ALL_FEATURES: Record<FeatureId, unknown> = {
  fontSize: 200,
  lineHeight: 2,
  letterSpacing: 0.2,
  wordSpacing: 0.32,
  textAlign: 'right',
  contentScale: 200,
  readableFont: 'dyslexia-friendly',
  darkMode: true,
  highContrast: true,
  monochrome: true,
  lowSaturation: true,
  readingGuide: true,
  readingMask: true,
  highlightLinks: true,
  highlightHeadings: true,
  bigCursor: 2,
  stopAnimations: true,
  focusHighlight: true,
};

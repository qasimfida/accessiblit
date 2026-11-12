import type { AccessiblitOptions, AccessiblitInstance } from './core/types';

export type {
  FeatureId,
  Feature,
  FeatureApi,
  FeatureControl,
  AccessiblitOptions,
  AccessiblitInstance,
  ChangeEvent,
  Messages,
} from './core/types';

/** Phase 0 reserves the contract; browser behaviour arrives in later phases. */
export function init(options?: AccessiblitOptions): AccessiblitInstance {
  void options;
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {
      open: destroy,
      close: destroy,
      toggle: destroy,
      reset: destroy,
      getState: () => ({
        fontSize: undefined,
        lineHeight: undefined,
        letterSpacing: undefined,
        wordSpacing: undefined,
        textAlign: undefined,
        contentScale: undefined,
        readableFont: undefined,
        darkMode: undefined,
        highContrast: undefined,
        monochrome: undefined,
        lowSaturation: undefined,
        readingGuide: undefined,
        readingMask: undefined,
        highlightLinks: undefined,
        highlightHeadings: undefined,
        bigCursor: undefined,
        stopAnimations: undefined,
        focusHighlight: undefined,
      }),
      setFeature: destroy,
      destroy,
    };
  }
  throw new Error('not implemented');
}

/** Safe before initialization so host teardown does not depend on mount order. */
export function destroy(): void {
  // Phase 0 creates no resources to release.
}

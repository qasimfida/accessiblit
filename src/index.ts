/** Stable identifiers let integrations select features without relying on labels. */
export type FeatureId =
  | 'fontSize'
  | 'lineHeight'
  | 'letterSpacing'
  | 'wordSpacing'
  | 'textAlign'
  | 'contentScale'
  | 'readableFont'
  | 'darkMode'
  | 'highContrast'
  | 'monochrome'
  | 'lowSaturation'
  | 'readingGuide'
  | 'readingMask'
  | 'highlightLinks'
  | 'highlightHeadings'
  | 'bigCursor'
  | 'stopAnimations'
  | 'focusHighlight';

/** Keeps interface copy replaceable without coupling it to a translation service. */
export interface Messages {
  launcher: string;
  panelTitle: string;
  close: string;
  reset: string;
  contentGroup: string;
  colourGroup: string;
  navigationGroup: string;
  featureLabels: Record<FeatureId, string>;
  featureDescriptions: Record<FeatureId, string>;
  changeAnnouncement: string;
}

/** Contains feature settings only; host or visitor identity is never included. */
export interface ChangeEvent {
  id: FeatureId;
  value: unknown;
  state: Record<FeatureId, unknown>;
}

/** Allows host configuration without requiring any runtime dependencies. */
export interface AccessiblitOptions {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  features?: FeatureId[];
  exclude?: FeatureId[];
  storageKey?: string;
  persist?: boolean;
  shortcut?: string | false;
  zIndex?: number;
  offset?: { x: number; y: number };
  nonce?: string;
  messages?: Partial<Messages>;
  dyslexiaFontUrl?: string;
  onChange?: (e: ChangeEvent) => void;
}

/** An explicit lifecycle makes cleanup possible in framework integrations. */
export interface AccessiblitInstance {
  open(): void;
  close(): void;
  toggle(): void;
  reset(): void;
  getState(): Record<FeatureId, unknown>;
  setFeature(id: FeatureId, value: unknown): void;
  destroy(): void;
}

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

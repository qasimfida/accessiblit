/** Identifies each personalisation preference in the public API. */
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
/** Limits hook payloads to the changed preference. */
export interface ChangeEvent {
  id: FeatureId;
  value: unknown;
}
/** Provides translatable widget copy without coupling clients to rendering. */
export interface Messages {
  launcher: string;
  panelTitle: string;
  close: string;
  reset: string;
  groups: Record<'content' | 'colour' | 'navigation', string>;
  features: Record<FeatureId, string>;
  changed: string;
}
/** Configures a widget without requiring framework-specific integration. */
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
/** Keeps lifecycle and preference operations independent of the UI framework. */
export interface AccessiblitInstance {
  open(): void;
  close(): void;
  toggle(): void;
  reset(): void;
  getState(): Record<FeatureId, unknown>;
  setFeature(id: FeatureId, value: unknown): void;
  destroy(): void;
}
/** Bootstrap placeholder; runtime implementation is scheduled for Phase 1. */
export function init(options?: AccessiblitOptions): AccessiblitInstance {
  void options;
  throw new Error('not implemented');
}
/** Bootstrap placeholder; runtime implementation is scheduled for Phase 1. */
export function destroy(): void {
  throw new Error('not implemented');
}

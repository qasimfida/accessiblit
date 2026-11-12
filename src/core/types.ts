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
  featureLabels: Partial<Record<FeatureId, string>>;
  featureDescriptions: Partial<Record<FeatureId, string>>;
  changeAnnouncement: string;
  panelDescription: string;
  increase: string;
  decrease: string;
  on: string;
  off: string;
  emptyGroup: string;
  /** Explains why persisted colour choices defer to operating-system colours. */
  forcedColoursNote?: string;
  resetAnnouncement: string;
}

/** Contains feature settings only; host or visitor identity is never included. */
export interface ChangeEvent {
  id: FeatureId;
  value: unknown;
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

/** Shared teardown contracts let the runtime release resources even after failure. */
export type Cleanup = () => void;

/** Limits page mutations to resources the runtime can restore. */
export interface PageStyles {
  addRule(css: string): Cleanup;
  addClass(name: string): Cleanup;
  setVariable(name: string, value: string): Cleanup;
}

/** Feature resources are scoped so a partial, throwing apply can be rolled back. */
export interface FeatureApi {
  readonly document: Document;
  readonly styles: PageStyles;
  announce(message: string): void;
  listen(
    target: EventTarget,
    type: string,
    listener: EventListener,
    options?: AddEventListenerOptions,
  ): Cleanup;
  onCleanup(cleanup: Cleanup): void;
}

/** Declarative controls keep future UI generation independent of feature code. */
export type FeatureControl =
  | { type: 'toggle' }
  | {
      type: 'select';
      values: readonly (string | number)[];
      labels?: readonly string[];
    }
  | { type: 'range'; min: number; max: number; step: number; unit?: string };

/** A feature owns one reversible effect; the registry isolates its failures. */
export interface Feature {
  readonly id: FeatureId;
  readonly group: 'content' | 'colour' | 'navigation';
  readonly label: string;
  readonly description: string;
  readonly control: FeatureControl;
  apply(value: unknown, api: FeatureApi): Cleanup;
}

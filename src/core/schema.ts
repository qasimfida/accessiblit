import type { FeatureId } from './types';

/** A fixed catalogue prevents untrusted keys from entering runtime state. */
export const DEFAULT_STATE = {
  fontSize: 100,
  lineHeight: 0,
  letterSpacing: 0,
  wordSpacing: 0,
  textAlign: 'off',
  contentScale: 100,
  readableFont: 'off',
  darkMode: false,
  highContrast: false,
  monochrome: false,
  lowSaturation: false,
  readingGuide: false,
  readingMask: false,
  highlightLinks: false,
  highlightHeadings: false,
  bigCursor: false,
  stopAnimations: false,
  focusHighlight: false,
} satisfies Record<FeatureId, unknown>;

/** Iteration always uses trusted ids, never keys supplied by persisted JSON. */
export const FEATURE_IDS = Object.freeze(
  Object.keys(DEFAULT_STATE) as FeatureId[],
);

const levels: Partial<Record<FeatureId, readonly unknown[]>> = {
  lineHeight: [0, 1.5, 1.75, 2],
  letterSpacing: [0, 0.12, 0.16, 0.2],
  wordSpacing: [0, 0.16, 0.24, 0.32],
  textAlign: ['off', 'left', 'center', 'right'],
  readableFont: ['off', 'readable', 'dyslexia-friendly'],
};

/** Used at every external boundary to reject inherited or unknown feature ids. */
export function isFeatureId(value: unknown): value is FeatureId {
  return typeof value === 'string' && FEATURE_IDS.includes(value as FeatureId);
}

/** Limits persisted values to the actual feature domains, not arbitrary objects. */
export function isFeatureValue(id: FeatureId, value: unknown): boolean {
  if (id === 'fontSize' || id === 'contentScale') {
    return (
      typeof value === 'number' &&
      Number.isFinite(value) &&
      value >= (id === 'fontSize' ? 80 : 100) &&
      value <= 200 &&
      value % 10 === 0
    );
  }
  const allowed = levels[id];
  return allowed ? allowed.includes(value) : typeof value === 'boolean';
}

/** Defensive copies prevent consumers from silently changing the store. */
export function createState(
  partial: Partial<Record<FeatureId, unknown>> = {},
): Record<FeatureId, unknown> {
  const state: Record<FeatureId, unknown> = { ...DEFAULT_STATE };
  for (const id of FEATURE_IDS) {
    if (Object.prototype.hasOwnProperty.call(partial, id)) {
      if (isFeatureValue(id, partial[id])) state[id] = partial[id];
    }
  }
  return state;
}

/** Rejects arrays and objects with surprising prototypes at schema boundaries. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    (Object.getPrototypeOf(value) === Object.prototype ||
      Object.getPrototypeOf(value) === null)
  );
}

import { createReporter } from './diagnostics';
import { FEATURE_IDS, isFeatureId, isRecord } from './schema';
import type { AccessiblitOptions, Messages } from './types';

/** Concrete defaults remove optional-value branches from the runtime. */
export type ResolvedOptions = Required<
  Omit<
    AccessiblitOptions,
    'nonce' | 'dyslexiaFontUrl' | 'onChange' | 'messages'
  >
> &
  Pick<AccessiblitOptions, 'nonce' | 'dyslexiaFontUrl' | 'onChange'> & {
    messages: Messages;
  };

function messages(): Messages {
  return {
    launcher: 'Open accessibility options',
    panelTitle: 'Accessibility options',
    close: 'Close',
    reset: 'Reset all',
    contentGroup: 'Content',
    colourGroup: 'Colour and contrast',
    navigationGroup: 'Navigation and orientation',
    featureLabels: {},
    featureDescriptions: {},
    changeAnnouncement: 'Settings updated',
    panelDescription: 'Choose settings for this page.',
    increase: 'Increase',
    decrease: 'Decrease',
    on: 'On',
    off: 'Off',
    emptyGroup: 'No options available in this group.',
    resetAnnouncement: 'All options reset.',
  };
}
const shortText = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0 && value.length <= 256;
const finite = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);
const ids = (value: unknown) =>
  Array.isArray(value) && [...value].every(isFeatureId);
const validators: Record<string, (value: unknown) => boolean> = {
  position: (value) =>
    ['bottom-right', 'bottom-left', 'top-right', 'top-left'].includes(
      value as string,
    ),
  features: ids,
  exclude: ids,
  storageKey: shortText,
  persist: (value) => typeof value === 'boolean',
  shortcut: (value) => {
    if (value === false) return true;
    if (typeof value !== 'string') return false;
    const parts = value.split('+');
    const key = parts.pop()!;
    return (
      /^[A-Za-z0-9]$/.test(key) &&
      parts.length > 0 &&
      parts.every((part) =>
        ['Alt', 'Control', 'Meta', 'Shift'].includes(part),
      ) &&
      parts.some((part) => part !== 'Shift') &&
      new Set(parts).size === parts.length
    );
  },
  zIndex: (value) =>
    finite(value) &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 2147483647,
  offset: (value) =>
    isRecord(value) &&
    finite(value.x) &&
    finite(value.y) &&
    value.x >= 0 &&
    value.y >= 0 &&
    value.x <= 10000 &&
    value.y <= 10000,
  nonce: shortText,
  dyslexiaFontUrl: (value) => {
    if (!shortText(value)) return false;
    // Reserving this option never causes a request; only safe owner-supplied URLs are accepted.
    return (
      /^(?:https?:\/\/|\/(?!\/)|\.\.?\/)/i.test(value) &&
      !/[\s"'<>]/.test(value)
    );
  },
  onChange: (value) => typeof value === 'function',
};

/** Invalid JavaScript inputs fall back with clear warnings instead of host errors. */
export function resolveOptions(input: unknown = {}): ResolvedOptions {
  const warn = createReporter();
  const defaults: ResolvedOptions = {
    position: 'bottom-right',
    features: [...FEATURE_IDS],
    exclude: [],
    storageKey: 'accessiblit:v1',
    persist: true,
    shortcut: 'Alt+A',
    zIndex: 2147483000,
    offset: { x: 16, y: 16 },
    messages: messages(),
  };
  try {
    if (!isRecord(input)) {
      warn('options', 'Options must be a plain object; using defaults.');
      return defaults;
    }
    const resolved = { ...defaults } as ResolvedOptions &
      Record<string, unknown>;
    for (const key of Object.keys(input)) {
      const value = input[key];
      if (value === undefined) continue;
      if (key === 'messages') {
        if (!isRecord(value)) {
          warn(key, 'Invalid messages option; using English defaults.');
          continue;
        }
        const copy = messages();
        for (const name of Object.keys(value)) {
          if (!Object.prototype.hasOwnProperty.call(copy, name)) {
            warn(`messages.${name}`, 'Unknown message key ignored.');
            continue;
          }
          const text = value[name];
          if (name === 'featureLabels' || name === 'featureDescriptions') {
            if (!isRecord(text)) {
              warn(name, 'Invalid feature messages; using English defaults.');
              continue;
            }
            for (const id of Object.keys(text)) {
              if (isFeatureId(id) && shortText(text[id]))
                copy[name][id] = text[id];
              else
                warn(
                  `messages.${name}.${id}`,
                  'Invalid feature message ignored.',
                );
            }
          } else if (shortText(text)) {
            Reflect.set(copy, name, text);
          } else warn(name, 'Invalid message text; using English default.');
        }
        resolved.messages = copy;
      } else if (
        Object.prototype.hasOwnProperty.call(validators, key) &&
        validators[key]!(value)
      ) {
        resolved[key] = value;
      } else warn(key, `Invalid or unknown option "${key}"; using default.`);
    }
    resolved.features = [...new Set(resolved.features)].filter(
      (id) => !resolved.exclude.includes(id),
    );
    resolved.exclude = [...new Set(resolved.exclude)];
    resolved.offset = { ...resolved.offset };
    return resolved;
  } catch {
    warn('options', 'Options could not be read safely; using defaults.');
    return defaults;
  }
}

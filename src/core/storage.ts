import { createReporter } from './diagnostics';
import { createState, isFeatureId, isFeatureValue, isRecord } from './schema';
import type { FeatureId } from './types';

type State = Record<FeatureId, unknown>;
type Memory = { raw: string | null; dirty: boolean };
const memory = new WeakMap<Window, Map<string, Memory>>();
/** Bound reads before parsing; accepted serialized settings contain ASCII primitives only. */
export const MAX_STORAGE_CHARS = 4096;

/** Unknown versions/keys and structured values are rejected rather than merged. */
export function decodeState(raw: string | null): State | undefined {
  if (raw === null) return createState();
  if (raw.length > MAX_STORAGE_CHARS) return undefined;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      !isRecord(parsed) ||
      parsed.version !== 1 ||
      Object.keys(parsed).length !== 2 ||
      !isRecord(parsed.state)
    )
      return undefined;
    for (const [id, value] of Object.entries(parsed.state)) {
      if (!isFeatureId(id) || !isFeatureValue(id, value)) return undefined;
    }
    return createState(parsed.state);
  } catch {
    return undefined;
  }
}

/** Storage is optional; blocked access never prevents settings during this session. */
export function createStorage(view: Window, key: string, persist: boolean) {
  const report = createReporter();
  let cache: Memory = { raw: null, dirty: false };
  if (persist) {
    let keys = memory.get(view);
    if (!keys) {
      keys = new Map();
      memory.set(view, keys);
    }
    const previous = keys.get(key);
    if (previous) cache = previous;
    else keys.set(key, cache);
  }
  let blocked = false;
  const fail = () => {
    blocked = true;
    report('storage', 'Storage is unavailable; settings remain in memory.');
  };
  return {
    read(): State {
      if (persist && !blocked && !cache.dirty) {
        try {
          cache.raw = view.localStorage.getItem(key);
        } catch {
          fail();
        }
      }
      return decodeState(cache.raw) ?? createState();
    },
    write(state: State): void {
      cache.raw = JSON.stringify({ version: 1, state: createState(state) });
      cache.dirty = persist;
      if (persist && !blocked) {
        try {
          view.localStorage.setItem(key, cache.raw);
          cache.dirty = false;
        } catch {
          fail();
        }
      }
    },
    accept(raw: string | null): State | undefined {
      const state = decodeState(raw);
      if (state) {
        cache.raw = raw;
        cache.dirty = false;
      }
      return state;
    },
    matches(area: Storage | null): boolean {
      if (area === null) return true;
      try {
        return area === view.localStorage;
      } catch {
        return false;
      }
    },
  };
}

/** The adapter type is derived so implementations cannot drift from callers. */
export type StorageAdapter = ReturnType<typeof createStorage>;

import { createReporter } from './diagnostics';
import {
  createState,
  FEATURE_IDS,
  isFeatureId,
  isFeatureValue,
} from './schema';
import { createScope } from './scope';
import type { ResolvedOptions } from './options';
import type { StorageAdapter } from './storage';
import type { ChangeEvent, FeatureId } from './types';

/** Commits state before notifying; queued changes make reentrant hooks predictable. */
export function createStore(
  view: Window,
  storage: StorageAdapter,
  options: Pick<ResolvedOptions, 'persist' | 'storageKey' | 'onChange'>,
) {
  const report = createReporter();
  const scope = createScope(() =>
    report('cleanup', 'Store listener cleanup failed.'),
  );
  const listeners = new Set<(event: ChangeEvent) => void>();
  const queue: ChangeEvent[] = [];
  let state = storage.read();
  let active = true;
  let notifying = false;
  const replace = (next: Record<FeatureId, unknown>, persist: boolean) => {
    if (!active) return;
    const changes = FEATURE_IDS.filter(
      (id) => !Object.is(state[id], next[id]),
    ).map((id) => ({ id, value: next[id] }));
    if (!changes.length) return;
    state = next;
    if (persist) storage.write(state);
    queue.push(...changes);
    if (notifying) return;
    notifying = true;
    try {
      while (active && queue.length) {
        const change = queue.shift()!;
        for (const listener of [...listeners]) {
          if (!active) break;
          if (!listeners.has(listener)) continue;
          try {
            listener({ ...change });
          } catch {
            report(
              'subscriber',
              'A settings subscriber failed; other subscribers will continue.',
            );
          }
        }
        if (active && options.onChange) {
          try {
            options.onChange({ id: change.id, value: change.value });
          } catch {
            report(
              'onChange',
              'The onChange hook failed; settings remain active.',
            );
          }
        }
      }
    } finally {
      notifying = false;
    }
  };
  if (options.persist) {
    scope.listen(view, 'storage', (event) => {
      const change = event as StorageEvent;
      if (
        (change.key !== options.storageKey && change.key !== null) ||
        !storage.matches(change.storageArea)
      )
        return;
      const next = storage.accept(change.key === null ? null : change.newValue);
      if (next) replace(next, false);
    });
  }
  return {
    getState: (): Record<FeatureId, unknown> => ({ ...state }),
    subscribe(listener: (event: ChangeEvent) => void) {
      if (active) listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    setFeature(id: FeatureId, value: unknown): void {
      if (!active) return;
      if (!isFeatureId(id) || !isFeatureValue(id, value)) {
        report('value', 'Invalid feature id or value ignored.');
        return;
      }
      replace({ ...state, [id]: value }, true);
    },
    reset(): void {
      replace(createState(), true);
    },
    destroy(): void {
      active = false;
      listeners.clear();
      queue.length = 0;
      scope.dispose();
    },
  };
}

/** Internal consumers share the same implementation-derived contract. */
export type Store = ReturnType<typeof createStore>;

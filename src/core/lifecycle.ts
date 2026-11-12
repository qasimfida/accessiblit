import { createAnnouncer } from './announcer';
import { createReporter } from './diagnostics';
import { createHost } from './host';
import { resolveOptions } from './options';
import { createRegistry } from './registry';
import { createState } from './schema';
import { createScope } from './scope';
import { createStorage } from './storage';
import { createStore } from './store';
import { createStyles } from './styles';
import type { AccessiblitInstance, AccessiblitOptions, Feature } from './types';

const noop = () => {};
function inert(): AccessiblitInstance {
  return {
    open: noop,
    close: noop,
    toggle: noop,
    reset: noop,
    getState: createState,
    setFeature: noop,
    destroy: noop,
  };
}

/** The injectable catalogue is internal: production has no fake or real features yet. */
export function createLifecycle(features: readonly Feature[] = []) {
  let current: AccessiblitInstance | undefined;
  return {
    init(input?: AccessiblitOptions): AccessiblitInstance {
      current?.destroy();
      current = undefined;
      if (typeof window === 'undefined' || typeof document === 'undefined')
        return inert();
      const options = resolveOptions(input);
      const report = createReporter();
      const scope = createScope(() =>
        report(
          'cleanup',
          'Runtime cleanup failed; remaining resources will still be released.',
        ),
      );
      let active = true;
      let store: ReturnType<typeof createStore> | undefined;
      let announcer: ReturnType<typeof createAnnouncer> | undefined;
      let pending: string | undefined;
      const instance: AccessiblitInstance = {
        // UI methods reserve the public contract; Phase 1 has no panel to open.
        open: noop,
        close: noop,
        toggle: noop,
        getState: () => store?.getState() ?? createState(),
        setFeature(id, value) {
          if (!active) return;
          if (!options.features.includes(id)) {
            report(
              'disabled',
              'Feature is unknown or disabled by configuration.',
            );
            return;
          }
          store?.setFeature(id, value);
        },
        reset() {
          if (active) store?.reset();
        },
        destroy() {
          if (!active) return;
          active = false;
          pending = undefined;
          scope.dispose();
          announcer = undefined;
          if (current === instance) current = undefined;
        },
      };
      current = instance;
      try {
        const styles = createStyles(document, options.nonce);
        scope.add(styles.destroy);
        store = createStore(
          window,
          createStorage(window, options.storageKey, options.persist),
          options,
        );
        scope.add(store.destroy);
        const registry = createRegistry(document, styles, (message) => {
          if (!active) return;
          if (announcer) announcer.announce(message);
          else pending = message;
        });
        scope.add(registry.destroy);
        for (const feature of features) registry.register(feature);
        const state = store.getState();
        // Restored effects apply synchronously on html, before waiting for body or adding a host.
        for (const id of options.features) registry.enable(id, state[id]);
        if (!active) return instance;
        scope.add(
          store.subscribe((change) => {
            if (options.features.includes(change.id))
              registry.enable(change.id, change.value);
          }),
        );
        scope.add(
          createHost(document, (root) => {
            announcer = createAnnouncer(root, options.nonce);
            if (pending !== undefined) {
              announcer.announce(pending);
              pending = undefined;
            }
            return announcer.destroy;
          }),
        );
      } catch {
        instance.destroy();
        report(
          'init',
          'Runtime initialization failed; owned resources were rolled back.',
        );
      }
      return instance;
    },
    destroy(): void {
      current?.destroy();
    },
  };
}

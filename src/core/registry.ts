import { createReporter } from './diagnostics';
import { isFeatureId, isFeatureValue } from './schema';
import { createScope } from './scope';
import type { Feature, FeatureId, FeatureApi } from './types';
import type { StyleManager } from './styles';

type Scope = ReturnType<typeof createScope>;
/** Resource scopes isolate both partial application and failing cleanup functions. */
export function createRegistry(
  doc: Document,
  styles: StyleManager,
  announce: (message: string) => void,
) {
  const report = createReporter();
  const entries = new Map<
    FeatureId,
    { feature: Feature; scope?: Scope; value?: unknown }
  >();
  let active = true;
  const disable = (id: FeatureId) => {
    const entry = entries.get(id);
    if (!entry) return;
    const scope = entry.scope;
    entry.scope = undefined;
    entry.value = undefined;
    scope?.dispose();
  };
  return {
    register(feature: Feature): void {
      if (!active) return;
      if (!isFeatureId(feature.id) || typeof feature.apply !== 'function') {
        report('registration', 'Invalid feature registration ignored.');
        return;
      }
      disable(feature.id);
      entries.set(feature.id, { feature });
    },
    list: (): readonly Feature[] =>
      [...entries.values()].map((entry) => entry.feature),
    enable(id: FeatureId, value: unknown): void {
      if (!active) return;
      const entry = entries.get(id);
      if (!entry) return;
      if (!isFeatureValue(id, value)) {
        report(`feature:${id}`, `Invalid value for feature ${id} ignored.`);
        return;
      }
      if (entry.scope && Object.is(entry.value, value)) return;
      disable(id);
      const failed = () =>
        report(
          `feature:${id}`,
          `Feature ${id} failed; other features remain active.`,
        );
      const scope = createScope(failed);
      const api: FeatureApi = {
        document: doc,
        announce,
        listen: scope.listen,
        onCleanup: scope.add,
        styles: {
          addRule: (css) => scope.add(styles.addRule(css)),
          addClass: (name) => scope.add(styles.addClass(name)),
          setVariable: (name, next) =>
            scope.add(styles.setVariable(name, next)),
        },
      };
      entry.scope = scope;
      entry.value = value;
      try {
        const cleanup = entry.feature.apply(value, api);
        if (typeof cleanup !== 'function')
          throw new Error('Feature must return cleanup');
        scope.add(cleanup);
      } catch {
        disable(id);
        failed();
      }
    },
    disable,
    destroy(): void {
      active = false;
      for (const id of entries.keys()) disable(id);
      entries.clear();
    },
  };
}

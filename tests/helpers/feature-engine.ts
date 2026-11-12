import { createRegistry } from '../../src/core/registry';
import { createStyles } from '../../src/core/styles';
import type { Feature } from '../../src/core/types';
/** Exercise real scoped resource ownership rather than duplicating feature cleanup in mocks. */
export function featureEngine(feature: Feature) {
  const styles = createStyles(document);
  const registry = createRegistry(document, styles, () => {});
  registry.register(feature);
  return {
    set: (value: unknown) => registry.enable(feature.id, value),
    destroy() {
      registry.destroy();
      styles.destroy();
    },
  };
}

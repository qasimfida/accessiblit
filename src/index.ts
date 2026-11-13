import { createFeatures } from './features/index';
import { createLifecycle } from './core/lifecycle';
import type { AccessiblitOptions, AccessiblitInstance } from './core/types';

export type {
  FeatureId,
  Feature,
  FeatureApi,
  FeatureControl,
  AccessiblitOptions,
  AccessiblitInstance,
  ChangeEvent,
  Messages,
} from './core/types';

const lifecycle = createLifecycle(createFeatures);

/** Replaces an earlier instance so repeated framework mounts cannot leak resources. */
export function init(options?: AccessiblitOptions): AccessiblitInstance {
  return lifecycle.init(options);
}

/** Safe before initialization and after teardown, including without a DOM. */
export function destroy(): void {
  lifecycle.destroy();
}

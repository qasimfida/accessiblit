import { createScope } from '../core/scope';
import { createReporter } from '../core/diagnostics';
import type { FeatureApi } from '../core/types';
/** Register rollback before acquiring anything, and return a complete, idempotent feature cleanup. */
export function createEffect(api: Pick<FeatureApi, 'onCleanup'>) {
  const report = createReporter();
  const scope = createScope(() =>
    report('cleanup', 'A content effect could not fully clean up.'),
  );
  api.onCleanup(scope.dispose);
  return scope;
}

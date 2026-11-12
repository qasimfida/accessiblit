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

/** CSS-only effects share resource ownership while each feature keeps its own metadata and rules. */
export function cssEffect(
  api: FeatureApi,
  className: string,
  variables: Record<string, string>,
  rule: string,
) {
  const scope = createEffect(api);
  scope.add(api.styles.addRule(rule));
  for (const [name, value] of Object.entries(variables))
    scope.add(api.styles.setVariable(name, value));
  scope.add(api.styles.addClass(className));
  return scope.dispose;
}

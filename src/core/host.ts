import { createReporter } from './diagnostics';
import { createScope } from './scope';
import type { Cleanup } from './types';

const owners = new WeakMap<Document, Cleanup>();
/** Mounts once per document, deferring only the shadow host when body is absent. */
export function createHost(
  doc: Document,
  onMount: (root: ShadowRoot) => Cleanup,
): Cleanup {
  owners.get(doc)?.();
  const report = createReporter();
  const scope = createScope(() => report('cleanup', 'Host cleanup failed.'));
  let active = true;
  let mounted = false;
  let stopWaiting: Cleanup = () => {};
  const destroy = () => {
    if (!active) return;
    active = false;
    scope.dispose();
    if (owners.get(doc) === destroy) owners.delete(doc);
  };
  owners.set(doc, destroy);
  const mount = () => {
    if (!active || mounted || !doc.body) return;
    stopWaiting();
    if (doc.querySelector('[data-accessiblit-host]')) {
      report(
        'duplicate',
        'An existing accessibility host was found; duplicate mount skipped.',
      );
      return;
    }
    try {
      const element = doc.createElement('div');
      element.setAttribute('data-accessiblit-host', '');
      const root = element.attachShadow({ mode: 'open' });
      scope.add(() => element.remove());
      doc.body.appendChild(element);
      mounted = true;
      scope.add(onMount(root));
    } catch {
      destroy();
      report(
        'mount',
        'Accessibility host could not mount; host page remains available.',
      );
    }
  };
  if (doc.body) mount();
  else stopWaiting = scope.listen(doc, 'DOMContentLoaded', mount);
  return destroy;
}

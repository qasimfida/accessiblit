import { createReporter } from '../core/diagnostics';
import { createScope } from '../core/scope';
import { makeButton } from './presentation';
import type { Messages } from '../core/types';

/** An original, decorative person glyph leaves the native button's name unambiguous. */
export function createLauncher(
  doc: Document,
  messages: Messages,
  panelId: string,
  toggle: () => void,
) {
  const element = makeButton(doc, '');
  element.className = 'accessiblit-surface accessiblit-launcher';
  element.setAttribute('aria-label', messages.launcher);
  element.setAttribute('aria-expanded', 'false');
  element.setAttribute('aria-controls', panelId);
  const ns = 'http://www.w3.org/2000/svg';
  const icon = doc.createElementNS(ns, 'svg');
  icon.setAttribute('viewBox', '0 0 24 24');
  icon.setAttribute('width', '26');
  icon.setAttribute('height', '26');
  icon.setAttribute('aria-hidden', 'true');
  icon.setAttribute('focusable', 'false');
  icon.setAttribute('fill', 'none');
  icon.setAttribute('stroke', 'currentColor');
  icon.setAttribute('stroke-width', '2');
  icon.setAttribute('stroke-linecap', 'round');
  icon.setAttribute('stroke-linejoin', 'round');
  const head = doc.createElementNS(ns, 'circle');
  head.setAttribute('cx', '12');
  head.setAttribute('cy', '5');
  head.setAttribute('r', '2');
  const body = doc.createElementNS(ns, 'path');
  body.setAttribute('d', 'M4 9h16M12 9v6m0 0-5 6m5-6 5 6');
  icon.append(head, body);
  element.append(icon);
  const report = createReporter();
  const scope = createScope(() =>
    report('launcher', 'Launcher cleanup failed.'),
  );
  scope.add(() => element.remove());
  scope.listen(element, 'click', toggle);
  return {
    element,
    update(expanded: boolean) {
      if (scope.active) element.setAttribute('aria-expanded', String(expanded));
    },
    destroy: scope.dispose,
  };
}

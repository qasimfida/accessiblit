import { createReporter } from '../core/diagnostics';
import type { FeatureApi } from '../core/types';

let sequence = 0;
/** Private values avoid matching pre-existing attributes; one owner restores their exact originals. */
export function createMarks(api: Pick<FeatureApi, 'onCleanup'>, name: string) {
  const originals = new Map<HTMLElement, string | null>();
  const token = `accessiblit-${++sequence}`;
  const report = createReporter();
  const value = (suffix = '') => `${token}${suffix ? `-${suffix}` : ''}`;
  const remove = (element: HTMLElement) => {
    if (!originals.has(element)) return;
    const original = originals.get(element)!;
    try {
      if (original === null) element.removeAttribute(name);
      else element.setAttribute(name, original);
    } catch {
      report('restore', 'A content marker could not be restored.');
    }
    originals.delete(element);
  };
  const clear = () => {
    for (const element of originals.keys()) remove(element);
  };
  api.onCleanup(clear);
  return {
    value,
    set(element: HTMLElement, suffix = '') {
      if (!originals.has(element))
        originals.set(element, element.getAttribute(name));
      const next = value(suffix);
      if (element.getAttribute(name) !== next) element.setAttribute(name, next);
    },
    remove,
    clear,
    nodes: () => originals.keys(),
  };
}

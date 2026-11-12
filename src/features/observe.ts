import { createReporter } from '../core/diagnostics';
import type { Cleanup, FeatureApi } from '../core/types';

function rootState(doc: Document): string {
  const root = doc.documentElement;
  const classes = [...root.classList].sort();
  const styles = Array.from({ length: root.style.length }, (_, index) =>
    root.style.item(index),
  )
    .sort()
    .map(
      (name) =>
        `${name}:${root.style.getPropertyValue(name)}!${root.style.getPropertyPriority(name)}`,
    );
  return JSON.stringify([classes, styles]);
}
function owned(node: Node): boolean {
  const element = node.nodeType === 1 ? (node as Element) : node.parentElement;
  return !!element?.closest('[data-accessiblit-host],[data-accessiblit-style]');
}
/** Reconcile parser/dynamic content without reacting recursively to the widget's own root and sheet writes. */
export function observeContent(
  api: Pick<FeatureApi, 'document' | 'listen' | 'onCleanup'>,
  refresh: () => void,
): Cleanup {
  const doc = api.document,
    view = doc.defaultView;
  if (!view) return () => {};
  const report = createReporter();
  let active = true,
    signature = rootState(doc);
  const releases: Cleanup[] = [];
  const safe = () => {
    if (active)
      try {
        refresh();
      } catch {
        report(
          'refresh',
          'A content feature could not refresh; the page remains available.',
        );
      }
  };
  const observer = new view.MutationObserver((records) => {
    const next = rootState(doc),
      changed = signature !== next;
    signature = next;
    const relevant = records.some((record) => {
      if (owned(record.target)) return false;
      if (record.type === 'attributes')
        return (
          record.target !== doc.documentElement ||
          !['class', 'style'].includes(record.attributeName!)
        );
      return [...record.addedNodes, ...record.removedNodes].some(
        (node) => !owned(node),
      );
    });
    if (changed || relevant) {
      safe();
      signature = rootState(doc);
    }
  });
  const stop = () => {
    if (!active) return;
    active = false;
    observer.disconnect();
    for (const release of releases) release();
  };
  api.onCleanup(stop);
  observer.observe(doc.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'style', 'hidden', 'aria-hidden', 'role'],
  });
  releases.push(api.listen(view, 'resize', safe));
  releases.push(
    api.listen(
      doc,
      'load',
      (event) => {
        if ((event.target as Element).tagName === 'LINK') safe();
      },
      { capture: true },
    ),
  );
  return stop;
}

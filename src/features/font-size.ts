import type { Cleanup, Feature } from '../core/types';
import { isFeatureValue } from '../core/schema';
import { ROOT_SELECTOR, textElements } from './dom';
import { createEffect } from './effect';
import { createMarks } from './marks';
import { observeContent } from './observe';
const CLASS = 'accessiblit-font-size';
const ATTRIBUTE = 'data-accessiblit-font-size';
/** Measured pixel baselines resize px/rem/em text equally without multiplying nested descendants twice. */
export const fontSize: Feature = {
  id: 'fontSize',
  group: 'content',
  label: 'Font size',
  description: 'Scale text, including pixel-sized text.',
  control: { type: 'range', min: 80, max: 200, step: 10, unit: 'percent' },
  apply(value, api) {
    if (
      typeof value !== 'number' ||
      !isFeatureValue('fontSize', value) ||
      value === 100
    )
      return () => {};
    const doc = api.document,
      view = doc.defaultView;
    if (!view) return () => {};
    const scope = createEffect(api),
      marks = createMarks(api, ATTRIBUTE),
      sizes = new Map<HTMLElement, number>();
    let releaseRule: Cleanup = () => {};
    scope.add(marks.clear);
    scope.add(() => sizes.clear());
    scope.add(() => releaseRule());
    const refresh = () => {
      const root = doc.documentElement,
        enabled = root.classList.contains(CLASS);
      if (enabled) root.classList.remove(CLASS);
      try {
        const measured = textElements(doc)
          .map((element) => ({
            element,
            size: parseFloat(view.getComputedStyle(element).fontSize),
          }))
          .filter((entry) => Number.isFinite(entry.size) && entry.size >= 0);
        const current = new Set(measured.map((entry) => entry.element));
        for (const element of marks.nodes())
          if (!current.has(element)) {
            marks.remove(element);
            sizes.delete(element);
          }
        // Read all baselines before writes so nested em text and inserted children use unadjusted sizes.
        for (const { element, size } of measured) {
          sizes.set(element, size);
          marks.set(element, String(size));
        }
        const css = [...new Set(sizes.values())]
          .sort((a, b) => a - b)
          .map(
            (size) =>
              `${ROOT_SELECTOR}.${CLASS} [${ATTRIBUTE}="${marks.value(String(size))}"]{font-size:calc(${size}px * var(--accessiblit-font-scale))!important}`,
          )
          .join('\n');
        releaseRule();
        releaseRule = css ? api.styles.addRule(css) : () => {};
      } finally {
        if (enabled && scope.active) root.classList.add(CLASS);
      }
    };
    refresh();
    scope.add(
      api.styles.setVariable('--accessiblit-font-scale', String(value / 100)),
    );
    scope.add(api.styles.addClass(CLASS));
    scope.add(observeContent(api, refresh));
    return scope.dispose;
  },
};

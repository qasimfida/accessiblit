import type { Cleanup, FeatureApi } from '../core/types';
import { ROOT_SELECTOR } from './dom';
import {
  COLOUR_CONTENT,
  COLOUR_MEDIA,
  COLOUR_MEDIA_ELEMENTS,
} from './colour-rules';
import { mixColour, mixShadow } from './colour-mix';
import { createEffect } from './effect';
import { createMarks } from './marks';
import { observeContent } from './observe';
const PROPERTIES = [
  'color',
  'background-color',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'outline-color',
  'text-decoration-color',
  'accent-color',
  'caret-color',
  'column-rule-color',
];
const CLASSES = ['accessiblit-monochrome', 'accessiblit-low-saturation'];
/** Recolour paint properties and atomic media, never filtering a layout ancestor or copying owner URLs. */
export function applySaturation(
  api: FeatureApi,
  kind: 'monochrome' | 'low-saturation',
): Cleanup {
  const doc = api.document,
    view = doc.defaultView;
  if (!view) return () => {};
  const scope = createEffect(api),
    marks = createMarks<Element>(api, 'data-accessiblit-' + kind + '-paint');
  const factor = kind === 'monochrome' ? 0 : 0.35;
  const root = `${ROOT_SELECTOR}.accessiblit-${kind}${factor ? ':not(.accessiblit-monochrome)' : ''}`;
  const attribute = 'data-accessiblit-' + kind + '-paint';
  let releaseRule: Cleanup = () => {},
    previous = '';
  scope.add(marks.clear);
  scope.add(() => releaseRule());
  const refresh = () => {
    const active = CLASSES.filter((c) =>
      doc.documentElement.classList.contains(c),
    );
    for (const name of active) doc.documentElement.classList.remove(name);
    try {
      const paints = new Map<Element, string>();
      const nodes = [
        doc.documentElement,
        ...doc.querySelectorAll(COLOUR_CONTENT),
      ];
      for (const node of nodes) {
        const style = view.getComputedStyle(node);
        const declarations = PROPERTIES.map(
          (name) =>
            `${name}:${mixColour(style.getPropertyValue(name), factor)}!important`,
        );
        for (const name of ['text-shadow', 'box-shadow'])
          declarations.push(
            `${name}:${mixShadow(style.getPropertyValue(name), factor)}!important`,
          );
        if (style.backgroundImage && style.backgroundImage !== 'none')
          declarations.push(
            'background-color:rgb(128,128,128)!important',
            'background-blend-mode:luminosity!important',
          );
        paints.set(node, declarations.join(';'));
      }
      for (const node of doc.querySelectorAll(COLOUR_MEDIA_ELEMENTS)) {
        if (
          node.closest('[data-accessiblit-host]') ||
          node.parentElement?.closest('svg,math,object,video,canvas')
        )
          continue;
        const filter = view.getComputedStyle(node).filter;
        // Re-emitting a URL-bearing filter could revalidate a resource. Leave that owner media alone.
        if (/url\s*\(/i.test(filter)) continue;
        paints.set(
          node,
          `filter:${filter && filter !== 'none' ? filter + ' ' : ''}saturate(var(--accessiblit-${kind}-chroma))!important`,
        );
      }
      for (const node of marks.nodes())
        if (!paints.has(node)) marks.remove(node);
      const groups = new Map<string, number>();
      for (const [node, paint] of paints) {
        if (!groups.has(paint)) groups.set(paint, groups.size);
        marks.set(node, String(groups.get(paint)));
      }
      const css = `${COLOUR_MEDIA}{${[...groups]
        .map(([paint, id]) => {
          const target = `[${attribute}="${marks.value(String(id))}"]`;
          return `${root}${target},${root} ${target}{${paint}}`;
        })
        .join('\n')}}`;
      if (css !== previous) {
        releaseRule();
        releaseRule = api.styles.addRule(css);
        previous = css;
      }
    } finally {
      for (const name of active)
        if (scope.active) doc.documentElement.classList.add(name);
    }
  };
  refresh();
  scope.add(
    api.styles.setVariable('--accessiblit-' + kind + '-chroma', String(factor)),
  );
  scope.add(api.styles.addClass('accessiblit-' + kind));
  scope.add(observeContent(api, refresh));
  const forced = view.matchMedia?.('(forced-colors: active)');
  if (forced) scope.add(api.listen(forced, 'change', refresh));
  return scope.dispose;
}

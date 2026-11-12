import type { Feature } from '../core/types';
import { isFeatureValue } from '../core/schema';
import { ROOT_SELECTOR, TEXT_BLOCKS, contentElements } from './dom';
import { createEffect } from './effect';
import { createMarks } from './marks';
import { observeContent } from './observe';
const NAV = 'nav,[role~="navigation"],[role~="menu"],[role~="menubar"]';
const PROTECTED = `${NAV},input,select,textarea,button,iframe,img,video,canvas,svg,math,object,embed,[role~="button"],[role~="textbox"],[role~="combobox"],[role~="listbox"],[role~="slider"],[role~="switch"],[role~="spinbutton"],[role~="tablist"],[role~="toolbar"],[role~="checkbox"],[role~="radio"],[role~="radiogroup"],[role~="searchbox"],[role~="option"],[role~="menuitem"],[role~="menuitemcheckbox"],[role~="menuitemradio"],[role~="tree"],[role~="grid"]`;
const BLOCK_DISPLAYS = new Set([
  'block',
  'flow-root',
  'inline-block',
  'list-item',
  'table-cell',
  'table-caption',
]);
const ATTRIBUTE = 'data-accessiblit-align';
/** Mark only text blocks whose inherited alignment cannot reach a layout container or control. */
export const textAlign: Feature = {
  id: 'textAlign',
  group: 'content',
  label: 'Text alignment',
  description: 'Align text blocks without moving layout controls.',
  control: {
    type: 'select',
    values: ['off', 'left', 'center', 'right'],
    labels: ['Off', 'Left', 'Center', 'Right'],
  },
  apply(value, api) {
    if (
      typeof value !== 'string' ||
      !isFeatureValue('textAlign', value) ||
      value === 'off'
    )
      return () => {};
    const doc = api.document,
      view = doc.defaultView;
    if (!view) return () => {};
    const scope = createEffect(api),
      marks = createMarks(api, ATTRIBUTE);
    scope.add(marks.clear);
    const refresh = () => {
      const nodes = contentElements(doc),
        blocked = new Set<Element>();
      const displays = new Map(
        nodes.map((node) => [node, view.getComputedStyle(node).display]),
      );
      const unsafe: Element[] = [
        ...(doc.body?.querySelectorAll(PROTECTED) ?? []),
      ];
      for (const node of nodes)
        if (
          ['flex', 'inline-flex', 'grid', 'inline-grid'].includes(
            displays.get(node)!,
          )
        )
          unsafe.push(node);
      for (const node of unsafe)
        for (
          let ancestor: Element | null = node;
          ancestor && ancestor !== doc.body;
          ancestor = ancestor.parentElement
        )
          if (ancestor.matches(TEXT_BLOCKS)) blocked.add(ancestor);
      const targets = new Set(
        nodes.filter(
          (node) =>
            node.matches(TEXT_BLOCKS) &&
            !blocked.has(node) &&
            !node.closest(PROTECTED) &&
            BLOCK_DISPLAYS.has(displays.get(node)!),
        ),
      );
      for (const node of marks.nodes())
        if (!targets.has(node)) marks.remove(node);
      for (const node of targets) marks.set(node);
    };
    refresh();
    scope.add(
      api.styles.addRule(
        `${ROOT_SELECTOR}.accessiblit-text-align [${ATTRIBUTE}="${marks.value()}"]{text-align:var(--accessiblit-text-align)!important}`,
      ),
    );
    scope.add(api.styles.setVariable('--accessiblit-text-align', value));
    scope.add(api.styles.addClass('accessiblit-text-align'));
    scope.add(observeContent(api, refresh));
    return scope.dispose;
  },
};

import type { Feature } from '../core/types';
import { cssEffect } from './effect';
import { NAVIGATION_SELECTOR, ROOT_SELECTOR } from './dom';
const HEADINGS = ':where(h1,h2,h3,h4,h5,h6,[role~="heading"])';
/** CSS-generated badges avoid adding labels or nodes to author headings. */
export const highlightHeadings: Feature = {
  id: 'highlightHeadings',
  group: 'navigation',
  label: 'Highlight headings',
  description: 'Outline headings and show a small heading-level badge.',
  control: { type: 'toggle' },
  apply(value, api) {
    if (value !== true) return () => {};
    const root = ROOT_SELECTOR + '.accessiblit-highlight-headings ';
    const css = `${root}${NAVIGATION_SELECTOR}${HEADINGS}{outline:2px solid currentColor!important;outline-offset:3px!important}
${root}${NAVIGATION_SELECTOR}${HEADINGS}::after{content:"H";content:"H" / "";display:inline-block!important;margin-inline-start:.4em!important;padding:.1em .3em!important;border:1px solid currentColor!important;border-radius:2px;font:12px/1.2 system-ui!important;letter-spacing:normal!important;word-spacing:normal!important;text-transform:none!important;vertical-align:middle}
${[1, 2, 3, 4, 5, 6].map((n) => `${root}${NAVIGATION_SELECTOR}:where(h${n})::after{content:"H${n}";content:"H${n}" / ""}`).join('\n')}
${root}${NAVIGATION_SELECTOR}:where([role~="heading"][aria-level])::after{content:"H" attr(aria-level);content:"H" attr(aria-level) / ""}`;
    return cssEffect(
      api,
      'accessiblit-highlight-headings',
      {},
      '@media screen{' + css + '}',
    );
  },
};

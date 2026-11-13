import type { Feature } from '../core/types';
import { cssEffect } from './effect';
import { NAVIGATION_SELECTOR, ROOT_SELECTOR } from './dom';
/** Outline and underline preserve link recognition independently of colour. */
export const highlightLinks: Feature = {
  id: 'highlightLinks',
  group: 'navigation',
  label: 'Highlight links',
  description: 'Outline and underline links, including custom link controls.',
  control: { type: 'toggle' },
  apply: (value, api) =>
    value === true
      ? cssEffect(
          api,
          'accessiblit-highlight-links',
          {},
          `@media screen{${ROOT_SELECTOR}.accessiblit-highlight-links ${NAVIGATION_SELECTOR}:is(a[href],[role~="link"]){outline:2px solid currentColor!important;outline-offset:2px!important;text-decoration-line:underline!important;text-decoration-thickness:2px!important;text-underline-offset:.15em!important}}`,
        )
      : () => {},
};

import type { Feature } from '../core/types';
import { cssEffect } from './effect';
import { CONTENT_SELECTOR, ROOT_SELECTOR } from './dom';
/** Embedded, original two-tone pointers never request an image; native auto remains the CSP fallback. */
export const bigCursor: Feature = {
  id: 'bigCursor',
  group: 'navigation',
  label: 'Larger cursor',
  description: 'Choose a larger pointer for a mouse or trackpad.',
  requiresFinePointer: true,
  control: {
    type: 'select',
    values: [false, true, 2],
    labels: ['Off', 'Large', 'Extra large'],
  },
  apply(value, api) {
    if (value !== true && value !== 2) return () => {};
    const size = value === 2 ? 48 : 32;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32"><path d="M3 2v25l7-7 5 10 5-2-5-10h10Z" fill="white" stroke="black" stroke-width="2" stroke-linejoin="round"/></svg>`;
    const uri = 'data:image/svg+xml,' + encodeURIComponent(svg);
    return cssEffect(
      api,
      'accessiblit-big-cursor',
      {},
      `@media screen and (any-pointer:fine) and (forced-colors:none){${ROOT_SELECTOR}.accessiblit-big-cursor ${CONTENT_SELECTOR}{cursor:url("${uri}") ${size === 48 ? '4 3' : '3 2'},auto!important}}`,
    );
  },
};

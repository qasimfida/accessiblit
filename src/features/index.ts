import { stopAnimations } from './stop-animations';
import { bigCursor } from './big-cursor';
import { highlightHeadings } from './highlight-headings';
import { highlightLinks } from './highlight-links';
import { lowSaturation } from './low-saturation';
import { monochrome } from './monochrome';
import { highContrast } from './high-contrast';
import { darkMode } from './dark-mode';
import { createReadableFont } from './readable-font';
import type { ResolvedOptions } from '../core/options';
import { textAlign } from './text-align';
import { contentScale } from './content-scale';
import { fontSize } from './font-size';
import { lineHeight } from './line-height';
import { letterSpacing } from './letter-spacing';
import { wordSpacing } from './word-spacing';
import type { Feature } from '../core/types';
/** Fresh catalogues keep owner configuration local to an init and out of module-level browser state. */
export function createContentFeatures(
  options: ResolvedOptions,
): readonly Feature[] {
  return [
    stopAnimations,
    bigCursor,
    highlightLinks,
    highlightHeadings,
    darkMode,
    highContrast,
    monochrome,
    lowSaturation,
    fontSize,
    lineHeight,
    letterSpacing,
    wordSpacing,
    textAlign,
    contentScale,
    createReadableFont(options.dyslexiaFontUrl),
  ];
}

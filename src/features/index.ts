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
    darkMode,
    highContrast,
    fontSize,
    lineHeight,
    letterSpacing,
    wordSpacing,
    textAlign,
    contentScale,
    createReadableFont(options.dyslexiaFontUrl),
  ];
}

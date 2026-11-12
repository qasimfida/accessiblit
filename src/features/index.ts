import { fontSize } from './font-size';
import { lineHeight } from './line-height';
import { letterSpacing } from './letter-spacing';
import { wordSpacing } from './word-spacing';
import type { Feature } from '../core/types';
/** Fresh catalogues keep owner configuration local to an init and out of module-level browser state. */
export function createContentFeatures(): readonly Feature[] {
  return [fontSize, lineHeight, letterSpacing, wordSpacing];
}

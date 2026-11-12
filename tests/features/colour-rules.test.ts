import { expect, it } from 'vitest';
import { paletteRules, COLOUR_CONTENT } from '../../src/features/colour-rules';
it('gates both palettes without overriding print or forced colours', () => {
  for (const kind of ['dark', 'contrast'] as const) {
    const css = paletteRules(kind);
    expect(css).toContain('@media screen and (forced-colors:none)');
    expect(css).not.toContain('filter:');
    expect(css).toContain('--accessiblit-' + kind + '-bg');
  }
  expect(paletteRules('dark')).toContain(':not(.accessiblit-high-contrast)');
  expect(COLOUR_CONTENT).toContain('[data-accessiblit-host]');
  expect(COLOUR_CONTENT).toContain('svg *');
});

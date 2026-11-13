import { expect, it } from 'vitest';
import { readingMask } from '../../src/features/reading-mask';
import { featureEngine } from '../helpers/feature-engine';
it('bounds mask luminance and saturated-red chromaticity changes across 24-bit sRGB', () => {
  const engine = featureEngine(readingMask);
  engine.set(true);
  const alpha = Number(
    document.documentElement.style.getPropertyValue(
      '--accessiblit-reading-mask-opacity',
    ),
  );
  engine.destroy();
  const linear = (v: number) =>
    v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  const before = Array.from({ length: 256 }, (_, i) => linear(i / 255));
  const after = Array.from({ length: 256 }, (_, i) =>
    linear((i / 255) * (1 - alpha)),
  );
  const uv = (r: number, g: number, b: number) => {
    const x = 0.4124564 * r + 0.3575761 * g + 0.1804375 * b,
      y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b,
      z = 0.0193339 * r + 0.119192 * g + 0.9503041 * b;
    const denominator = x + 15 * y + 3 * z;
    return denominator
      ? [(4 * x) / denominator, (9 * y) / denominator]
      : [0, 0];
  };
  let maximum = 0,
    checked = 0;
  for (let ri = 0; ri < 256; ri++)
    for (let gi = 0; gi < 256; gi++)
      for (let bi = 0; bi < 256; bi++) {
        const r = before[ri]!,
          g = before[gi]!,
          b = before[bi]!,
          mr = after[ri]!,
          mg = after[gi]!,
          mb = after[bi]!;
        if (!(r / (r + g + b) >= 0.8 || mr / (mr + mg + mb) >= 0.8)) continue;
        const a = uv(r, g, b),
          c = uv(mr, mg, mb);
        maximum = Math.max(maximum, Math.hypot(a[0]! - c[0]!, a[1]! - c[1]!));
        checked++;
      }
  const luminance = 1 - linear(1 - alpha);
  expect(alpha).toBe(0.04);
  expect(luminance).toBeLessThan(0.1);
  expect(maximum).toBeLessThan(0.2);
  console.log(
    'NAVIGATION_FLASH',
    JSON.stringify({
      alpha,
      luminance,
      maximumChromaticityChange: maximum,
      saturatedColoursChecked: checked,
      totalColours: 256 ** 3,
    }),
  );
});

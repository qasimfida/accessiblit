import { expect, it } from 'vitest';
import { mixColour, mixShadow } from '../../src/features/colour-mix';
it('mixes RGB chroma without losing opacity or accepting arbitrary CSS', () => {
  expect(mixColour('rgb(255, 0, 0)', 0)).toBe('rgba(54.213,54.213,54.213,1)');
  expect(mixColour('rgb(100% 0% 0% / 50%)', 0)).toBe(
    'rgba(54.213,54.213,54.213,0.5)',
  );
  expect(mixColour('rgba(100,100,100,0)', 0.35)).toBe('rgba(100,100,100,0)');
  for (const value of [
    'auto',
    'color(display-p3 1 0 0)',
    'rgb(x,2,3)',
    'rgb(1,2)',
    'rgb(1,2,3,4,5)',
  ])
    expect(mixColour(value, 0)).toBe(value);
  expect(mixShadow('rgb(255,0,0) 0px 1px 2px', 0)).toBe(
    'rgba(54.213,54.213,54.213,1) 0px 1px 2px',
  );
});

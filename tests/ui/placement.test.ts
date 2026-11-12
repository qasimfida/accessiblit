// @vitest-environment node
import { expect, it } from 'vitest';
import { placeUI } from '../../src/ui/placement';
import { resolveOptions } from '../../src/core/options';
const view = {
  width: 320,
  height: 256,
  left: 0,
  top: 0,
  layoutWidth: 320,
  layoutHeight: 256,
};
it('anchors each corner while keeping the panel and focus rings inside the viewport', () => {
  for (const position of [
    'bottom-right',
    'bottom-left',
    'top-right',
    'top-left',
  ] as const) {
    const result = placeUI(view, resolveOptions({ position }));
    expect(result.launcherLeft).toBe(position.endsWith('right') ? 256 : 16);
    expect(result.launcherTop).toBe(position.startsWith('bottom') ? 192 : 16);
    expect(result.panelLeft).toBe(8);
    expect(result.panelWidth).toBe(304);
    expect(result.panelMaxHeight).toBe(176);
    expect(result.panelTop).toBe(position.startsWith('top') ? 72 : undefined);
    expect(result.panelBottom).toBe(
      position.startsWith('bottom') ? 72 : undefined,
    );
  }
});
it('honours custom placement, z-index and visual viewport panning, with safe edge clamps', () => {
  const desktop = {
    width: 1280,
    height: 720,
    left: 0,
    top: 0,
    layoutWidth: 1280,
    layoutHeight: 720,
  };
  const custom = placeUI(
    desktop,
    resolveOptions({
      position: 'top-left',
      offset: { x: 30, y: 24 },
      zIndex: 50,
    }),
  );
  expect(custom.launcherLeft).toBe(30);
  expect(custom.launcherTop).toBe(24);
  expect(custom.panelLeft).toBe(30);
  expect(custom.panelTop).toBe(80);
  expect(custom.zIndex).toBe(50);
  const panned = placeUI(
    { ...view, left: 100, top: 40, layoutWidth: 1280, layoutHeight: 1024 },
    resolveOptions(),
  );
  expect(panned.launcherLeft).toBe(356);
  expect(panned.launcherTop).toBe(232);
  expect(panned.panelBottom).toBe(800);
  const extreme = placeUI(
    view,
    resolveOptions({ offset: { x: 10000, y: 10000 } }),
  );
  expect(extreme.launcherLeft).toBe(8);
  expect(extreme.panelMaxHeight).toBeGreaterThanOrEqual(144);
  const zero = placeUI(view, resolveOptions({ offset: { x: 0, y: 0 } }));
  expect(zero.launcherTop + 48).toBe(248);
  const tiny = placeUI({ ...view, width: 8, height: 8 }, resolveOptions());
  expect(tiny.panelWidth).toBe(0);
  expect(tiny.panelMaxHeight).toBe(0);
});

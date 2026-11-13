import { expect, it } from 'vitest';
import { createViewportReader } from '../../src/ui/viewport';

it('uses the fixed root width when mobile overflow expands innerWidth', () => {
  const read = createViewportReader(() => ({ clientWidth: 412 }), {
    innerWidth: 515,
    innerHeight: 1049,
    visualViewport: { width: 412, height: 839, offsetLeft: 0, offsetTop: 0 },
  });
  expect(read()).toEqual({
    width: 412,
    height: 839,
    left: 0,
    top: 0,
    layoutWidth: 412,
    layoutHeight: 1049,
  });
});

it('preserves the layout origin separately from a panned pinch viewport', () => {
  const read = createViewportReader(() => ({ clientWidth: 1280 }), {
    innerWidth: 1280,
    innerHeight: 1024,
    visualViewport: { width: 320, height: 256, offsetLeft: 100, offsetTop: 40 },
  });
  expect(read()).toEqual({
    width: 320,
    height: 256,
    left: 100,
    top: 40,
    layoutWidth: 1280,
    layoutHeight: 1024,
  });
});

it('falls back for an absent root and an unavailable visual viewport', () => {
  const view = { innerWidth: 320, innerHeight: 256 };
  expect(createViewportReader(() => null, view)()).toEqual({
    width: 320,
    height: 256,
    left: 0,
    top: 0,
    layoutWidth: 320,
    layoutHeight: 256,
  });
  expect(createViewportReader(() => ({ clientWidth: 0 }), view)().width).toBe(
    320,
  );
  expect(createViewportReader(() => ({ clientWidth: 300 }), view)().width).toBe(
    300,
  );
});

it('does not repeat root layout reads until viewport width changes', () => {
  let reads = 0;
  const root = {
    get clientWidth() {
      reads++;
      return 412;
    },
  };
  const view = {
    innerWidth: 515,
    innerHeight: 1049,
    visualViewport: { width: 412, height: 839, offsetLeft: 0, offsetTop: 0 },
  };
  const read = createViewportReader(() => root, view);
  read();
  read();
  expect(reads).toBe(1);
  view.innerWidth = 600;
  read();
  expect(reads).toBe(2);
  view.visualViewport.width = 400;
  read();
  expect(reads).toBe(3);
});

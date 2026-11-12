import type { ResolvedOptions } from '../core/options';

/** Visual viewport coordinates keep the surfaces reachable during pinch zoom and small-height layouts. */
export interface UIVIewport {
  width: number;
  height: number;
  left: number;
  top: number;
  layoutWidth: number;
  layoutHeight: number;
}
const clamp = (value: number, low: number, high: number) =>
  Math.min(Math.max(value, low), Math.max(low, high));

/** Offset clamping reserves focus-ring clearance and usable panel height without changing page layout. */
export function placeUI(
  view: UIVIewport,
  options: Pick<ResolvedOptions, 'position' | 'offset' | 'zIndex'>,
) {
  const size = 48;
  const gap = 8;
  const right = options.position.endsWith('right');
  const bottom = options.position.startsWith('bottom');
  const width = Math.max(0, Math.min(360, view.width - gap * 2));
  const x = clamp(options.offset.x, gap, view.width - size - gap);
  const px = clamp(options.offset.x, gap, view.width - width - gap);
  const y = clamp(options.offset.y, gap, view.height - size - 144 - gap * 3);
  return {
    launcherLeft: view.left + (right ? view.width - x - size : x),
    launcherTop: view.top + (bottom ? view.height - y - size : y),
    panelLeft: view.left + (right ? view.width - px - width : px),
    panelTop: bottom ? undefined : view.top + y + size + gap,
    panelBottom: bottom
      ? view.layoutHeight - (view.top + view.height - y - size - gap)
      : undefined,
    panelWidth: width,
    panelMaxHeight: Math.max(
      0,
      Math.min(640, view.height - y - size - gap * 2),
    ),
    layoutWidth: view.layoutWidth,
    zIndex: options.zIndex,
  };
}

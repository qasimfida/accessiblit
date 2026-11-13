import type { FeatureId } from '../../src/core/types';

/** Preserve API/source evidence without visual observers competing with timed renderer work. */
export const PERFORMANCE_TRACE = {
  mode: 'on',
  screenshots: false,
  snapshots: false,
  sources: true,
} as const;

/** Measure each transition on a rendered host, rather than charging prior fixture/frame work to it. */
export async function measureTransitions({
  id,
  values,
}: {
  id: FeatureId;
  values: readonly unknown[];
}) {
  const main = document.querySelector('main');
  if (!main || main.children.length !== 5000)
    throw new Error('The timing fixture must contain exactly 5000 host nodes.');
  const rows = [];
  for (const value of values) {
    const baselineStart = performance.now();
    // A frame callback runs before paint; a second callback separates consecutive operations.
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
    const baselineSettling = performance.now() - baselineStart;
    const start = performance.now();
    window.contentInstance.setFeature(id, value);
    const synchronous = performance.now() - start;
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
    rows.push({
      value,
      synchronous,
      nextFrame: performance.now() - start,
      baselineSettling,
    });
  }
  return rows;
}

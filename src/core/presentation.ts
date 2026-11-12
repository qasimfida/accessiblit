import { createReporter } from './diagnostics';
import type { Cleanup } from './types';
/** Delayed rendering shares the existing host while keeping feature subscriptions independently owned. */
export function createPresentation(nonce?: string) {
  type Render = (root: ShadowRoot, nonce?: string) => Cleanup;
  const entries = new Set<{ render: Render; cleanup?: Cleanup; id: number }>();
  const report = createReporter();
  let root: ShadowRoot | undefined,
    sequence = 0,
    active = true;
  const release = (entry: { cleanup?: Cleanup; id: number }) => {
    const cleanup = entry.cleanup;
    entry.cleanup = undefined;
    try {
      cleanup?.();
    } catch {
      report(
        'cleanup:' + entry.id,
        'A feature surface could not fully clean up.',
      );
    }
  };
  const mount = (entry: { render: Render; cleanup?: Cleanup; id: number }) => {
    if (!root) return;
    try {
      entry.cleanup = entry.render(root, nonce);
    } catch {
      report(
        'render:' + entry.id,
        'A feature surface could not render; other features remain available.',
      );
    }
  };
  return {
    subscribe(render: Render): Cleanup {
      if (!active) return () => {};
      const entry = { render, id: ++sequence };
      entries.add(entry);
      mount(entry);
      return () => {
        if (entries.delete(entry)) release(entry);
      };
    },
    attach(next: ShadowRoot): Cleanup {
      if (!active) return () => {};
      for (const entry of entries) release(entry);
      root = next;
      for (const entry of entries) mount(entry);
      return () => {
        if (root === next) {
          root = undefined;
          for (const entry of entries) release(entry);
        }
      };
    },
    destroy(): void {
      active = false;
      root = undefined;
      for (const entry of entries) release(entry);
      entries.clear();
    },
  };
}

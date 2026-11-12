import type { Cleanup } from './types';

/** Each resource has one owner and idempotent teardown, including partial setup. */
export function createScope(onError: () => void) {
  const cleanups = new Set<Cleanup>();
  let disposed = false;
  const add = (cleanup: Cleanup): Cleanup => {
    let active = true;
    const release = () => {
      if (!active) return;
      active = false;
      cleanups.delete(release);
      try {
        cleanup();
      } catch {
        onError();
      }
    };
    if (disposed) release();
    else cleanups.add(release);
    return release;
  };
  return {
    add,
    listen(
      target: EventTarget,
      type: string,
      listener: EventListener,
      options?: AddEventListenerOptions,
    ): Cleanup {
      const capture = options?.capture ?? false;
      target.addEventListener(type, listener, options);
      return add(() => target.removeEventListener(type, listener, capture));
    },
    dispose(): void {
      if (disposed) return;
      disposed = true;
      for (const cleanup of [...cleanups].reverse()) cleanup();
    },
  };
}

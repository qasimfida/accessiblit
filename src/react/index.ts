'use client';
import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { init } from '@qasimfida/accessiblit';
import type {
  AccessiblitInstance,
  AccessiblitOptions,
} from '@qasimfida/accessiblit';

/** The ref becomes available after commit; memoize options to avoid unnecessary replacement. */
export function useAccessiblit(
  options?: AccessiblitOptions,
): RefObject<AccessiblitInstance | null> {
  const instance = useRef<AccessiblitInstance | null>(null);
  useEffect(() => {
    const owned = init(options);
    instance.current = owned;
    return () => {
      owned.destroy();
      if (instance.current === owned) instance.current = null;
    };
  }, [options]);
  return instance;
}

/** One component per document owns the singleton; it renders no server or hydration markup. */
export function AccessiblitWidget(options: AccessiblitOptions): null {
  useAccessiblit(options);
  return null;
}

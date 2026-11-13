import { act, createElement, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import type { RefObject } from 'react';
import type { AccessiblitInstance, AccessiblitOptions } from '../../src/index';
vi.mock('@qasimfida/accessiblit', async () => import('../../src/index'));
import { AccessiblitWidget, useAccessiblit } from '../../src/react';
const environment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT: boolean;
};
environment.IS_REACT_ACT_ENVIRONMENT = true;
const container = document.createElement('div');
const roots: ReturnType<typeof createRoot>[] = [];
afterEach(async () => {
  for (const root of roots.splice(0)) await act(() => root.unmount());
  container.remove();
});
it('survives a real StrictMode effect replay and fully unmounts', async () => {
  document.body.append(container);
  const before = document.documentElement.outerHTML;
  const root = createRoot(container);
  roots.push(root);
  await act(() =>
    root.render(
      createElement(
        StrictMode,
        null,
        createElement(AccessiblitWidget, { persist: false }),
      ),
    ),
  );
  expect(document.querySelectorAll('[data-accessiblit-host]')).toHaveLength(1);
  expect(container.childNodes).toHaveLength(0);
  await act(() => root.unmount());
  roots.pop();
  expect(document.documentElement.outerHTML).toBe(before);
});
it('exposes an owned ref, replaces changed options and clears it on unmount', async () => {
  let ref: RefObject<AccessiblitInstance | null> | undefined;
  function Consumer(options: AccessiblitOptions) {
    ref = useAccessiblit(options);
    return null;
  }
  const root = createRoot(container);
  roots.push(root);
  await act(() => root.render(createElement(Consumer, { persist: false })));
  const previous = ref!.current;
  expect(previous).not.toBeNull();
  await act(() =>
    root.render(
      createElement(Consumer, { persist: false, position: 'top-left' }),
    ),
  );
  expect(ref!.current).not.toBe(previous);
  previous!.destroy();
  expect(document.querySelectorAll('[data-accessiblit-host]')).toHaveLength(1);
  await act(() => root.unmount());
  roots.pop();
  expect(ref!.current).toBeNull();
  expect(document.querySelector('[data-accessiblit-host]')).toBeNull();
});
it('renders no SSR markup and never runs the client effect on the server', () => {
  expect(renderToString(createElement(AccessiblitWidget, {}))).toBe('');
  expect(document.querySelector('[data-accessiblit-host]')).toBeNull();
});

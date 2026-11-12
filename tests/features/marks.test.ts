import { afterEach, expect, it, vi } from 'vitest';
import { createMarks } from '../../src/features/marks';
afterEach(() => vi.restoreAllMocks());
it('restores original attributes, removes new ones and can release detached nodes', () => {
  const cleanups: (() => void)[] = [];
  const marks = createMarks(
    {
      onCleanup: (fn) => {
        cleanups.push(fn);
      },
    },
    'data-accessiblit-test',
  );
  const old = document.createElement('p');
  old.setAttribute('data-accessiblit-test', 'host');
  const fresh = document.createElement('p');
  const before = old.outerHTML;
  marks.set(old, '16');
  marks.set(fresh);
  marks.set(old, '20');
  expect(old.getAttribute('data-accessiblit-test')).toBe(marks.value('20'));
  expect([...marks.nodes()]).toHaveLength(2);
  marks.remove(fresh);
  marks.remove(fresh);
  expect(fresh.hasAttribute('data-accessiblit-test')).toBe(false);
  cleanups.forEach((fn) => fn());
  expect(old.outerHTML).toBe(before);
  expect([...marks.nodes()]).toEqual([]);
});
it('continues restoration when one host node rejects removal', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const marks = createMarks({ onCleanup: () => {} }, 'data-accessiblit-test');
  const bad = document.createElement('p'),
    good = document.createElement('p');
  marks.set(bad);
  marks.set(good);
  vi.spyOn(bad, 'removeAttribute').mockImplementation(() => {
    throw new Error('host');
  });
  expect(() => marks.clear()).not.toThrow();
  expect(good.hasAttribute('data-accessiblit-test')).toBe(false);
  expect(warn).toHaveBeenCalledTimes(1);
});

it('can own SVG attributes without pretending the node is HTML', () => {
  const node = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const marks = createMarks<Element>(
    { onCleanup: () => {} },
    'data-test-marker',
  );
  marks.set(node);
  expect(node.hasAttribute('data-test-marker')).toBe(true);
  marks.clear();
  expect(node.hasAttribute('data-test-marker')).toBe(false);
});

import { expect, it, vi } from 'vitest';
import { topClearance } from '../../src/features/focus-geometry';
it('finds visible fixed/sticky headers and leaves normal-flow content alone', () => {
  const header = document.createElement('header');
  document.body.append(header);
  header.style.position = 'sticky';
  vi.spyOn(header, 'getBoundingClientRect').mockReturnValue(
    new DOMRect(0, 0, 1024, 64),
  );
  expect(topClearance(document)).toBe(72);
  header.style.position = 'static';
  expect(topClearance(document)).toBe(8);
  header.style.position = 'fixed';
  header.style.visibility = 'hidden';
  expect(topClearance(document)).toBe(8);
  header.remove();
  vi.restoreAllMocks();
  expect(topClearance(document.implementation.createHTMLDocument())).toBe(8);
});

import { afterEach, expect, it } from 'vitest';
import {
  contentElements,
  eligibleElement,
  textElements,
} from '../../src/features/dom';
afterEach(() => document.body.replaceChildren());
it('finds owned text and value controls while excluding private or hidden trees', () => {
  const main = document.createElement('main');
  const p = document.createElement('p');
  p.id = 'copy';
  p.append('Read ');
  const strong = document.createElement('strong');
  strong.id = 'strong';
  strong.textContent = 'this';
  p.append(strong);
  const input = document.createElement('input');
  input.id = 'input';
  const icon = document.createElement('span');
  icon.id = 'icon';
  const hidden = document.createElement('div');
  hidden.hidden = true;
  hidden.textContent = 'Hidden';
  const aria = document.createElement('div');
  aria.setAttribute('aria-hidden', 'TRUE');
  aria.textContent = 'Decorative';
  const host = document.createElement('div');
  host.setAttribute('data-accessiblit-host', '');
  host.textContent = 'Private';
  const script = document.createElement('script');
  script.textContent = 'void 0';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  main.append(p, input, icon, hidden, aria, host, script, svg);
  document.body.append(main);
  expect(textElements(document).map((e) => e.id)).toEqual([
    'copy',
    'strong',
    'input',
  ]);
  expect(contentElements(document)).toContain(icon);
  expect(eligibleElement(svg)).toBe(false);
});
it('does not require a body to exist yet', () => {
  const doc = document.implementation.createHTMLDocument('Early');
  doc.body.remove();
  expect(contentElements(doc)).toEqual([]);
  expect(textElements(doc)).toEqual([]);
});

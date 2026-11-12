import { afterEach, expect, it } from 'vitest';
import { createStyles } from '../../src/core/styles';
afterEach(() => {
  document.documentElement.removeAttribute('class');
  document.documentElement.removeAttribute('style');
  document
    .querySelectorAll('[data-accessiblit-style]')
    .forEach((e) => e.remove());
});
it('composes class and variable ownership and restores exact root attributes', () => {
  const root = document.documentElement;
  root.setAttribute('class', ' host   accessiblit-existing ');
  root.setAttribute('style', 'color:red; --accessiblit-size: 99 !important;');
  const before = root.outerHTML.slice(0, root.outerHTML.indexOf('>') + 1);
  const styles = createStyles(document, 'nonce');
  const a = styles.addClass('accessiblit-test');
  const b = styles.addClass('accessiblit-test');
  styles.addClass('accessiblit-existing');
  a();
  expect(root.classList.contains('accessiblit-test')).toBe(true);
  b();
  expect(root.classList.contains('accessiblit-test')).toBe(false);
  const first = styles.setVariable('--accessiblit-size', '120');
  const second = styles.setVariable('--accessiblit-size', '140');
  first();
  expect(root.style.getPropertyValue('--accessiblit-size')).toBe('140');
  second();
  expect(root.style.getPropertyPriority('--accessiblit-size')).toBe(
    'important',
  );
  const lower = styles.setVariable('--accessiblit-new', '1');
  const upper = styles.setVariable('--accessiblit-new', '2');
  upper();
  expect(root.style.getPropertyValue('--accessiblit-new')).toBe('1');
  lower();
  expect(root.style.getPropertyValue('--accessiblit-new')).toBe('');
  const rule = styles.addRule('html.accessiblit-test {color: red}');
  styles.addRule('html {font-size: var(--accessiblit-size)}');
  expect(
    document.head.querySelectorAll('[data-accessiblit-style]'),
  ).toHaveLength(1);
  rule();
  styles.destroy();
  styles.destroy();
  expect(root.outerHTML.slice(0, root.outerHTML.indexOf('>') + 1)).toBe(before);
  expect(document.querySelector('[data-accessiblit-style]')).toBeNull();
  styles.addClass('accessiblit-late')();
  styles.setVariable('--accessiblit-size', '900')();
  styles.addRule('late{}')();
  expect(root.classList.contains('accessiblit-late')).toBe(false);
});
it('removes newly created attributes but preserves unrelated host edits', () => {
  const root = document.documentElement;
  const a = createStyles(document);
  a.addClass('accessiblit-active');
  a.setVariable('--accessiblit-size', '120');
  a.destroy();
  expect(root.hasAttribute('class')).toBe(false);
  expect(root.hasAttribute('style')).toBe(false);
  const b = createStyles(document);
  b.addClass('accessiblit-active');
  b.setVariable('--accessiblit-size', '120');
  root.classList.add('host-later');
  root.style.setProperty('color', 'blue');
  b.destroy();
  expect(root.className).toBe('host-later');
  expect(root.style.color).toBe('blue');
});
it('rejects unowned class and variable names', () => {
  const styles = createStyles(document);
  styles.addClass('host')();
  styles.setVariable('color', 'red')();
  expect(document.documentElement.className).toBe('');
  expect(document.documentElement.style.color).toBe('');
  styles.destroy();
});

it('restores the exact page when the last effect is released before destroy', () => {
  const root = document.documentElement;
  root.setAttribute('class', ' host   theme ');
  root.setAttribute('style', 'color:red;');
  const before = root.outerHTML;
  const styles = createStyles(document);
  const releaseClass = styles.addClass('accessiblit-example');
  const releaseVariable = styles.setVariable('--accessiblit-example', '2');
  const releaseRule = styles.addRule('html.accessiblit-example{color:blue}');
  releaseRule();
  releaseVariable();
  releaseClass();
  expect(root.outerHTML).toBe(before);
  const again = styles.addRule('html{color:green}');
  expect(document.querySelector('[data-accessiblit-style]')).not.toBeNull();
  again();
  expect(root.outerHTML).toBe(before);
  styles.destroy();
});

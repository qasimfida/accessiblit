import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

/** Audit the code people actually copy, rather than a second hand-maintained example. */
export function siteSnippets() {
  const snippets = new Map();
  for (const path of ['install/index.html', 'options/index.html']) {
    const dom = new JSDOM(
      readFileSync(new URL(`../../site/${path}`, import.meta.url), 'utf8'),
    );
    for (const node of dom.window.document.querySelectorAll(
      'code[data-snippet]',
    )) {
      const id = node.getAttribute('data-snippet');
      assert.equal(snippets.has(id), false, `Duplicate snippet ${id}`);
      snippets.set(id, {
        code: node.textContent,
        language: node.getAttribute('data-language'),
      });
    }
    dom.window.close();
  }
  assert.deepEqual(
    [...snippets.keys()].sort(),
    [
      'cdn',
      'npm-install',
      'esm',
      'react-install',
      'react',
      'next',
      'self-hosted',
      'pack',
      'git',
      'private-registry',
      'lifecycle',
    ].sort(),
  );
  return snippets;
}

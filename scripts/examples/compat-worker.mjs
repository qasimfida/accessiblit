import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';
import { run } from './process.mjs';
/** Exercise the oldest promised peer and the intermediate major with their real renderers. */
export async function reactCompatibility(folder) {
  const rows = [];
  for (const version of ['17.0.2', '18.3.1']) {
    const directory = join(folder, 'react-' + version);
    mkdirSync(directory);
    writeFileSync(
      join(directory, 'package.json'),
      JSON.stringify({
        private: true,
        dependencies: {
          '@qasimfida/accessiblit': 'file:../accessiblit.tgz',
          react: version,
          'react-dom': version,
        },
      }),
    );
    run(
      'npm',
      ['install', '--ignore-scripts', '--no-audit', '--no-fund'],
      directory,
    );
    const require = createRequire(join(directory, 'package.json'));
    const dom = new JSDOM(
      '<!doctype html><html><head></head><body><div id="root"></div></body></html>',
      { url: 'https://example.test', pretendToBeVisual: true },
    );
    const previous = Object.fromEntries(
      ['window', 'document', 'IS_REACT_ACT_ENVIRONMENT'].map((key) => [
        key,
        Object.getOwnPropertyDescriptor(globalThis, key),
      ]),
    );
    Object.defineProperties(globalThis, {
      window: { configurable: true, value: dom.window },
      document: { configurable: true, value: dom.window.document },
      IS_REACT_ACT_ENVIRONMENT: { configurable: true, value: true },
    });
    try {
      const React = require('react');
      const { AccessiblitWidget } = require('@qasimfida/accessiblit/react');
      const act = React.act ?? require('react-dom/test-utils').act;
      const container = dom.window.document.getElementById('root');
      const before = dom.window.document.documentElement.outerHTML;
      const root = version.startsWith('17')
        ? undefined
        : require('react-dom/client').createRoot(container);
      await act(async () => {
        const tree = React.createElement(
          React.StrictMode,
          null,
          React.createElement(AccessiblitWidget, { persist: false }),
        );
        if (root) root.render(tree);
        else require('react-dom').render(tree, container);
      });
      assert.equal(
        dom.window.document.querySelectorAll('[data-accessiblit-host]').length,
        1,
      );
      await act(async () => {
        if (root) root.unmount();
        else require('react-dom').unmountComponentAtNode(container);
      });
      assert.equal(dom.window.document.documentElement.outerHTML, before);
      assert.equal(
        require('react-dom/server').renderToString(
          React.createElement(AccessiblitWidget, {}),
        ),
        '',
      );
      rows.push({ version, strictMode: true, restored: true, ssrMarkup: '' });
    } finally {
      for (const [key, descriptor] of Object.entries(previous)) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else delete globalThis[key];
      }
      dom.window.close();
    }
  }
  return rows;
}

// Renderer schedulers own Node MessagePorts; the parent owns this test worker's lifetime.
const { parentPort, workerData } = await import('node:worker_threads');
parentPort.postMessage(await reactCompatibility(workerData.folder));

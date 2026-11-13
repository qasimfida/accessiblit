import assert from 'node:assert/strict';
Object.defineProperty(globalThis, 'window', {
  configurable: true,
  get() {
    throw new Error('React import touched window');
  },
});
const React = await import('react');
const { renderToString } = await import('react-dom/server');
const { AccessiblitWidget, useAccessiblit } =
  await import('@qasimfida/accessiblit/react');
assert.equal(renderToString(React.createElement(AccessiblitWidget, {})), '');
function HookConsumer() {
  assert.equal(useAccessiblit().current, null);
  return null;
}
assert.equal(renderToString(React.createElement(HookConsumer)), '');
delete globalThis.window;
console.log('Packed React ESM import and server render avoid browser globals.');

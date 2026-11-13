import { init } from '../../dist/index.mjs';
const query = new globalThis.URLSearchParams(globalThis.location.search);
globalThis.qaInit = init;
globalThis.qaChanges = [];
if (globalThis.document.querySelector('[data-qa-shadow]')) {
  const root = globalThis.document
    .querySelector('[data-qa-shadow]')
    .attachShadow({ mode: 'open' });
  const style = globalThis.document.createElement('style');
  style.textContent =
    ':host{display:block} p{font:16px/1.5 system-ui;color:#172b3d;background:#fff}';
  const p = globalThis.document.createElement('p');
  p.textContent = 'Shadow component text';
  const button = globalThis.document.createElement('button');
  button.textContent = 'Shadow action';
  root.append(style, p, button);
}
if (globalThis.document.querySelector('[data-qa-heavy]')) {
  const fragment = globalThis.document.createDocumentFragment();
  for (let i = 0; i < 5500; i++) {
    const p = globalThis.document.createElement('p');
    p.textContent = 'Heavy fixture paragraph ' + i;
    fragment.append(p);
  }
  globalThis.document.querySelector('[data-qa-heavy]').append(fragment);
}
globalThis.qaInstance = init({
  persist: false,
  nonce: query.get('nonce') ?? undefined,
  onChange(event) {
    globalThis.qaChanges.push(event);
  },
});

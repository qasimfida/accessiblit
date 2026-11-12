import './content.mjs';
const { document, location, URLSearchParams } = globalThis;
const canvas = document.querySelector('canvas');
const context = canvas.getContext('2d');
for (const [index, colour] of ['#d03020', '#208040', '#2050d0'].entries()) {
  context.fillStyle = colour;
  context.fillRect(index * 54, 0, 54, 90);
}
document
  .querySelector('#show-modal')
  .addEventListener('click', () =>
    document.querySelector('dialog').showModal(),
  );
document
  .querySelector('#hide-modal')
  .addEventListener('click', () => document.querySelector('dialog').close());
if (new URLSearchParams(location.search).has('heavy')) {
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < 2000; i++) {
    const p = document.createElement('p');
    p.textContent = 'Heavy scrolling text block ' + i;
    p.className = i % 2 ? 'gradient' : 'background';
    fragment.append(p);
  }
  document.querySelector('#heavy').append(fragment);
}

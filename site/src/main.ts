const demo = document.querySelector<HTMLButtonElement>('#demo-open');
if (demo) {
  demo.disabled = false;
  demo.addEventListener('click', () => {
    document.dispatchEvent(new Event('accessiblit:open-demo'));
  });
}

// Safari focuses an overflow region without providing native horizontal arrow scrolling.
for (const region of document.querySelectorAll<HTMLElement>(
  '.table-scroll[tabindex="0"]',
)) {
  region.addEventListener('keydown', (event) => {
    if (
      event.target !== region ||
      event.defaultPrevented ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      region.scrollWidth <= region.clientWidth
    )
      return;
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    region.scrollBy({
      left: event.key === 'ArrowRight' ? 64 : -64,
      behavior: 'auto',
    });
  });
}

export {};

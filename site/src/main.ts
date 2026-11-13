const demo = document.querySelector<HTMLButtonElement>('#demo-open');
if (demo) {
  demo.disabled = false;
  demo.addEventListener('click', () => {
    document.dispatchEvent(new Event('accessiblit:open-demo'));
  });
}

export {};

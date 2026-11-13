/** Time only init; setup, cleanup, paint and browser startup stay outside it. */
export async function measureInit() {
  const samples = [];
  const warmups = [];
  for (let i = 0; i < 35; i++) {
    globalThis.Accessiblit.destroy();
    // Keep the same rendered host and default, empty persistent state each time.
    await new Promise((resolve) =>
      globalThis.requestAnimationFrame(() =>
        globalThis.requestAnimationFrame(resolve),
      ),
    );
    const start = globalThis.performance.now();
    const instance = globalThis.Accessiblit.init();
    const elapsed = globalThis.performance.now() - start;
    (i < 5 ? warmups : samples).push(elapsed);
    if (!globalThis.document.querySelector('[data-accessiblit-host]'))
      throw new Error('init did not mount the widget.');
    instance.destroy();
    if (globalThis.document.querySelector('[data-accessiblit-host]'))
      throw new Error('destroy left a host behind.');
  }
  return { warmups, samples };
}

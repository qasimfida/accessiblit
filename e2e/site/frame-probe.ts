/** Measure actual text, not an empty element shell that the HTML parser has not filled yet. */
export function sampleContentFrames() {
  const frames: number[] = [];
  Reflect.set(window, 'siteFirstFrames', frames);
  Reflect.set(window, 'siteEmptyFrames', 0);
  const sample = () => {
    const probe = document.querySelector('.demo-copy p');
    if (probe?.textContent?.trim())
      frames.push(parseFloat(getComputedStyle(probe).fontSize));
    else if (probe)
      Reflect.set(
        window,
        'siteEmptyFrames',
        Reflect.get(window, 'siteEmptyFrames') + 1,
      );
    if (frames.length < 5) requestAnimationFrame(sample);
  };
  requestAnimationFrame(sample);
}

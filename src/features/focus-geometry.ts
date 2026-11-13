/** Hit testing finds visible top-edge occluders without scanning every page element on each focus change. */
export function topClearance(doc: Document, target?: Element): number {
  const view = doc.defaultView;
  if (!view) return 8;
  const width = view.innerWidth,
    points = [width * 0.25, width * 0.5, width * 0.75];
  if (target) {
    const box = target.getBoundingClientRect();
    points.push(Math.max(0, Math.min(width - 1, box.left + box.width / 2)));
  }
  const candidates = new Set<Element>();
  const hits =
    typeof doc.elementsFromPoint === 'function'
      ? points.flatMap((x) => doc.elementsFromPoint(x, 1))
      : [
          ...doc.querySelectorAll(
            'header,nav,[role~="banner"],[role~="navigation"]',
          ),
        ];
  for (const hit of hits)
    for (
      let node: Element | null = hit;
      node && node !== doc.documentElement;
      node = node.parentElement
    )
      if (!node.closest('[data-accessiblit-host]')) candidates.add(node);
  let bottom = 0;
  for (const node of candidates) {
    const style = view.getComputedStyle(node),
      box = node.getBoundingClientRect();
    if (
      !node.contains(target ?? null) &&
      ['fixed', 'sticky'].includes(style.position) &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0' &&
      box.width > 0 &&
      box.height > 0 &&
      box.top <= 1 &&
      box.bottom > 0
    )
      bottom = Math.max(bottom, box.bottom);
  }
  return Math.max(8, Math.min(view.innerHeight - 16, bottom + 8));
}

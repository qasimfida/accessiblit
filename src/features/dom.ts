/** Scope overrides to html while beating common important author rules without touching inline styles. */
export const ROOT_SELECTOR =
  ':is(html,#accessiblit-a#accessiblit-b#accessiblit-c)';
/** Private UI, non-HTML graphics and intentionally hidden content must not be classified as page text. */
export const EXCLUDED_SELECTOR =
  'script,style,noscript,template,svg,math,[data-accessiblit-host],[aria-hidden="true" i],[hidden]';
/** Direct rules resolve em spacing against each element's own font rather than an inherited pixel value. */
export const CONTENT_SELECTOR =
  ':where(body,body *):not(:where(script,style,noscript,template,svg,svg *,math,math *,[data-accessiblit-host],[data-accessiblit-host] *,[aria-hidden="true" i],[aria-hidden="true" i] *,[hidden],[hidden] *))';
/** Semantic text blocks avoid treating generic layout wrappers as alignment controls. */
export const TEXT_BLOCKS =
  'p,h1,h2,h3,h4,h5,h6,blockquote,li,dt,dd,figcaption,caption,td,th';
/** Namespace and ancestor checks also exclude HTML nested inside an SVG foreignObject. */
export function eligibleElement(element: Element): element is HTMLElement {
  return (
    element.namespaceURI === 'http://www.w3.org/1999/xhtml' &&
    !element.closest(EXCLUDED_SELECTOR)
  );
}
/** Reject whole excluded subtrees once instead of repeating ancestor searches for every descendant. */
export function contentElements(doc: Document): HTMLElement[] {
  const body = doc.body;
  if (!body || !eligibleElement(body)) return [];
  // Detached HTML documents have no Window, but the standard filter constants still apply.
  const filter = doc.defaultView?.NodeFilter ?? {
    SHOW_ELEMENT: 1,
    FILTER_ACCEPT: 1,
    FILTER_REJECT: 2,
  };
  const walker = doc.createTreeWalker(body, filter.SHOW_ELEMENT, {
    acceptNode(node) {
      const element = node as Element;
      return element.namespaceURI === 'http://www.w3.org/1999/xhtml' &&
        !element.matches(EXCLUDED_SELECTOR)
        ? filter.FILTER_ACCEPT
        : filter.FILTER_REJECT;
    },
  });
  const elements: HTMLElement[] = [body];
  let next: Node | null;
  while ((next = walker.nextNode())) elements.push(next as HTMLElement);
  return elements;
}

/** Text ownership avoids scaling empty icon-font wrappers; value controls have no text child nodes. */
export function textElements(doc: Document): HTMLElement[] {
  return contentElements(doc).filter((element) => {
    if (element.matches('input,select,textarea')) return true;
    // Avoid allocating a child-node array for every text block on large pages.
    for (let node = element.firstChild; node; node = node.nextSibling)
      if (node.nodeType === 3 && node.textContent?.trim()) return true;
    return false;
  });
}

/** Navigation cues include graphical controls, while private widget surfaces remain isolated. */
export const NAVIGATION_SELECTOR =
  ':where(body,body *):not(:where([data-accessiblit-host],[data-accessiblit-host] *))';

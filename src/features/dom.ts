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
/** A fresh list naturally handles parser-created body content and later inserted HTML. */
export function contentElements(doc: Document): HTMLElement[] {
  return doc.body
    ? [doc.body, ...doc.body.querySelectorAll('*')].filter(eligibleElement)
    : [];
}
/** Text ownership avoids scaling empty icon-font wrappers; value controls have no text child nodes. */
export function textElements(doc: Document): HTMLElement[] {
  return contentElements(doc).filter(
    (element) =>
      element.matches('input,select,textarea') ||
      [...element.childNodes].some(
        (node) => node.nodeType === 3 && !!node.textContent?.trim(),
      ),
  );
}

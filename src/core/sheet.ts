import { createReporter } from './diagnostics';

/** One owned sheet per tree; feature CSS never creates per-element style nodes. */
export function createSheet(target: Document | ShadowRoot, nonce?: string) {
  const doc =
    target.nodeType === 9 ? (target as Document) : target.ownerDocument!;
  const report = createReporter();
  let sheet: CSSStyleSheet | undefined;
  let element: HTMLStyleElement | undefined;
  let active = true;
  let attempted = false;
  const detach = () => {
    if (!sheet) return;
    try {
      target.adoptedStyleSheets = target.adoptedStyleSheets.filter(
        (item) => item !== sheet,
      );
    } catch {
      report('remove', 'Could not detach an owned constructed stylesheet.');
    }
    sheet = undefined;
  };
  return {
    set(css: string): void {
      if (!active) return;
      if (!attempted) {
        attempted = true;
        try {
          const Sheet = doc.defaultView?.CSSStyleSheet;
          if (
            'adoptedStyleSheets' in target &&
            Sheet &&
            typeof Sheet.prototype.replaceSync === 'function'
          ) {
            const candidate = new Sheet();
            candidate.replaceSync(css);
            target.adoptedStyleSheets = [
              ...target.adoptedStyleSheets,
              candidate,
            ];
            sheet = candidate;
            return;
          }
        } catch {
          report(
            'adopt',
            'Constructed stylesheets unavailable; using a nonce-capable style element.',
          );
        }
      }
      if (sheet) {
        try {
          sheet.replaceSync(css);
          return;
        } catch {
          detach();
          report('replace', 'Stylesheet update failed; using a style element.');
        }
      }
      if (!element) {
        element = doc.createElement('style');
        element.setAttribute('data-accessiblit-style', '');
        if (nonce !== undefined) element.setAttribute('nonce', nonce);
        (target.nodeType === 9
          ? (doc.head ?? doc.documentElement)
          : target
        ).appendChild(element);
      }
      element.textContent = css;
    },
    destroy(): void {
      active = false;
      detach();
      element?.remove();
      element = undefined;
    },
  };
}

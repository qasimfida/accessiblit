import type { Page } from '@playwright/test';
/** Axe clones shadow CSS into detached documents; those audit-owned copies need the same CSP authorization. */
export async function authorizeAuditCopies(page: Page, nonce: string) {
  const handle = await page.evaluateHandle((nonce) => {
    const implementation = document.implementation;
    const descriptor = Object.getOwnPropertyDescriptor(
      implementation,
      'createHTMLDocument',
    );
    const create = implementation.createHTMLDocument;
    let copies = 0;
    implementation.createHTMLDocument = function (title?: string) {
      const detached = create.call(implementation, title);
      const append = detached.head.appendChild;
      detached.head.appendChild = function <T extends Node>(child: T): T {
        if (
          child.nodeType === 1 &&
          (child as unknown as Element).localName === 'style'
        ) {
          (child as unknown as HTMLStyleElement).nonce = nonce;
          copies++;
        }
        return append.call(detached.head, child) as T;
      };
      return detached;
    };
    return {
      count: () => copies,
      restore() {
        if (descriptor)
          Object.defineProperty(
            implementation,
            'createHTMLDocument',
            descriptor,
          );
        else Reflect.deleteProperty(implementation, 'createHTMLDocument');
      },
    };
  }, nonce);
  return {
    count: () => handle.evaluate((h) => h.count()),
    async restore() {
      await handle.evaluate((h) => h.restore());
      await handle.dispose();
    },
  };
}

import { expect, test } from '@playwright/test';
import { ALL_FEATURES } from './helpers/all-features';
import { loadContent } from './helpers/content';
for (const fallback of [false, true])
  test(
    'all-feature StrictMode cleanup with stylesheet fallback ' + fallback,
    async ({ page, browserName }) => {
      if (fallback)
        await page.addInitScript(() =>
          Object.defineProperty(CSSStyleSheet.prototype, 'replaceSync', {
            configurable: true,
            value: undefined,
          }),
        );
      await loadContent(page, 'article');
      const result = await page.evaluate(
        async ({ state, fallback }) => {
          window.contentInstance.destroy();
          const before = document.documentElement.outerHTML,
            sheets = [...document.adoptedStyleSheets];
          const add = EventTarget.prototype.addEventListener,
            remove = EventTarget.prototype.removeEventListener;
          const records: {
            target: EventTarget;
            type: string;
            listener: EventListenerOrEventListenerObject;
            capture: boolean;
          }[] = [];
          let adds = 0,
            removes = 0;
          EventTarget.prototype.addEventListener = function (
            type,
            listener,
            options,
          ) {
            if (listener) {
              records.push({
                target: this,
                type,
                listener,
                capture:
                  typeof options === 'boolean'
                    ? options
                    : (options?.capture ?? false),
              });
              adds++;
            }
            return add.call(this, type, listener, options);
          };
          EventTarget.prototype.removeEventListener = function (
            type,
            listener,
            options,
          ) {
            const capture =
              typeof options === 'boolean'
                ? options
                : (options?.capture ?? false);
            const index = records.findIndex(
              (r) =>
                r.target === this &&
                r.type === type &&
                r.listener === listener &&
                r.capture === capture,
            );
            if (index >= 0) {
              records.splice(index, 1);
              removes++;
            }
            return remove.call(this, type, listener, options);
          };
          const frame = () =>
            new Promise<void>((resolve) =>
              requestAnimationFrame(() =>
                requestAnimationFrame(() => resolve()),
              ),
            );
          const enable = () => {
            for (const [id, value] of Object.entries(state))
              window.contentInstance.setFeature(
                id as keyof typeof state,
                value,
              );
          };
          const rows = [];
          try {
            for (let i = 0; i < 2; i++) {
              window.contentInstance = window.contentInit({
                persist: false,
                nonce: 'owner-test',
              });
              enable();
              await frame();
              window.contentInstance.reset();
              await frame();
              const clone = document.documentElement.cloneNode(true) as Element;
              clone.querySelector('[data-accessiblit-host]')!.remove();
              const reset = clone.outerHTML === before;
              enable();
              await frame();
              window.contentInstance.destroy();
              await frame();
              rows.push({
                reset,
                destroy: document.documentElement.outerHTML === before,
                listeners: records.length,
                sheets:
                  document.adoptedStyleSheets.length === sheets.length &&
                  sheets.every(
                    (sheet, index) =>
                      document.adoptedStyleSheets[index] === sheet,
                  ),
              });
            }
            return { fallback, rows, adds, removes };
          } finally {
            EventTarget.prototype.addEventListener = add;
            EventTarget.prototype.removeEventListener = remove;
          }
        },
        { state: ALL_FEATURES, fallback },
      );
      expect(result.rows).toEqual([
        { reset: true, destroy: true, listeners: 0, sheets: true },
        { reset: true, destroy: true, listeners: 0, sheets: true },
      ]);
      expect(result.adds).toBe(result.removes);
      console.log('NAVIGATION_LIFECYCLE', browserName, JSON.stringify(result));
    },
  );

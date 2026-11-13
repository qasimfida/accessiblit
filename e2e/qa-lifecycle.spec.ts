import { expect, test } from '@playwright/test';
import { loadQA } from './helpers/qa';

test('two hundred lifecycles restore the host and release listeners', async ({
  page,
}, info) => {
  const errors = await loadQA(page, 'plain', 'standard');
  const result = await page.evaluate(() => {
    window.qaInstance.destroy();
    const snapshot = () => ({
      body: document.body.outerHTML,
      head: document.head.outerHTML,
      html: [...document.documentElement.attributes].map((a) => [
        a.name,
        a.value,
      ]),
      sheets: [...document.adoptedStyleSheets],
    });
    const before = snapshot();
    const add = EventTarget.prototype.addEventListener;
    const remove = EventTarget.prototype.removeEventListener;
    const live: {
      target: EventTarget;
      type: string;
      callback: EventListenerOrEventListenerObject;
      capture: boolean;
    }[] = [];
    let additions = 0,
      removals = 0;
    EventTarget.prototype.addEventListener = function (
      type,
      callback,
      options,
    ) {
      if (callback) {
        live.push({
          target: this,
          type,
          callback,
          capture: typeof options === 'boolean' ? options : !!options?.capture,
        });
        additions++;
      }
      return add.call(this, type, callback, options);
    };
    EventTarget.prototype.removeEventListener = function (
      type,
      callback,
      options,
    ) {
      const capture =
        typeof options === 'boolean' ? options : !!options?.capture;
      const index = live.findIndex(
        (row) =>
          row.target === this &&
          row.type === type &&
          row.callback === callback &&
          row.capture === capture,
      );
      if (index >= 0) {
        live.splice(index, 1);
        removals++;
      }
      return remove.call(this, type, callback, options);
    };
    const times: number[] = [];
    const residue: number[] = [];
    try {
      for (let i = 0; i < 200; i++) {
        const start = performance.now();
        const instance = window.qaInit({ persist: false });
        times.push(performance.now() - start);
        instance.open();
        instance.destroy();
        residue.push(live.length);
      }
    } finally {
      EventTarget.prototype.addEventListener = add;
      EventTarget.prototype.removeEventListener = remove;
    }
    const after = snapshot();
    return {
      times,
      additions,
      removals,
      residue,
      restored: JSON.stringify(before) === JSON.stringify(after),
      sameSheets:
        before.sheets.length === after.sheets.length &&
        before.sheets.every((sheet, i) => sheet === after.sheets[i]),
    };
  });
  expect(result.restored).toBe(true);
  expect(result.sameSheets).toBe(true);
  expect(result.additions).toBeGreaterThan(0);
  expect(result.removals).toBe(result.additions);
  expect(result.residue.every((count) => count === 0)).toBe(true);
  expect(Math.max(...result.times)).toBeLessThan(50);
  expect(errors).toEqual([]);
  console.log('QA_LIFECYCLE', info.project.name, JSON.stringify(result));
});

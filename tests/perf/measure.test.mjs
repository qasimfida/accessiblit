import assert from 'node:assert/strict';
import test from 'node:test';
import { measureInit } from '../../scripts/perf/measure.mjs';

test('five warmups and thirty samples time init only and clean up every run', async (t) => {
  let clock = 0,
    calls = 0,
    mounted = false;
  const originals = ['document', 'Accessiblit', 'requestAnimationFrame'].map(
    (key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)],
  );
  t.mock.method(globalThis.performance, 'now', () => clock);
  Object.assign(globalThis, {
    document: { querySelector: () => mounted },
    requestAnimationFrame: (callback) => {
      clock += 20;
      callback();
    },
    Accessiblit: {
      destroy() {
        clock += 100;
        mounted = false;
      },
      init() {
        clock += 2;
        calls++;
        mounted = true;
        return {
          destroy() {
            clock += 100;
            mounted = false;
          },
        };
      },
    },
  });
  try {
    const result = await measureInit();
    assert.deepEqual(result.warmups, Array(5).fill(2));
    assert.deepEqual(result.samples, Array(30).fill(2));
    assert.equal(calls, 35);
    assert.equal(mounted, false);
  } finally {
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
});

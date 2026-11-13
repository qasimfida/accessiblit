import { expect, test } from '@playwright/test';
import { loadQA } from './helpers/qa';
test('post-GC heap has no detectable growth trend across 200 lifecycles', async ({
  page,
  browserName,
}, info) => {
  test.skip(
    browserName !== 'chromium',
    'Precise forced-GC heap measurements require CDP; lifecycle and listener assertions run in all five projects.',
  );
  test.setTimeout(120000);
  const errors = await loadQA(page, 'plain', 'standard');
  await page.evaluate(() => {
    window.qaInstance.destroy();
    Reflect.deleteProperty(window, 'qaInstance');
  });
  const session = await page.context().newCDPSession(page);
  // Install once: repeated Playwright evaluation wrappers would themselves enter the measured heap.
  await page.evaluate(() => {
    const WeakReference = Reflect.get(globalThis, 'WeakRef') as new (
      target: object,
    ) => { deref(): object | undefined };
    let references: { deref(): object | undefined }[] = [];
    Reflect.set(globalThis, 'qaCycle', async () => {
      references = [];
      for (let i = 0; i < 40; i++) {
        const instance = window.qaInit({ persist: false });
        references.push(
          new WeakReference(instance),
          new WeakReference(document.querySelector('[data-accessiblit-host]')!),
        );
        instance.open();
        instance.destroy();
        if (i % 5 === 4)
          await new Promise<void>((resolve) =>
            requestAnimationFrame(() => resolve()),
          );
      }
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
    });
    Reflect.set(globalThis, 'qaCollectReferences', () => {
      const count = references.filter(
        (reference) => reference.deref() !== undefined,
      ).length;
      references = [];
      return count;
    });
  });
  const cycle = () =>
    session.send('Runtime.evaluate', {
      expression: 'qaCycle()',
      awaitPromise: true,
      returnByValue: true,
    });
  const sample = async () => {
    await session.send('HeapProfiler.collectGarbage');
    const references = await session.send('Runtime.evaluate', {
      expression: 'qaCollectReferences()',
      returnByValue: true,
    });
    await session.send('HeapProfiler.collectGarbage');
    const heap = await session.send('Runtime.getHeapUsage');
    const dom = await session.send('Memory.getDOMCounters');
    return {
      bytes: heap.usedSize,
      nodes: dom.nodes,
      listeners: dom.jsEventListeners,
      retained: references.result.value as number,
    };
  };
  // Warm the complete measurement path, including GC and weak-reference inspection.
  for (let i = 0; i < 25; i++) {
    await cycle();
    await sample();
  }
  const rows: (Awaited<ReturnType<typeof sample>> & { cycles: number })[] = [];
  for (const cycles of [0, 40, 80, 120, 160, 200]) {
    if (cycles) await cycle();
    rows.push({ cycles, ...(await sample()) });
  }
  const retained = rows.map((row) => row.retained);
  // A positive lower 95% confidence bound identifies a sustained trend, rather than GC noise.
  const mean = rows.reduce((sum, row) => sum + row.bytes, 0) / rows.length;
  const xx = rows.reduce((sum, row) => sum + (row.cycles - 100) ** 2, 0);
  const slope =
    rows.reduce(
      (sum, row) => sum + (row.cycles - 100) * (row.bytes - mean),
      0,
    ) / xx;
  const residual = rows.reduce(
    (sum, row) => sum + (row.bytes - mean - slope * (row.cycles - 100)) ** 2,
    0,
  );
  const standardError = Math.sqrt(residual / (rows.length - 2) / xx);
  const lower95 = slope - 2.776445 * standardError;
  console.log(
    'QA_HEAP',
    info.project.name,
    JSON.stringify({
      warmup: 1000,
      retained,
      rows,
      slopeBytesPerCycle: slope,
      standardError,
      lower95,
    }),
  );
  expect(retained.every((count) => count === 0)).toBe(true);
  expect(lower95).toBeLessThanOrEqual(0);
  expect(
    rows.every(
      (row) =>
        row.nodes === rows[0]!.nodes && row.listeners === rows[0]!.listeners,
    ),
  ).toBe(true);
  expect(await page.locator('[data-accessiblit-host]').count()).toBe(0);
  expect(errors).toEqual([]);
  await session.detach();
});

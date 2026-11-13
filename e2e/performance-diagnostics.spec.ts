import { expect, test } from '@playwright/test';
import { cpus, platform, arch } from 'node:os';
import { loadContent } from './helpers/content';
import { PERFORMANCE_TRACE } from './helpers/performance';

test.use({ trace: PERFORMANCE_TRACE });

// Native CSS is a lower bound, not a replacement for the unchanged feature budgets.
for (const feature of ['fontSize', 'wordSpacing'] as const)
  for (const native of [true, false])
    test(`diagnose ${feature} with ${native ? 'native CSS' : 'the engine'}`, async ({
      page,
    }, info) => {
      await loadContent(page, 'article');
      const { rows, baseline } = await page.evaluate(
        async ({ feature, native }) => {
          const original = getComputedStyle(document.querySelector('main p')!);
          const baseline = {
            fontSize: original.fontSize,
            wordSpacing: original.wordSpacing,
          };
          if (native) window.contentInstance.destroy();
          const main = document.querySelector('main')!;
          const fragment = document.createDocumentFragment();
          for (let i = 0; i < 5000; i++) {
            const p = document.createElement('p');
            p.textContent = `Readable text ${i}`;
            fragment.append(p);
          }
          main.replaceChildren(fragment);
          const root = document.documentElement;
          if (native) {
            const style = document.createElement('style');
            style.textContent =
              'html.qa-native main p{' +
              (feature === 'fontSize'
                ? 'font-size:22.4px!important'
                : 'word-spacing:0.32em!important') +
              '}';
            document.head.append(style);
          }
          const enabled = feature === 'fontSize' ? 140 : 0.32;
          const disabled = feature === 'fontSize' ? 100 : 0;
          const rows = [];
          for (const on of [true, false, true, false]) {
            // The cold row includes fixture layout; settled rows start after its paint.
            if (rows.length) {
              await new Promise(requestAnimationFrame);
              await new Promise(requestAnimationFrame);
            }
            const start = performance.now();
            if (native) root.classList.toggle('qa-native', on);
            else
              window.contentInstance.setFeature(
                feature,
                on ? enabled : disabled,
              );
            const synchronous = performance.now() - start;
            const layoutStart = performance.now();
            const height = main.getBoundingClientRect().height;
            const layout = performance.now() - layoutStart;
            await new Promise(requestAnimationFrame);
            const nextFrame = performance.now() - start;
            const first = getComputedStyle(main.firstElementChild!);
            const last = getComputedStyle(main.lastElementChild!);
            const property =
              feature === 'fontSize' ? 'fontSize' : 'wordSpacing';
            rows.push({
              on,
              synchronous,
              layout,
              nextFrame,
              height,
              first: first[property],
              last: last[property],
              paragraphs: main.children.length,
            });
          }
          return { rows, baseline };
        },
        { feature, native },
      );
      for (const row of rows) {
        expect(row.paragraphs).toBe(5000);
        expect(row.height).toBeGreaterThan(0);
        expect(row.first).toBe(row.last);
        if (row.on)
          expect(parseFloat(row.first)).toBeCloseTo(
            feature === 'fontSize' ? 22.4 : 5.12,
            1,
          );
        else expect(row.first).toBe(baseline[feature]);
      }
      console.log(
        'PERFORMANCE_DIAGNOSTIC',
        JSON.stringify({
          project: info.project.name,
          feature,
          native,
          platform: platform(),
          architecture: arch(),
          cpu: cpus()[0]?.model,
          logicalCpus: cpus().length,
          rows,
        }),
      );
    });

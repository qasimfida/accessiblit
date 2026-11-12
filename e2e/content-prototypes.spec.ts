import { expect, test } from '@playwright/test';
import { loadContent } from './helpers/content';

const rootSelector = ':is(html,#accessiblit-a#accessiblit-b#accessiblit-c)';
const textSelector = 'main h1,main h2,main p,main span,main strong';

test('compares root font sizing with measured pixel baselines', async ({
  page,
  browserName,
}) => {
  const evidence = [];
  for (const fixture of ['legacy-px', 'rem']) {
    await loadContent(page, fixture);
    const baseline = await page
      .locator(textSelector)
      .evaluateAll((nodes) =>
        nodes.map((node) => parseFloat(getComputedStyle(node).fontSize)),
      );
    await page.addStyleTag({
      content: `${rootSelector}{font-size:200%!important}`,
    });
    const root = await page
      .locator(textSelector)
      .evaluateAll((nodes) =>
        nodes.map((node) => parseFloat(getComputedStyle(node).fontSize)),
      );
    for (let index = 0; index < baseline.length; index++)
      expect(root[index]).toBeCloseTo(
        baseline[index]! * (fixture === 'rem' ? 2 : 1),
        3,
      );
    await loadContent(page, fixture);
    const measured = await page.evaluate(
      ({ selector, rootSelector }) => {
        const nodes = [...document.querySelectorAll<HTMLElement>(selector)];
        const before = nodes.map((node) =>
          parseFloat(getComputedStyle(node).fontSize),
        );
        nodes.forEach((node, index) =>
          node.setAttribute('data-prototype-font', String(index)),
        );
        document.documentElement.classList.add('prototype-font');
        document.documentElement.style.setProperty(
          '--prototype-font-scale',
          '2',
        );
        const style = document.createElement('style');
        style.textContent = before
          .map(
            (size, index) =>
              `${rootSelector}.prototype-font [data-prototype-font="${index}"]{font-size:calc(${size}px * var(--prototype-font-scale))!important}`,
          )
          .join('\n');
        document.head.append(style);
        return {
          before,
          after: nodes.map((node) =>
            parseFloat(getComputedStyle(node).fontSize),
          ),
        };
      },
      { selector: textSelector, rootSelector },
    );
    for (let index = 0; index < measured.before.length; index++)
      expect(measured.after[index]).toBeCloseTo(measured.before[index]! * 2, 3);
    evidence.push({ fixture, baseline, root, measured });
  }
  console.log('FONT_PROTOTYPE', browserName, JSON.stringify(evidence));
});

test('compares zoom and transform with fixed and sticky elements', async ({
  page,
  browserName,
}) => {
  const evidence = [];
  for (const strategy of ['zoom', 'transform']) {
    await loadContent(page, 'fixed-header');
    const baseline = await page.locator('#fixed-header').boundingBox();
    await page.addStyleTag({
      content:
        strategy === 'zoom'
          ? `${rootSelector}{zoom:2!important}`
          : `${rootSelector}{transform:scale(2)!important;transform-origin:0 0!important;inline-size:50%!important}`,
    });
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
    );
    const before = await page.locator('#fixed-header').boundingBox();
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    const header = (await page.locator('#fixed-header').boundingBox())!;
    const sticky = (await page.locator('#sticky-note').boundingBox())!;
    const scroll = await page.evaluate(() => ({
      x: scrollX,
      y: scrollY,
      width: innerWidth,
      height: innerHeight,
    }));
    if (strategy === 'zoom') {
      expect(header.y).toBeCloseTo(0, 1);
      expect(sticky.y).toBeGreaterThanOrEqual(header.y + header.height);
    } else expect(header.y).toBeLessThan(0);
    evidence.push({ strategy, baseline, before, header, sticky, scroll });
  }
  console.log('SCALE_PROTOTYPE', browserName, JSON.stringify(evidence));
});

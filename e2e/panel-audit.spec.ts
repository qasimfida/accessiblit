import { mkdir, writeFile } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { format, resolveConfig } from 'prettier';
import { uiEvidence } from './helpers/ui-evidence';

const formatting = await resolveConfig(
  new URL('../package.json', import.meta.url).pathname,
);
const folder = new URL('../reports/assets/phase-2/', import.meta.url);

test('records panel performance, zero residue, states and semantics', async ({
  page,
  browserName,
}) => {
  await page.goto('/panel.html');
  await page.waitForFunction(() => !!window.panelInstance);
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  const lifecycle = await page.evaluate(async () => {
    window.panelInstance.destroy();
    const before = document.documentElement.outerHTML;
    const positions = () =>
      [...document.querySelectorAll('main,main h1,main p,main button')].map(
        (e) => e.getBoundingClientRect().toJSON(),
      );
    const original = positions();
    const supported =
      PerformanceObserver.supportedEntryTypes.includes('layout-shift');
    let shift = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries())
        shift += (entry as PerformanceEntry & { value: number }).value;
    });
    if (supported) observer.observe({ type: 'layout-shift' });
    const frame = () =>
      new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const times: number[] = [];
    let unmoved = true;
    for (let i = 0; i < 10; i++) {
      const start = performance.now();
      const instance = window.panelFixture.init({ persist: false });
      times.push(performance.now() - start);
      instance.open();
      await frame();
      unmoved &&= JSON.stringify(positions()) === JSON.stringify(original);
      instance.close();
      await frame();
      instance.setFeature('fontSize', 120);
      instance.reset();
      instance.destroy();
      await frame();
    }
    for (const entry of observer.takeRecords())
      shift += (entry as PerformanceEntry & { value: number }).value;
    observer.disconnect();
    const after = document.documentElement.outerHTML;
    const restored = before === after;
    window.panelInstance = window.panelFixture.init({ persist: false });
    return { times, unmoved, restored, cls: supported ? shift : null };
  });
  expect(Math.max(...lifecycle.times)).toBeLessThan(50);
  expect(lifecycle.restored).toBe(true);
  expect(lifecycle.unmoved).toBe(true);
  if (lifecycle.cls !== null) expect(lifecycle.cls).toBe(0);
  await page.keyboard.press('Alt+KeyA');
  const panel = page.getByRole('dialog', { name: 'Accessibility options' });
  await expect(panel).toBeVisible();
  async function maximise(target = page) {
    for (const [id, value] of [
      ['fontSize', 200],
      ['textAlign', 'right'],
      ['darkMode', true],
      ['focusHighlight', true],
    ] as const)
      await target.evaluate(
        ([id, value]) => window.panelInstance.setFeature(id, value),
        [id, value] as const,
      );
  }
  await maximise();
  await page.getByRole('button', { name: 'Reset all', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('All options reset.');
  await page.emulateMedia({ colorScheme: 'light', forcedColors: 'none' });
  await page.getByRole('button', { name: 'Close', exact: true }).focus();
  const semantics = await page.locator('body').ariaSnapshot();
  expect(semantics).toContain('dialog "Accessibility options"');
  if (process.env.ACCESSIBLIT_AUDIT_WRITE === '1') {
    await mkdir(folder, { recursive: true });
    await page.screenshot({
      path: new URL(`${browserName}-desktop.png`, folder).pathname,
    });
    await page.setViewportSize({ width: 320, height: 256 });
    await page.keyboard.press('Alt+KeyA'); // close before reopening at the small viewport
    await page.keyboard.press('Alt+KeyA');
    await page.screenshot({
      path: new URL(`${browserName}-320.png`, folder).pathname,
    });
  }
  // Keep independent audit tools on separate pages: combining their traversals crashes Firefox.
  const auditPage = await page.context().newPage();
  await auditPage.goto(new URL('/panel.html', page.url()).href);
  await auditPage.waitForFunction(() => !!window.panelInstance);
  auditPage.on('request', (request) => requests.push(request.url()));
  await auditPage.keyboard.press('Alt+KeyA');
  await maximise(auditPage);
  const states = [];
  for (const forcedColors of ['none', 'active'] as const) {
    await auditPage.emulateMedia({ colorScheme: 'dark', forcedColors });
    const result = await new AxeBuilder({ page: auditPage }).analyze();
    expect(result.violations).toEqual([]);
    const measurements = await uiEvidence(auditPage);
    expect(
      Math.min(...measurements.text.map((t) => t.ratio)),
    ).toBeGreaterThanOrEqual(4.5);
    for (const boundary of measurements.boundaries)
      expect(boundary.ratio, boundary.name).toBeGreaterThanOrEqual(3);
    states.push({
      forcedColors,
      violations: result.violations.length,
      measurements,
    });
  }
  await auditPage.close();
  if (process.env.ACCESSIBLIT_AUDIT_WRITE === '1') {
    await writeFile(
      new URL(`${browserName}-audit.json`, folder),
      await format(
        JSON.stringify({ browserName, lifecycle, requests, states }),
        {
          ...formatting,
          parser: 'json',
        },
      ),
    );
    await writeFile(
      new URL(`${browserName}-semantics.md`, folder),
      await format(
        `# ${browserName} semantic tree\n\n\`\`\`yaml\n${semantics}\n\`\`\`\n`,
        { ...formatting, parser: 'markdown' },
      ),
    );
  }
  expect(requests).toEqual([]);
  console.log('PANEL_AUDIT', browserName, JSON.stringify(lifecycle));
});

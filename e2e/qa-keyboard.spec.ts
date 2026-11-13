import { mkdir, writeFile } from 'node:fs/promises';
import { format } from 'prettier';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { FEATURE_IDS, DEFAULT_STATE } from '../src/core/schema';
import { loadQA, QA_PROFILES } from './helpers/qa';
for (const profile of QA_PROFILES)
  test(`keyboard changes all eighteen features in ${profile}`, async ({
    page,
    browserName,
  }, info) => {
    test.setTimeout(120000);
    const errors = await loadQA(page, 'plain', profile);
    const tab =
      browserName === 'webkit' && process.platform === 'darwin'
        ? 'Alt+Tab'
        : 'Tab';
    await page.keyboard.press('Alt+KeyA');
    const dialog = page.getByRole('dialog', { name: 'Accessibility options' });
    await expect(
      dialog.getByRole('button', { name: 'Close', exact: true }),
    ).toBeFocused();
    const changed = new Set<string>(),
      path: string[] = ['Close'];
    for (let step = 0; step < 45; step++) {
      await page.keyboard.press(tab);
      const active = await page.evaluate((ids) => {
        const root = document.querySelector(
            '[data-accessiblit-host]',
          )!.shadowRoot!,
          e = root.activeElement;
        if (!e) return null;
        const label = e.closest('.accessiblit-feature')?.querySelector('h4');
        return {
          id: ids.find((id) => label?.id.endsWith(`-${id}-label`)),
          radio: e.matches('input[type=radio]'),
          disabled: e.getAttribute('aria-disabled') === 'true',
          name: e.getAttribute('aria-label') ?? e.textContent,
        };
      }, FEATURE_IDS);
      expect(active).not.toBeNull();
      path.push(active!.id ?? active!.name ?? 'unknown');
      if (active!.name === 'Reset all') break;
      if (active!.id && !active!.disabled && !changed.has(active!.id)) {
        await page.keyboard.press(active!.radio ? 'ArrowDown' : 'Space');
        const id = active!.id;
        await expect
          .poll(() =>
            page.evaluate(
              (id) => window.qaChanges.some((e) => e.id === id),
              id,
            ),
          )
          .toBe(true);
        changed.add(id);
        await expect(page.getByRole('status')).not.toHaveText('');
        expect(
          (
            await new AxeBuilder({ page })
              .include('[data-accessiblit-host]')
              .analyze()
          ).violations,
        ).toEqual([]);
        await page.bringToFront();
        const box = await page.evaluate(() => {
          const r = document.querySelector(
              '[data-accessiblit-host]',
            )!.shadowRoot!,
            e = r.activeElement!,
            p = r.querySelector('[role=dialog]')!;
          return {
            focus: e.getBoundingClientRect().toJSON(),
            panel: p.getBoundingClientRect().toJSON(),
          };
        });
        expect(box.focus.top).toBeGreaterThanOrEqual(box.panel.top);
        expect(box.focus.bottom).toBeLessThanOrEqual(box.panel.bottom);
      }
    }
    expect([...changed].sort()).toEqual([...FEATURE_IDS].sort());
    if (process.env.ACCESSIBLIT_KEYBOARD_EVIDENCE && profile === 'standard') {
      const folder = new URL('../reports/assets/phase-7/', import.meta.url);
      await mkdir(folder, { recursive: true });
      await page.screenshot({
        path: new URL(`${info.project.name}-keyboard.png`, folder).pathname,
      });
      await writeFile(
        new URL(`${info.project.name}-keyboard.json`, folder),
        await format(
          JSON.stringify({
            project: info.project.name,
            path,
            changed: [...changed],
            semantics: await page.locator('body').ariaSnapshot(),
          }),
          { parser: 'json' },
        ),
      );
    }

    await expect(
      dialog.getByRole('button', { name: 'Reset all', exact: true }),
    ).toBeFocused();
    await page.keyboard.press('Space');
    expect(await page.evaluate(() => window.qaInstance.getState())).toEqual(
      DEFAULT_STATE,
    );
    await expect(page.getByRole('status')).toHaveText('All options reset.');
    await page.keyboard.press('Escape');
    await expect(
      page.getByRole('button', { name: 'Open accessibility options' }),
    ).toBeFocused();
    await page.keyboard.press('Alt+KeyA');
    let outside = false;
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press(tab);
      outside = await page.evaluate(
        () =>
          document.activeElement?.id === 'before' ||
          document.activeElement?.id === 'after',
      );
      if (outside) break;
    }
    expect(outside).toBe(true);
    expect(errors).toEqual([]);
    console.log(
      'QA_KEYBOARD',
      info.project.name,
      profile,
      JSON.stringify({ changed: [...changed], path, outside }),
    );
  });

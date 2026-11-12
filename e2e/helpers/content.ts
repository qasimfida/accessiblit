import type { Page } from '@playwright/test';
import type { AccessiblitInstance } from '../../src/core/types';
import type { init } from '../../src/index';

declare global {
  interface Window {
    contentInstance: AccessiblitInstance;
    contentInit: typeof init;
  }
}
/** One list ensures each content feature is checked against every requested host layout. */
export const CONTENT_FIXTURES = [
  'article',
  'legacy-px',
  'rem',
  'flex',
  'table',
  'form',
  'fixed-header',
] as const;
/** Use the public entry so fixture tests exercise the shipped registry and lifecycle. */
export async function loadContent(page: Page, name: string): Promise<void> {
  await page.goto(`/${name}.html`);
  await page.waitForFunction(() => !!window.contentInstance);
}

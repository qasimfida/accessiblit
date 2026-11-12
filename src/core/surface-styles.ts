import { createSheet } from './sheet';
type Entry = {
  sheet: ReturnType<typeof createSheet>;
  rules: Map<symbol, string>;
};
const owners = new WeakMap<ShadowRoot, Entry>();
/** High-frequency private positioning must not invalidate the document's page-adjustment stylesheet. */
export function createSurfaceRule(root: ShadowRoot, nonce?: string) {
  let entry = owners.get(root);
  if (!entry) {
    entry = { sheet: createSheet(root, nonce), rules: new Map() };
    owners.set(root, entry);
  }
  const owned = entry,
    token = Symbol();
  owned.rules.set(token, '');
  let active = true;
  const render = () => owned.sheet.set([...owned.rules.values()].join('\n'));
  return {
    set(css: string): void {
      if (active && owned.rules.get(token) !== css) {
        owned.rules.set(token, css);
        render();
      }
    },
    destroy(): void {
      if (!active) return;
      active = false;
      owned.rules.delete(token);
      if (owned.rules.size) render();
      else {
        owned.sheet.destroy();
        owners.delete(root);
      }
    },
  };
}

import { createSheet } from './sheet';

const CSS =
  ':host{all:initial!important;position:fixed!important;inset-block-start:0!important;inset-inline-start:0!important;inline-size:0!important;block-size:0!important;pointer-events:none!important}.accessiblit-announcer{position:absolute;inline-size:1px;block-size:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0}';

/** A separate task lets assistive technology notice repeated identical messages. */
export function createAnnouncer(root: ShadowRoot, nonce?: string) {
  const sheet = createSheet(root, nonce);
  const region = root.ownerDocument.createElement('div');
  region.className = 'accessiblit-announcer';
  region.setAttribute('role', 'status');
  region.setAttribute('aria-live', 'polite');
  region.setAttribute('aria-atomic', 'true');
  let active = true;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    sheet.set(CSS);
    root.appendChild(region);
  } catch (error) {
    sheet.destroy();
    region.remove();
    throw error;
  }
  return {
    announce(message: string): void {
      if (!active || typeof message !== 'string') return;
      if (timer !== undefined) clearTimeout(timer);
      region.textContent = '';
      if (!message) return;
      timer = setTimeout(() => {
        timer = undefined;
        region.textContent = message.slice(0, 512);
      }, 0);
    },
    destroy(): void {
      active = false;
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
      region.remove();
      sheet.destroy();
    },
  };
}

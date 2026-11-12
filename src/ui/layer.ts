import { createReporter } from '../core/diagnostics';

/** Manual popovers escape ancestor painting effects without a modal backdrop or focus trap. */
export function createLayer(element: HTMLElement) {
  const report = createReporter();
  let native =
    typeof element.showPopover === 'function' &&
    typeof element.hidePopover === 'function';
  let visible = false;
  let active = true;
  if (native) element.setAttribute('popover', 'manual');
  const fallback = () => {
    native = false;
    element.removeAttribute('popover');
    report('popover', 'Top layer unavailable; using fixed positioning.');
  };
  const hide = () => {
    if (native && visible) {
      try {
        element.hidePopover();
      } catch {
        fallback();
      }
    }
    visible = false;
    element.hidden = true;
  };
  return {
    show(): void {
      if (!active || visible) return;
      element.hidden = false;
      if (native) {
        try {
          element.showPopover();
        } catch {
          fallback();
        }
      }
      visible = true;
    },
    hide,
    get native(): boolean {
      return native;
    },
    destroy(): void {
      hide();
      active = false;
      element.removeAttribute('popover');
    },
  };
}

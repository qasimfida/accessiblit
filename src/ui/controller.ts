import { createReporter } from '../core/diagnostics';
import { createScope } from '../core/scope';
import { createSheet } from '../core/sheet';
import { createPanel } from './panel';
import { createLauncher } from './launcher';
import { createLayer } from './layer';
import { matchesShortcut } from './keyboard';
import { placeUI } from './placement';
import { UI_CSS, positionCSS } from './styles';
import type { PanelActions } from './panel';
import type { ResolvedOptions } from '../core/options';
import type { Feature, FeatureId } from '../core/types';

/** A non-modal controller owns focus, viewport placement and all temporary browser resources. */
export function createUI(
  root: ShadowRoot,
  features: readonly Feature[],
  options: ResolvedOptions,
  actions: Omit<PanelActions, 'close'>,
  prefix: string,
) {
  const doc = root.ownerDocument;
  const browserWindow = doc.defaultView;
  if (!browserWindow) throw new Error('UI needs a browser Window');
  const view = browserWindow;
  const report = createReporter();
  const scope = createScope(() => report('ui', 'UI cleanup failed.'));
  let opened = false;
  let zoom = 1;
  let lastCSS = '';
  try {
    const sheet = createSheet(root, options.nonce);
    scope.add(sheet.destroy);
    const panel = createPanel(doc, features, options.messages, prefix, {
      ...actions,
      close: () => close(),
    });
    scope.add(panel.destroy);
    const launcher = createLauncher(
      doc,
      options.messages,
      panel.element.id,
      () => toggle(),
    );
    scope.add(launcher.destroy);
    const launcherLayer = createLayer(launcher.element);
    scope.add(launcherLayer.destroy);
    const panelLayer = createLayer(panel.element);
    scope.add(panelLayer.destroy);
    const viewport = () => ({
      width: view.visualViewport?.width ?? view.innerWidth,
      height: view.visualViewport?.height ?? view.innerHeight,
      left: view.visualViewport?.offsetLeft ?? 0,
      top: view.visualViewport?.offsetTop ?? 0,
      layoutWidth: view.innerWidth,
      layoutHeight: view.innerHeight,
    });
    const draw = (position: ReturnType<typeof placeUI>) => {
      const css = UI_CSS + positionCSS(position, zoom);
      if (css !== lastCSS) {
        sheet.set(css);
        lastCSS = css;
      }
    };
    function keepFocusVisible(target: HTMLElement) {
      const bounds = panel.element.getBoundingClientRect();
      const focus = target.getBoundingClientRect();
      if (focus.top < bounds.top + 10)
        panel.element.scrollTop -= bounds.top + 10 - focus.top;
      else if (focus.bottom > bounds.bottom - 10)
        panel.element.scrollTop += focus.bottom - bounds.bottom + 10;
    }
    function refresh() {
      if (!scope.active) return;
      const position = placeUI(viewport(), options);
      draw(position);
      const focused = doc.activeElement;
      if (
        !opened &&
        focused instanceof view.Element &&
        focused !== root.host &&
        focused !== doc.body &&
        focused !== doc.documentElement
      ) {
        const box = focused.getBoundingClientRect();
        const focusStyle = view.getComputedStyle(focused);
        // Outward host outlines need protection even when the control boxes do not intersect.
        const ring = Math.max(
          6,
          (parseFloat(focusStyle.outlineWidth) || 0) +
            Math.max(0, parseFloat(focusStyle.outlineOffset) || 0),
        );
        const overlap =
          box.left - ring < position.launcherLeft + 48 &&
          box.right + ring > position.launcherLeft &&
          box.top - ring < position.launcherTop + 48 &&
          box.bottom + ring > position.launcherTop;
        if (overlap) launcherLayer.hide();
        else launcherLayer.show();
      } else launcherLayer.show();
      const width = launcher.element.getBoundingClientRect().width;
      // CSS zoom still affects top-layer boxes. Cancel only measured author zoom, not browser zoom.
      if (width > 0 && Math.abs(width - 48) > 0.1) {
        zoom = Math.max(0.01, Math.min(100, (zoom * 48) / width));
        draw(position);
      }
    }
    function open() {
      if (!scope.active || opened) return;
      opened = true;
      launcherLayer.show();
      panelLayer.show();
      launcher.update(true);
      refresh();
      panel.element.scrollTop = 0;
      panel.closeButton.focus({ preventScroll: true });
      keepFocusVisible(panel.closeButton);
    }
    function close(returnFocus = true) {
      if (!scope.active || !opened) return;
      opened = false;
      panelLayer.hide();
      launcher.update(false);
      if (returnFocus) {
        launcherLayer.show();
        launcher.element.focus({ preventScroll: true });
      }
      refresh();
    }
    function toggle() {
      if (opened) close();
      else open();
    }
    draw(placeUI(viewport(), options));
    root.append(launcher.element, panel.element);
    refresh();
    scope.listen(
      doc,
      'keydown',
      (event) => {
        const key = event as KeyboardEvent;
        if (opened && key.code === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          close();
        } else if (matchesShortcut(key, options.shortcut)) {
          event.preventDefault();
          event.stopPropagation();
          toggle();
        }
      },
      { capture: true },
    );
    scope.listen(doc, 'focusin', (event) => {
      if (event.composedPath().includes(root)) {
        const focused = root.activeElement;
        if (
          focused instanceof view.HTMLElement &&
          panel.element.contains(focused)
        )
          keepFocusVisible(focused);
      } else {
        close(false);
        refresh();
      }
    });
    scope.listen(doc, 'focusout', (event) => {
      // Safari pointer activation can transiently clear focus before the click arrives.
      if ((event as FocusEvent).relatedTarget === null && !opened)
        launcherLayer.show();
    });
    scope.listen(doc, 'scroll', refresh, { capture: true, passive: true });
    scope.listen(view, 'resize', refresh);
    if (view.visualViewport) {
      scope.listen(view.visualViewport, 'resize', refresh);
      scope.listen(view.visualViewport, 'scroll', refresh);
    }
    const observer = new view.MutationObserver(refresh);
    observer.observe(doc.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style', 'dir'],
    });
    observer.observe(doc.body, {
      attributes: true,
      attributeFilter: ['class', 'style', 'dir'],
    });
    scope.add(() => observer.disconnect());
    return {
      open,
      close: () => close(),
      toggle,
      get isOpen(): boolean {
        return opened;
      },
      update(state: Record<FeatureId, unknown>) {
        if (scope.active) {
          panel.update(state);
          refresh();
        }
      },
      destroy(): void {
        opened = false;
        scope.dispose();
      },
    };
  } catch (error) {
    scope.dispose();
    throw error;
  }
}

/** Lifecycle integration uses this derived contract without adding public runtime exports. */
export type PanelUI = ReturnType<typeof createUI>;

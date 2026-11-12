import type { Cleanup, FeatureApi } from '../core/types';
import { createSurfaceRule } from '../core/surface-styles';
import { createReporter } from '../core/diagnostics';
import { createLayer } from '../ui/layer';
import { createEffect } from './effect';
type Kind = 'guide' | 'mask';
function mount(
  api: FeatureApi,
  root: ShadowRoot,
  nonce: string | undefined,
  kind: Kind,
): Cleanup {
  const doc = api.document,
    view = doc.defaultView;
  if (!view || typeof view.requestAnimationFrame !== 'function')
    return () => {};
  const scope = createEffect(api),
    report = createReporter();
  const node = doc.createElement('div');
  node.className = 'accessiblit-reading-' + kind;
  node.setAttribute('data-accessiblit-overlay', kind);
  node.setAttribute('aria-hidden', 'true');
  node.hidden = true;
  scope.add(() => node.remove());
  const sheet = createSurfaceRule(root, nonce);
  scope.add(sheet.destroy);
  const layer = createLayer(node);
  scope.add(layer.destroy);
  let frame: number | undefined,
    point = view.innerHeight / 2,
    focused: Element | undefined,
    zoom = 1;
  const panelOpen = () =>
    root.querySelector<HTMLElement>('[role="dialog"]')?.hidden === false;
  const css = (y: number, height: number) => `
.${node.className}{all:initial;display:block;position:fixed;inset:0 auto auto 0;margin:0;padding:0;border:0;box-sizing:border-box;inline-size:100vw;block-size:${height}px;zoom:${zoom};transform:translate3d(0,${y}px,0);pointer-events:none!important;user-select:none;z-index:2147482999;transition:none!important;animation:none!important;${kind === 'guide' ? 'background:#000;border-block:1px solid #fff;' : 'background:transparent;box-shadow:0 0 0 100vmax rgb(0 0 0 / var(--accessiblit-reading-mask-opacity));'}}
.${node.className}[hidden]{display:none!important}
.${node.className}::backdrop{background:transparent!important;pointer-events:none!important}
@media(forced-colors:active){.${node.className}{background:${kind === 'guide' ? 'CanvasText' : 'transparent'};border-color:Canvas;box-shadow:none;${kind === 'mask' ? 'outline:1px solid GrayText;' : ''}}}
@media print{.${node.className}{display:none!important}}`;
  const render = () => {
    frame = undefined;
    if (!scope.active) return;
    if (panelOpen()) {
      layer.hide();
      return;
    }
    try {
      const box = focused?.isConnected
        ? focused.getBoundingClientRect()
        : undefined;
      const height =
        kind === 'guide'
          ? 3
          : Math.min(view.innerHeight, Math.max(80, (box?.height ?? 0) + 16));
      const target = box
        ? kind === 'guide'
          ? box.bottom + 4
          : box.top + box.height / 2
        : point;
      const y = Math.max(
        0,
        Math.min(
          view.innerHeight - height,
          kind === 'guide' ? target : target - height / 2,
        ),
      );
      sheet.set(css(y, height));
      layer.show();
      const width = node.getBoundingClientRect().width;
      if (width > 0 && Math.abs(width - view.innerWidth) > 0.1) {
        zoom = Math.max(0.01, Math.min(100, (zoom * view.innerWidth) / width));
        sheet.set(css(y, height));
      }
    } catch {
      report(
        'frame',
        'A reading overlay could not update; page interaction remains available.',
      );
    }
  };
  const schedule = () => {
    if (scope.active && frame === undefined)
      frame = view.requestAnimationFrame(render);
  };
  const privateEvent = (event: Event) =>
    event.composedPath().includes(root.host) || panelOpen();
  const pointer = (event: Event) => {
    if (privateEvent(event)) {
      layer.hide();
      return;
    }
    const touch = (event as TouchEvent).touches?.[0];
    const y = touch?.clientY ?? (event as PointerEvent).clientY;
    if (!Number.isFinite(y)) return;
    point = y;
    focused = undefined;
    schedule();
  };
  const focus = (event: Event) => {
    if (privateEvent(event)) {
      focused = undefined;
      layer.hide();
      return;
    }
    focused = event.target instanceof view.Element ? event.target : undefined;
    schedule();
  };
  const listen = (
    target: EventTarget,
    type: string,
    listener: EventListener,
    options?: AddEventListenerOptions,
  ) => scope.add(api.listen(target, type, listener, options));
  try {
    root.append(node);
    for (const type of [
      'pointerdown',
      'pointermove',
      'touchstart',
      'touchmove',
    ])
      listen(doc, type, pointer, { passive: true });
    listen(doc, 'focusin', focus);
    listen(doc, 'scroll', schedule, { capture: true, passive: true });
    listen(view, 'resize', schedule);
    if (view.visualViewport) {
      listen(view.visualViewport, 'resize', schedule);
      listen(view.visualViewport, 'scroll', schedule);
    }
    const changes = new view.MutationObserver(schedule);
    changes.observe(doc.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style'],
    });
    const panelChanges = new view.MutationObserver((records) => {
      if (
        records.some(
          (r) => (r.target as Element).getAttribute('role') === 'dialog',
        )
      ) {
        if (panelOpen()) layer.hide();
        schedule();
      }
    });
    panelChanges.observe(root, {
      subtree: true,
      attributes: true,
      attributeFilter: ['hidden'],
    });
    scope.add(() => changes.disconnect());
    scope.add(() => panelChanges.disconnect());
    scope.add(() => {
      if (frame !== undefined) view.cancelAnimationFrame(frame);
      frame = undefined;
    });
    schedule();
    return scope.dispose;
  } catch (error) {
    scope.dispose();
    throw error;
  }
}
/** Pointer events coalesce into one private animation frame; root variables remain static during movement. */
export function applyReadingOverlay(api: FeatureApi, kind: Kind): Cleanup {
  const scope = createEffect(api);
  scope.add(api.styles.addClass('accessiblit-reading-' + kind));
  if (kind === 'mask')
    scope.add(
      api.styles.setVariable('--accessiblit-reading-mask-opacity', '0.04'),
    );
  scope.add(api.onHost((root, nonce) => mount(api, root, nonce, kind)));
  return scope.dispose;
}

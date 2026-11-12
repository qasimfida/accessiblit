import type { Feature } from '../core/types';
import { ROOT_SELECTOR } from './dom';
import { createEffect, cssEffect } from './effect';
import { createReporter } from '../core/diagnostics';
/** Pause CSS timelines and autoplay media without initiating playback or fetching resources on cleanup. */
export const stopAnimations: Feature = {
  id: 'stopAnimations',
  group: 'navigation',
  label: 'Stop animations',
  description:
    'Pause CSS animation and autoplay video; disable transitions and smooth scrolling.',
  control: { type: 'toggle' },
  apply(value, api) {
    if (value !== true) return () => {};
    const doc = api.document,
      view = doc.defaultView;
    if (!view) return () => {};
    const scope = createEffect(api),
      report = createReporter();
    const root = ROOT_SELECTOR + '.accessiblit-stop-animations';
    const elements =
      ':where(body,body *):not(:where([data-accessiblit-host],[data-accessiblit-host] *))';
    scope.add(
      cssEffect(
        api,
        'accessiblit-stop-animations',
        {},
        `${root},${root} ${elements},${root} ${elements}::before,${root} ${elements}::after{animation-play-state:paused!important;transition-property:none!important;transition-duration:0s!important;scroll-behavior:auto!important}`,
      ),
    );
    const pause = (node: EventTarget | null) => {
      if (
        node instanceof view.HTMLVideoElement &&
        node.autoplay &&
        !node.paused
      ) {
        try {
          node.pause();
        } catch {
          report('pause', 'An autoplay video could not be paused.');
        }
      }
    };
    const refresh = () =>
      doc.querySelectorAll('video[autoplay]').forEach(pause);
    scope.add(
      api.listen(doc, 'play', (event) => pause(event.target), {
        capture: true,
      }),
    );
    const observer = new view.MutationObserver(refresh);
    observer.observe(doc.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['autoplay'],
    });
    scope.add(() => observer.disconnect());
    refresh();
    return scope.dispose;
  },
};

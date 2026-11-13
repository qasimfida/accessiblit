import type { Cleanup, Feature } from '../core/types';
import { ROOT_SELECTOR } from './dom';
import { createEffect } from './effect';
import { createReporter } from '../core/diagnostics';
import { topClearance } from './focus-geometry';
/** Native focus-visible controls when to draw; two independent tones survive light and dark page surfaces. */
export const focusHighlight: Feature = {
  id: 'focusHighlight',
  group: 'navigation',
  label: 'Focus highlight',
  description:
    'Show a two-tone keyboard focus ring and avoid top-edge headers.',
  control: { type: 'toggle' },
  apply(value, api) {
    if (value !== true) return () => {};
    const doc = api.document,
      view = doc.defaultView;
    if (!view) return () => {};
    const scope = createEffect(api),
      report = createReporter();
    const owner =
      parseFloat(view.getComputedStyle(doc.documentElement).scrollPaddingTop) ||
      0;
    const root = ROOT_SELECTOR + '.accessiblit-focus-highlight';
    const page =
      ':where(body,body *):not(:where([data-accessiblit-host],[data-accessiblit-host] *))';
    scope.add(
      api.styles.addRule(`@media screen{
${root}{scroll-padding-top:max(var(--accessiblit-focus-owner-padding),var(--accessiblit-focus-clearance))!important;scroll-behavior:auto!important}
${root} ${page}:focus-visible:focus{outline:3px solid #000!important;outline-offset:3px!important;box-shadow:0 0 0 6px #fff!important}
@media(forced-colors:active){${root} ${page}:focus-visible:focus{outline-color:Highlight!important;box-shadow:none!important}}
}`),
    );
    scope.add(
      api.styles.setVariable('--accessiblit-focus-owner-padding', owner + 'px'),
    );
    let release: Cleanup = api.styles.setVariable(
        '--accessiblit-focus-clearance',
        '8px',
      ),
      last = 8,
      frame: number | undefined;
    scope.add(() => release());
    scope.add(api.styles.addClass('accessiblit-focus-highlight'));
    const update = () => {
      frame = undefined;
      if (!scope.active) return;
      const target = doc.activeElement;
      if (target?.closest('[data-accessiblit-host]')) return;
      try {
        const clearance = Math.max(
          owner,
          topClearance(doc, target ?? undefined),
        );
        if (clearance !== last) {
          release();
          release = api.styles.setVariable(
            '--accessiblit-focus-clearance',
            clearance + 'px',
          );
          last = clearance;
        }
        if (target && target !== doc.body && target !== doc.documentElement) {
          const box = target.getBoundingClientRect();
          if (box.top < clearance && box.bottom > 0)
            view.scrollBy({ top: box.top - clearance, behavior: 'instant' });
        }
      } catch {
        report(
          'focus',
          'Focus clearance could not be adjusted; the focus ring remains available.',
        );
      }
    };
    const schedule = () => {
      if (
        scope.active &&
        frame === undefined &&
        typeof view.requestAnimationFrame === 'function'
      )
        frame = view.requestAnimationFrame(update);
    };
    scope.add(api.listen(doc, 'focusin', schedule));
    scope.add(api.listen(view, 'resize', schedule));
    scope.add(() => {
      if (frame !== undefined) view.cancelAnimationFrame(frame);
      frame = undefined;
    });
    schedule();
    return scope.dispose;
  },
};

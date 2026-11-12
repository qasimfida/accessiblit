import type { Cleanup, Feature } from '../core/types';
import { isFeatureValue } from '../core/schema';
import { createReporter } from '../core/diagnostics';
import { ROOT_SELECTOR, textElements } from './dom';
import { createEffect } from './effect';
import { createMarks } from './marks';
import { observeContent } from './observe';
const OWNER = 'AccessiblitDyslexia';
const READABLE =
  'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const FALLBACK = 'ui-rounded, system-ui, sans-serif';
const ATTRIBUTE = 'data-accessiblit-readable-font';
/** Owner fonts are used only after every face is loaded; this feature never creates or loads a font. */
export function createReadableFont(dyslexiaFontUrl?: string): Feature {
  const report = createReporter();
  return {
    id: 'readableFont',
    group: 'content',
    label: 'Readable font',
    description: 'Use a system font or a preloaded owner font.',
    control: {
      type: 'select',
      values: ['off', 'readable', 'dyslexia-friendly'],
      labels: ['Off', 'Readable', 'Dyslexia-friendly'],
    },
    apply(value, api) {
      if (
        typeof value !== 'string' ||
        !isFeatureValue('readableFont', value) ||
        value === 'off'
      )
        return () => {};
      const scope = createEffect(api),
        marks = createMarks(api, ATTRIBUTE);
      scope.add(marks.clear);
      let fonts: FontFaceSet | undefined;
      try {
        fonts = api.document.fonts;
      } catch {
        report(
          'font-access',
          'Font availability could not be inspected; using the system fallback.',
        );
      }
      const family = () => {
        if (value === 'readable') return READABLE;
        if (dyslexiaFontUrl && fonts) {
          try {
            const faces = [...fonts].filter(
              (face) =>
                face.family
                  .trim()
                  .replace(/^['"]|['"]$/g, '')
                  .toLowerCase() === OWNER.toLowerCase(),
            );
            if (faces.length && faces.every((face) => face.status === 'loaded'))
              return `"${OWNER}", ${FALLBACK}`;
          } catch {
            report(
              'font-access',
              'Font availability could not be inspected; using the system fallback.',
            );
          }
          report(
            'font-unavailable',
            'Preload and register every AccessiblitDyslexia font face before init; the widget makes no font requests. Using the system fallback.',
          );
        }
        return FALLBACK;
      };
      let releaseFamily: Cleanup = () => {},
        currentFamily = '';
      scope.add(() => releaseFamily());
      const refreshFamily = () => {
        if (!scope.active) return;
        const next = family();
        if (next !== currentFamily) {
          releaseFamily();
          releaseFamily = api.styles.setVariable(
            '--accessiblit-readable-family',
            next,
          );
          currentFamily = next;
        }
      };
      const refresh = () => {
        const targets = new Set(
          textElements(api.document).filter(
            (element) => !element.closest('pre,code,kbd,samp,[role="img"]'),
          ),
        );
        for (const element of marks.nodes())
          if (!targets.has(element)) marks.remove(element);
        for (const element of targets) marks.set(element);
      };
      refresh();
      refreshFamily();
      scope.add(
        api.styles.addRule(
          `${ROOT_SELECTOR}.accessiblit-readable-font [${ATTRIBUTE}="${marks.value()}"]{font-family:var(--accessiblit-readable-family)!important}`,
        ),
      );
      scope.add(api.styles.addClass('accessiblit-readable-font'));
      scope.add(observeContent(api, refresh));
      if (value === 'dyslexia-friendly' && dyslexiaFontUrl && fonts)
        try {
          scope.add(api.listen(fonts, 'loadingdone', refreshFamily));
        } catch {
          report(
            'font-events',
            'Font readiness events are unavailable; using the current font choice.',
          );
        }
      return scope.dispose;
    },
  };
}

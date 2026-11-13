import { init, destroy } from '@qasimfida/accessiblit';
import type {
  FeatureId,
  AccessiblitOptions,
  ChangeEvent,
} from '@qasimfida/accessiblit';
const features: FeatureId[] = [
  'fontSize',
  'lineHeight',
  'letterSpacing',
  'wordSpacing',
  'textAlign',
  'contentScale',
  'readableFont',
  'darkMode',
  'highContrast',
  'monochrome',
  'lowSaturation',
  'readingGuide',
  'readingMask',
  'highlightLinks',
  'highlightHeadings',
  'bigCursor',
  'stopAnimations',
  'focusHighlight',
];
const options: AccessiblitOptions = {
  position: 'bottom-left',
  features,
  shortcut: false,
  offset: { x: 8, y: 8 },
  onChange(event: ChangeEvent) {
    const id: FeatureId = event.id;
    console.log(id, event.value);
  },
};
const widget = init(options);
const state: Record<FeatureId, unknown> = widget.getState();
widget.setFeature('bigCursor', 2);
widget.open();
widget.close();
widget.toggle();
widget.reset();
widget.destroy();
destroy();
console.log(state.fontSize);
// These must fail; unused expect-error directives fail the consumer compilation.
// @ts-expect-error Unknown feature names are not accepted.
const badId: FeatureId = 'madeUpFeature';
// @ts-expect-error Position autocomplete must retain the literal union.
init({ position: 'left-bottom' });
// @ts-expect-error Personal data is not part of the change event.
const badEvent: ChangeEvent = { id: 'fontSize', value: 110, email: 'fixture' };
console.log(badId, badEvent);

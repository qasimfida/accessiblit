import { createReporter } from '../core/diagnostics';
import { createScope } from '../core/scope';
import type { Feature, Messages } from '../core/types';
import type { ControlContext } from './control-types';

/** Site translations override registry wording without duplicating the feature catalogue. */
export function featureText(feature: Feature, messages: Messages) {
  return {
    label: messages.featureLabels[feature.id] ?? feature.label,
    description:
      messages.featureDescriptions[feature.id] ?? feature.description,
  };
}

/** Metadata supplies units and option labels, keeping future features out of UI code. */
export function valueText(
  feature: Feature,
  value: unknown,
  messages: Messages,
): string {
  const control = feature.control;
  if (control.type === 'toggle')
    return value === true ? messages.on : messages.off;
  if (control.type === 'select') {
    const index = control.values.indexOf(value as string | number | boolean);
    return control.labels?.[index] ?? String(value);
  }
  return `${String(value)}${control.unit ? ` ${control.unit}` : ''}`;
}

/** Changes are announced using the same label and value a sighted user sees. */
export function changeText(
  feature: Feature,
  value: unknown,
  messages: Messages,
): string {
  return `${featureText(feature, messages).label} ${valueText(feature, value, messages)}`;
}

/** Text-only DOM construction keeps translated strings out of HTML parsers. */
export function makeButton(doc: Document, text: string): HTMLButtonElement {
  const button = doc.createElement('button');
  button.type = 'button';
  button.textContent = text;
  return button;
}

/** A shared heading/description and teardown owner give every renderer the same semantics. */
export function controlShell(context: ControlContext) {
  const { document: doc, feature, messages, prefix } = context;
  const text = featureText(feature, messages);
  const element = doc.createElement('div');
  element.className = 'accessiblit-feature';
  const label = doc.createElement('h4');
  label.id = `${prefix}-${feature.id}-label`;
  label.textContent = text.label;
  const description = doc.createElement('p');
  description.id = `${prefix}-${feature.id}-description`;
  description.textContent = text.description;
  element.append(label, description);
  if (feature.requiresFinePointer) {
    const note = doc.createElement('p');
    note.className = 'accessiblit-cursor-note';
    note.textContent = messages.cursorAvailabilityNote ?? '';
    element.append(note);
  }
  const report = createReporter();
  const scope = createScope(() =>
    report(feature.id, 'A control cleanup failed.'),
  );
  scope.add(() => element.remove());
  return {
    element,
    scope,
    labelId: label.id,
    descriptionId: description.id,
    text,
  };
}

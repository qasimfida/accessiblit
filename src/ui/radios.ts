import { controlShell, valueText } from './presentation';
import type { ControlContext, RenderedControl } from './control-types';

/** Native radios provide the expected arrow/Space behavior and one tab stop per group. */
export function createRadios(context: ControlContext): RenderedControl {
  const control = context.feature.control;
  if (
    control.type !== 'select' ||
    !Array.isArray(control.values) ||
    !control.values.length ||
    control.values.some(
      (value) => typeof value !== 'string' && !Number.isFinite(value),
    ) ||
    new Set(control.values).size !== control.values.length
  )
    throw new Error('Invalid option metadata');
  const shell = controlShell(context);
  const group = context.document.createElement('div');
  group.className = 'accessiblit-options';
  group.setAttribute('role', 'radiogroup');
  group.setAttribute('aria-labelledby', shell.labelId);
  group.setAttribute('aria-describedby', shell.descriptionId);
  const inputs = control.values.map((value, index) => {
    const label = context.document.createElement('label');
    label.className = 'accessiblit-choice';
    const input = context.document.createElement('input');
    input.type = 'radio';
    input.name = `${context.prefix}-${context.feature.id}`;
    input.id = `${input.name}-${index}`;
    input.value = String(value);
    const text = context.document.createElement('span');
    text.textContent = valueText(context.feature, value, context.messages);
    label.append(input, text);
    group.append(label);
    shell.scope.listen(input, 'change', () => {
      if (input.checked) context.setValue(value);
    });
    return { input, value };
  });
  shell.element.append(group);
  const update = (value: unknown) => {
    if (shell.scope.active)
      for (const entry of inputs)
        entry.input.checked = Object.is(value, entry.value);
  };
  update(context.getValue());
  return { element: shell.element, update, destroy: shell.scope.dispose };
}

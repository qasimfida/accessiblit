import { controlShell, makeButton, valueText } from './presentation';
import type { ControlContext, RenderedControl } from './control-types';

/** Real buttons retain focus at range limits; aria-disabled explains an unavailable step. */
export function createStepper(context: ControlContext): RenderedControl {
  const range = context.feature.control;
  if (
    range.type !== 'range' ||
    ![range.min, range.max, range.step].every(Number.isFinite) ||
    range.max < range.min ||
    range.step <= 0
  )
    throw new Error('Invalid range metadata');
  const shell = controlShell(context);
  const value = context.document.createElement('span');
  value.id = `${context.prefix}-${context.feature.id}-value`;
  value.className = 'accessiblit-value';
  const group = context.document.createElement('div');
  group.className = 'accessiblit-stepper';
  group.setAttribute('role', 'group');
  group.setAttribute('aria-labelledby', shell.labelId);
  const buttons = [-1, 1].map((direction) => {
    const action =
      direction < 0 ? context.messages.decrease : context.messages.increase;
    const button = makeButton(context.document, action);
    button.className = 'accessiblit-step';
    const symbol = context.document.createElement('span');
    symbol.setAttribute('aria-hidden', 'true');
    symbol.textContent = direction < 0 ? '−' : '+';
    button.prepend(symbol);
    button.setAttribute('aria-label', `${action} ${shell.text.label}`);
    button.setAttribute(
      'aria-describedby',
      `${shell.descriptionId} ${value.id}`,
    );
    shell.scope.listen(button, 'click', () => {
      const current = numeric(context.getValue());
      const next = Math.min(
        range.max,
        Math.max(
          range.min,
          Math.round((current + direction * range.step) * 1e6) / 1e6,
        ),
      );
      if (next !== current) context.setValue(next);
    });
    group.append(button);
    return button;
  });
  function numeric(input: unknown): number {
    return typeof input === 'number' && Number.isFinite(input)
      ? input
      : range.type === 'range'
        ? range.min
        : 0;
  }
  shell.element.append(value, group);
  const update = (input: unknown) => {
    if (!shell.scope.active) return;
    const current = numeric(input);
    value.textContent = valueText(context.feature, current, context.messages);
    buttons[0]!.setAttribute('aria-disabled', String(current <= range.min));
    buttons[1]!.setAttribute('aria-disabled', String(current >= range.max));
  };
  update(context.getValue());
  return { element: shell.element, update, destroy: shell.scope.dispose };
}
